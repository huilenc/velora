"use client";
import React, { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

const LiFiWidget = dynamic(
  async () => {
    const mod = await import("@lifi/widget");
    return { default: mod.LiFiWidget };
  },
  { ssr: false, loading: () => <WidgetSkeleton /> }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type LinkStatus = "loading" | "not_found" | "active" | "paid" | "settled";

interface BackendLink {
  id: string;
  amount: number;
  description: string;
  seller: string;
  status: "pendiente" | "pagado";
  createdAt: string;
}

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [backendLink, setBackendLink] = useState<BackendLink | null>(null);
  const [link, setLink] = useState<PaymentLinkAccount | null>(null);
  const [status, setStatus] = useState<LinkStatus>("loading");
  const [paying, setPaying] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"solana" | "crosschain">("solana");
  const [showConfirm, setShowConfirm] = useState(false);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();

  // 1. Try backend first (simple IDs like "abc123")
  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/links/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: BackendLink) => {
        setBackendLink(data);
        setStatus(data.status === "pagado" ? "settled" : "active");
      })
      .catch(() => {
        // Backend not found — try on-chain (Anchor-encoded ID)
        if (program) tryOnChain();
        else setStatus("not_found");
      });
  }, [id]); // eslint-disable-line

  // 2. On-chain fallback when program becomes available
  useEffect(() => {
    if (!backendLink && program && status === "loading") tryOnChain();
  }, [program]); // eslint-disable-line

  async function tryOnChain() {
    if (!id || !program) return;
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
  }

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

  // Derived display values — works for both backend and on-chain links
  const amountUsdc = backendLink
    ? backendLink.amount
    : link
    ? lamportsToUsdc(link.amount.toNumber())
    : 0;

  const sellerShort = backendLink
    ? backendLink.seller
    : link
    ? `${link.seller.toBase58().slice(0, 6)}…${link.seller.toBase58().slice(-4)}`
    : "";

  const description = backendLink?.description ?? (link as { description?: string } | null)?.description ?? "";

  const cardStyle: React.CSSProperties = {
    width: "100%", maxWidth: 480,
    borderRadius: "var(--radius-xl)",
    background: "linear-gradient(180deg, oklch(0.22 0.014 255 / 0.92), oklch(0.17 0.012 255 / 0.92))",
    border: "1px solid oklch(1 0 0 / 0.10)",
    boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.6)",
    backdropFilter: "blur(20px)", overflow: "hidden", color: "var(--ink)",
  };

  if (status === "loading") return (
    <Centered>
      <div className="acid-pulse" style={{ width: 48, height: 48, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", color: "var(--acid)" }}>
        <Icon name="bolt" size={22} />
      </div>
      <p style={{ color: "var(--ink-3)" }}>Loading payment link…</p>
    </Centered>
  );

  if (status === "not_found") return (
    <Centered>
      <div style={cardStyle}>
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Link not found</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>This payment link doesn&apos;t exist or has been cancelled.</div>
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
          <div style={{ margin: "0 auto 16px", width: 72, height: 72, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", boxShadow: "0 0 40px oklch(0.92 0.24 145 / 0.5)" }}>
            <Icon name="check" size={32} stroke="var(--acid)" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Payment settled</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-mono), monospace" }}>{amountUsdc} USDC</span> sent to {sellerShort}
          </div>
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

  // ── Active payment page ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative" }}>
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.92 0.24 145 / 0.15), transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ ...cardStyle, position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <VeloraMark size={20} withText={false} />
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pay to</div>
              <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--font-mono), monospace" }}>{sellerShort}</div>
            </div>
          </div>
          <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={6} /> Secure · Solana</span>
        </div>

        {/* Amount */}
        <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Amount due</div>
          <div style={{ marginTop: 6, fontSize: 52, fontWeight: 500, letterSpacing: "-0.03em", fontFamily: "var(--font-mono), monospace" }}>
            ${Math.floor(amountUsdc)}<span style={{ color: "var(--ink-3)" }}>.{String(amountUsdc.toFixed(2)).split(".")[1]}</span>
          </div>
          {description && <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{description}</div>}
        </div>

        {/* Payment mode tabs */}
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ display: "flex", gap: 6, background: "oklch(1 0 0 / 0.03)", borderRadius: 12, padding: 4, border: "1px solid oklch(1 0 0 / 0.06)" }}>
            <button
              onClick={() => setPaymentMode("solana")}
              style={{ flex: 1, height: 36, borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: paymentMode === "solana" ? "oklch(0.92 0.24 145 / 0.15)" : "transparent", color: paymentMode === "solana" ? "var(--acid)" : "var(--ink-3)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <ChainGlyph chain="sol" size={14} /> Pay with Solana
            </button>
            <button
              onClick={() => setPaymentMode("crosschain")}
              style={{ flex: 1, height: 36, borderRadius: 10, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: paymentMode === "crosschain" ? "oklch(0.72 0.18 295 / 0.15)" : "transparent", color: paymentMode === "crosschain" ? "var(--violet)" : "var(--ink-3)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="route" size={14} stroke={paymentMode === "crosschain" ? "var(--violet)" : "var(--ink-3)"} /> Cross-chain · LI.FI
            </button>
          </div>
        </div>

        {paymentMode === "solana" ? (
          <>
            {/* Route info */}
            <div style={{ margin: "0 20px 12px", padding: "10px 12px", borderRadius: 12, background: "oklch(0.72 0.18 295 / 0.06)", border: "1px solid oklch(0.72 0.18 295 / 0.20)", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="route" size={16} stroke="var(--violet)" />
              <div style={{ fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>USDC <Icon name="arrow" size={11} stroke="var(--ink-3)" /> <span style={{ color: "var(--acid)" }}>Solana escrow</span></div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>Anchor program · non-custodial · &lt;5s</div>
              </div>
            </div>

            {/* Wallet + Pay */}
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
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={paying}
                    style={{ height: 52, borderRadius: 14, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 15, cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 12px 28px -10px var(--acid-glow)" }}
                  >
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
          </>
        ) : (
          /* LI.FI cross-chain widget */
          <div style={{ padding: "0 16px 20px" }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="route" size={12} stroke="var(--violet)" />
              Bridge from any chain → USDC on Solana via LI.FI
            </div>
            <LiFiWidget
              integrator="paylink"
              config={{
                appearance: "dark",
                variant: "compact",
                theme: {
                  palette: {
                    primary: { main: "#84cc16" },
                    secondary: { main: "#a855f7" },
                  },
                  shape: { borderRadius: 14, borderRadiusSecondary: 10 },
                },
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid oklch(1 0 0 / 0.06)", fontSize: 10.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
          <span>Powered by PayLink · Anchor escrow on Solana</span>
          <span style={{ fontFamily: "var(--font-mono), monospace" }}>paylink.xyz</span>
        </div>
      </div>

      {/* Transaction confirmation modal */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "oklch(0.10 0.01 255 / 0.72)", backdropFilter: "blur(14px)", display: "grid", placeItems: "center", animation: "fadeIn .2s ease-out" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 400, padding: "28px 28px 24px", borderRadius: 22, background: "linear-gradient(180deg, oklch(0.22 0.014 255), oklch(0.17 0.012 255))", border: "1px solid oklch(1 0 0 / 0.12)", boxShadow: "0 40px 100px -20px oklch(0 0 0 / 0.6)", animation: "popIn .35s cubic-bezier(.16,1,.3,1)" }}
          >
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 18 }}>Confirm transaction</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              <Row label="Amount" value={`$${amountUsdc} USDC`} accent />
              {description && <Row label="For" value={description} />}
              <Row label="Recipient" value={sellerShort} mono />
              <Row label="Network fee" value="~$0.0008" mono />
              <Row label="Program" value="Anchor escrow · Solana devnet" mono />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowConfirm(false); handlePay(); }}
                style={{ flex: 1, height: 48, borderRadius: 12, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 24px -8px var(--acid-glow)" }}
              >
                Confirm & Pay
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ height: 48, padding: "0 16px", borderRadius: 12, background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)", color: "var(--ink-2)", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: accent ? "var(--acid)" : "var(--ink)", fontFamily: mono ? "var(--font-mono), monospace" : "inherit", fontWeight: accent ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div style={{ height: 420, borderRadius: 14, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 13 }}>
      Loading LI.FI widget…
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>{children}</div>;
}
