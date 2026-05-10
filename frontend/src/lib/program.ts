"use client";
import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "./idl";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed" }
    );
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Program(IDL as any, provider);
    } catch (e) {
      console.warn("Anchor Program init failed (expected until deployed):", e);
      return null;
    }
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);
}
