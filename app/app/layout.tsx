import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Velora — Cobra desde cualquier chain",
  description: "Generá un link de pago. Tu cliente paga con lo que tenga. Vos recibís USDC en Solana.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={geist.className}>{children}</body>
    </html>
  );
}