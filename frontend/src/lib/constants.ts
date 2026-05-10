import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CoZag4akYjdga6TLTaDRXSv49ArbJjWtz5gFiJNNNNpG"
);

// Devnet USDC (Circle faucet)
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export const PLATFORM_FEE_BPS = 250; // 2.5%

export const USDC_DECIMALS = 6;

export function usdcToLamports(usdc: number): bigint {
  return BigInt(Math.round(usdc * 10 ** USDC_DECIMALS));
}

export function lamportsToUsdc(lamports: bigint | number): number {
  return Number(lamports) / 10 ** USDC_DECIMALS;
}
