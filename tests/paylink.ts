import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import BN from "bn.js";

describe("paylink", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Workspace as Program<Workspace>;
  const authority = provider.wallet as anchor.Wallet;

  let mint: PublicKey;
  let sellerTokenAccount: PublicKey;
  let buyerTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  const buyer = Keypair.generate();
  const treasury = Keypair.generate();
  const LINK_ID = new BN(1);
  const AMOUNT = new BN(200_000_000); // 200 USDC (6 decimals)
  const FEE_BPS = 250; // 2.5%

  let configPda: PublicKey;
  let paymentLinkPda: PublicKey;
  let escrowVaultPda: PublicKey;

  before(async () => {
    // Airdrop to buyer
    await provider.connection.requestAirdrop(buyer.publicKey, 2e9);

    // Create USDC-like mint
    mint = await createMint(
      provider.connection,
      authority.payer,
      authority.publicKey,
      null,
      6
    );

    // Create token accounts
    sellerTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority.payer,
      mint,
      authority.publicKey
    );
    buyerTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority.payer,
      mint,
      buyer.publicKey
    );
    treasuryTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority.payer,
      mint,
      treasury.publicKey
    );

    // Mint 1000 USDC to buyer
    await mintTo(
      provider.connection,
      authority.payer,
      mint,
      buyerTokenAccount,
      authority.publicKey,
      1000_000_000
    );

    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), authority.publicKey.toBuffer()],
      program.programId
    );
    [paymentLinkPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment_link"),
        authority.publicKey.toBuffer(),
        LINK_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    [escrowVaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow_vault"),
        authority.publicKey.toBuffer(),
        LINK_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  });

  it("initializes config", async () => {
    await program.methods
      .initializeConfig(FEE_BPS, treasury.publicKey)
      .accounts({
        config: configPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.config.fetch(configPda);
    assert.equal(config.feeBps, FEE_BPS);
    assert.equal(config.treasury.toBase58(), treasury.publicKey.toBase58());
    assert.isTrue(config.isActive);
    assert.isFalse(config.isPaused);
  });

  it("creates a payment link with escrow vault", async () => {
    await program.methods
      .createPaymentLink(
        LINK_ID,
        AMOUNT,
        "Diseño de logo",
        false,
        new BN(0)
      )
      .accounts({
        config: configPda,
        paymentLink: paymentLinkPda,
        escrowVault: escrowVaultPda,
        mint,
        seller: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const link = await program.account.paymentLink.fetch(paymentLinkPda);
    assert.equal(link.amount.toString(), AMOUNT.toString());
    assert.equal(link.description, "Diseño de logo");
    assert.isFalse(link.isPaid);
    assert.isFalse(link.isSettled);
    assert.isTrue(link.isActive);

    // Verify escrow vault was created and is empty
    const vault = await getAccount(provider.connection, escrowVaultPda);
    assert.equal(vault.amount.toString(), "0");
  });

  it("buyer pays into escrow", async () => {
    await program.methods
      .pay()
      .accounts({
        config: configPda,
        paymentLink: paymentLinkPda,
        escrowVault: escrowVaultPda,
        buyerToken: buyerTokenAccount,
        buyer: buyer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const link = await program.account.paymentLink.fetch(paymentLinkPda);
    assert.isTrue(link.isPaid);
    assert.equal(link.buyer.toBase58(), buyer.publicKey.toBase58());

    const vault = await getAccount(provider.connection, escrowVaultPda);
    assert.equal(vault.amount.toString(), AMOUNT.toString());
  });

  it("seller settles payment", async () => {
    await program.methods
      .settle()
      .accounts({
        config: configPda,
        paymentLink: paymentLinkPda,
        escrowVault: escrowVaultPda,
        sellerToken: sellerTokenAccount,
        treasuryToken: treasuryTokenAccount,
        seller: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const link = await program.account.paymentLink.fetch(paymentLinkPda);
    assert.isTrue(link.isSettled);
    assert.isFalse(link.isActive);

    const expectedFee = AMOUNT.muln(FEE_BPS).divn(10000);
    const expectedSeller = AMOUNT.sub(expectedFee);

    const sellerAcc = await getAccount(provider.connection, sellerTokenAccount);
    assert.equal(sellerAcc.amount.toString(), expectedSeller.toString());

    const treasuryAcc = await getAccount(
      provider.connection,
      treasuryTokenAccount
    );
    assert.equal(treasuryAcc.amount.toString(), expectedFee.toString());
  });
});
