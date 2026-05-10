"use client";
import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/program";
import { getConfigPda, getPaymentLinkPda, getEscrowVaultPda, decodeLinkParam } from "@/lib/pdas";
import { USDC_MINT, lamportsToUsdc } from "@/lib/constants";
import { Icon, ChainGlyph, VeloraMark, StatusDot } from "@/components/ui";
import type { PaymentLinkAccount } from "@/lib/idl";

type LinkStatus = "loading" | "not_found" | "active" | "paid" | "settled";

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [link, setLink] = useState<PaymentLinkAccount | null>(null);
  const [status, setStatus] = useState<LinkStatus>("loading");
  const [paying, setPaying] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChains, setShowChains] = useState(false);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();

  useEffect(() => {
    if (!id || !program) return;
    (async () => {
      try {
        const { seller, linkId } = decodeLinkParam(id);
        const [pda] = getPaymentLinkPda(seller, linkId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (program.account as any).paymentLink.fetch(pda);
        setLink(data);
        if (data.isSettled) setStatus("settled");
        else if (data.isPaid) setStatus("paid");
        else setStatus("active");
      } catch {
        setStatus("not_found");
      }
    })();
  }, [id, program]);

  async function handlePay() {
    if (!id || !program || !publicKey || !link) return;
    setError(null);
    setPaying(true);
    try {
      const { seller, linkId } = decodeLinkParam(id);
      const [configPda] = getConfigPda(seller);
      const [paymentLinkPda] = getPaymentLinkPda(seller, linkId);
      const [escrowVaultPda] = getEscrowVaultPda(seller, linkId);
      const buyerToken = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      const tokenAcc = await connection.getTokenAccountBalance(buyerToken);
      if (BigInt(tokenAcc.value.amount) < BigInt(link.amount.toString())) {
        throw new Error(`Need ${lamportsToUsdc(link.amount.toNumber())} USDC but have ${tokenAcc.value.uiAmount}`);
      }
      const sig = await program.methods.pay().accounts({ config: configPda, paymentLink: paymentLinkPda, escrowVault: escrowVaultPda, buyerToken, buyer: publicKey, tokenProgram: TOKEN_PROGRAM_ID }).rpc();
      setTxSig(sig);
      setStatus("paid");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (program.account as any).paymentLink.fetch(paymentLinkPda);
      setLink(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  const amountUsdc = link ? lamportsToUsdc(link.amount.toNumber()) : 0;
  const sellerShort = link ? `${link.seller.toBase58().slice(0, 6)}…${link.seller.toBase58().slice(-4)}` : "";

  const cardStyle: React.CSSProperties = { width: "100%", maxWidth: 460, borderRadius: "var(--radius-xl)", background: "linear-gradient(180deg, oklch(0.22 0.014 255 / 0.92), oklch(0.17 0.012 255 / 0.92))", border: "1px solid oklch(1 0 0 / 0.10)", boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.6)", backdropFilter: "blur(20px)", overflow: "hidden", color: "var(--ink)" };

  if (status === "loading") return (
    <Centered><div className="acid-pulse" style={{ width: 48, height: 48, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", color: "var(--acid)" }}><Icon name="bolt" size={22} /></div><p style={{ color: "var(--ink-3)" }}>Loading payment link…</p></Centered>
  );

  if (status === "not_found") return (
    <Centered>
      <div style={cardStyle}>
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Link not found</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>This payment link doesn't exist or has been cancelled.</div>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, height: 44, padding: "0 18px", borderRadius: 999, background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.10)", color: "var(--ink)", textDecoration: "none", fontSize: 13 }}>← Back to PayLink</Link>
        </div>
      </div>
    </Centered>
  );

  if (status === "settled") return (
    <Centered>
      <div style={cardStyle}>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 0.06)" }}>
          <VeloraMark size={20} withText={false} />
          <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={6} /> Settled</span>
        </div>
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ margin: "0 auto 16px", width: 72, height: 72, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", boxShadow: "0 0 40px oklch(0.92 0.24 145 / 0.5)" }}><Icon name="check" size={32} stroke="var(--acid)" /></div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Payment settled</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}><span style={{ fontFamily: "var(--font-mono), monospace" }}>{amountUsdc} USDC</span> sent to {sellerShort}</div>
        </div>
      </div>
    </Centered>
  );

  if (status === "paid") return (
    <Centered>
      <div style={cardStyle}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid oklch(1 0 0 / 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <VeloraMark size={20} withText={false} />
          <span className="chip chip-amber" style={{ fontSize: 10 }}>⏳ In escrow</span>
        </div>
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Payment in escrow</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>Funds are held on-chain. The seller will settle shortly.</div>
          {txSig && <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 16, fontSize: 12, color: "var(--acid)", fontFamily: "var(--font-mono), monospace" }}>View tx on Solana Explorer ↗</a>}
        </div>
      </div>
    </Centered>
  );

  // Active — main payment UI
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.92 0.24 145 / 0.15), transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ ...cardStyle, position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <VeloraMark size={20} withText={false} />
            <div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pay to</div><div style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono), monospace" }}>{sellerShort}</div></div>
          </div>
          <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={6} /> Secure · Solana</span>
        </div>

        {/* Amount */}
        <div style={{ padding: "28px 24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Amount due</div>
          <div style={{ marginTop: 6, fontSize: 52, fontWeight: 500, letterSpacing: "-0.03em", fontFamily: "var(--font-mono), monospace" }}>
            ${Math.floor(amountUsdc)}<span style={{ color: "var(--ink-3)" }}>.{String(amountUsdc.toFixed(2)).split(".")[1]}</span>
          </div>
          {link?.description && <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{link.description}</div>}
        </div>

        {/* Chain selector */}
        <div style={{ padding: "0 20px 4px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>Pay from</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {[{ id: "sol", name: "Solana", note: "direct" }, { id: "eth", name: "Ethereum", note: "via LI.FI" }, { id: "base", name: "Base", note: "via LI.FI" }, { id: "arb", name: "Arbitrum", note: "via LI.FI" }].map((c, i) => (
              <button key={c.id} onClick={() => setShowChains(false)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, border: i === 0 ? "1px solid oklch(0.92 0.24 145 / 0.5)" : "1px solid oklch(1 0 0 / 0.08)", background: i === 0 ? "oklch(0.92 0.24 145 / 0.10)" : "oklch(1 0 0 / 0.03)", color: i === 0 ? "var(--acid)" : "var(--ink-2)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                <ChainGlyph chain={c.id} size={14} />{c.name} <span style={{ fontSize: 10, opacity: 0.6 }}>· {c.note}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Route info */}
        <div style={{ margin: "12px 20px", padding: "10px 12px", borderRadius: 12, background: "oklch(0.72 0.18 295 / 0.06)", border: "1px solid oklch(0.72 0.18 295 / 0.20)", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="route" size={16} stroke="var(--violet)" />
          <div style={{ fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>USDC <Icon name="arrow" size={11} stroke="var(--ink-3)" /> <span style={{ color: "var(--acid)" }}>Solana escrow</span></div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>Anchor program · non-custodial · &lt;5s</div>
          </div>
        </div>

        {/* Wallet + Pay button */}
        <div style={{ padding: "4px 20px 20px" }}>
          {!publicKey ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Connect your Solana wallet to pay</div>
              <WalletMultiButton />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-3)" }}>
                <span style={{ fontFamily: "var(--font-mono), monospace" }}>{publicKey.toBase58().slice(0, 8)}…</span>
                <WalletMultiButton />
              </div>
              {error && <div style={{ background: "oklch(0.78 0.16 25 / 0.10)", border: "1px solid oklch(0.78 0.16 25 / 0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "var(--rose)" }}>{error}</div>}
              <button onClick={handlePay} disabled={paying} style={{ height: 52, borderRadius: 14, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 15, cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 12px 28px -10px var(--acid-glow)" }}>
                {paying ? "Sending to escrow…" : <><Icon name="bolt" size={18} stroke="#0a0c0a" /> Pay ${amountUsdc} USDC</>}
              </button>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontSize: 10.5, color: "var(--ink-3)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="lock" size={11} /> Non-custodial</span>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Network fee <span style={{ color: "var(--acid)", fontFamily: "var(--font-mono), monospace" }}>~$0.0008</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid oklch(1 0 0 / 0.06)", fontSize: 10.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
          <span>Powered by PayLink · Anchor escrow on Solana</span>
          <span style={{ fontFamily: "var(--font-mono), monospace" }}>paylink.xyz</span>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>{children}</div>;
}
