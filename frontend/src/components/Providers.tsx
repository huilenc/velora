"use client";
import { ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, optimism, base, bsc } from "wagmi/chains";
import { RPC_URL } from "@/lib/constants";

const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={RPC_URL}>
          {/* Empty wallets array — Wallet Standard (Phantom, Solflare) auto-registers */}
          <WalletProvider wallets={[]} autoConnect={false}>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
