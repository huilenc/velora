import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

const PROGRAM_ID = new PublicKey("CoZag4akYjdga6TLTaDRXSv49ArbJjWtz5gFiJNNNNpG");

export const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  "confirmed"
);

export interface ParsedPaymentLink {
  isX402: boolean;
  isPaid: boolean;
  isSettled: boolean;
  isActive: boolean;
  amount: BN;
  description: string;
  seller: PublicKey;
  buyer: PublicKey;
  linkId: BN;
}

export function getPaymentLinkPda(seller: PublicKey, linkId: BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment_link"),
      seller.toBuffer(),
      linkId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return pda;
}

// "{base58seller}-{linkId}" — same encoding as the frontend URL param
export function decodeLinkParam(param: string): { seller: PublicKey; linkId: BN } {
  const sep = param.indexOf("-");
  if (sep === -1) throw new Error("Invalid link param format");
  return {
    seller: new PublicKey(param.slice(0, sep)),
    linkId: new BN(param.slice(sep + 1)),
  };
}

// Deserialize raw Anchor account data without requiring the full Anchor SDK.
// Layout (after 8-byte discriminator):
//   bump(1) seller(32) mint(32) amount(8) description(4+N)
//   isActive(1) isPaid(1) isSettled(1) isX402(1)
//   createdAt(8) linkId(8) buyer(32) paidAt(8) config(32) expiresAt(8)
export async function fetchPaymentLink(
  seller: PublicKey,
  linkId: BN
): Promise<ParsedPaymentLink | null> {
  const pda = getPaymentLinkPda(seller, linkId);
  const info = await connection.getAccountInfo(pda);
  if (!info) return null;

  const d = info.data;
  let o = 8; // skip discriminator

  o += 1; // bump
  const sellerKey = new PublicKey(d.slice(o, o + 32)); o += 32;
  o += 32; // mint
  const amount = new BN(d.slice(o, o + 8), "le"); o += 8;

  const descLen = d.readUInt32LE(o); o += 4;
  const description = d.slice(o, o + descLen).toString("utf8"); o += descLen;

  const isActive   = d[o++] === 1;
  const isPaid     = d[o++] === 1;
  const isSettled  = d[o++] === 1;
  const isX402     = d[o++] === 1;

  o += 8; // createdAt
  const linkIdOnChain = new BN(d.slice(o, o + 8), "le"); o += 8;
  const buyerKey = new PublicKey(d.slice(o, o + 32)); o += 32;

  return {
    isX402, isPaid, isSettled, isActive,
    amount, description,
    seller: sellerKey,
    buyer: buyerKey,
    linkId: linkIdOnChain,
  };
}
