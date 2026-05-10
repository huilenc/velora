import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./constants";

export function getConfigPda(seller: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config"), seller.toBuffer()],
    PROGRAM_ID
  );
}

export function getPaymentLinkPda(
  seller: PublicKey,
  linkId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment_link"),
      seller.toBuffer(),
      linkId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

export function getEscrowVaultPda(
  seller: PublicKey,
  linkId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow_vault"),
      seller.toBuffer(),
      linkId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
}

// URL param encoding: /pay/{base58seller}-{linkId}
export function encodeLinkParam(seller: PublicKey, linkId: BN): string {
  return `${seller.toBase58()}-${linkId.toString()}`;
}

export function decodeLinkParam(param: string): {
  seller: PublicKey;
  linkId: BN;
} {
  const dashIdx = param.indexOf("-");
  const sellerBase58 = param.slice(0, dashIdx);
  const linkIdStr = param.slice(dashIdx + 1);
  return {
    seller: new PublicKey(sellerBase58),
    linkId: new BN(linkIdStr),
  };
}
