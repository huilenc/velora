"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Aurora, Particles, NetworkLines } from "@/components/decor";
import { Icon, ChainGlyph, VeloraMark, StatusDot, Sparkline, Counter } from "@/components/ui";
import { PaymentPageDemo, BalanceFloat, ActivityFloat, ChainSwitchFloat, MerchantDashboardPreview } from "@/components/mockups";

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "all .3s ease", background: scrolled ? "oklch(0.155 0.012 255 / 0.7)" : "transparent", backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none", borderBottom: scrolled ? "1px solid oklch(1 0 0 / 0.06)" : "1px solid transparent" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}><VeloraMark size={24} /></Link>
        <WalletCTA size={38} />
      </div>
    </header>
  );
}

// ── Connect Wallet button — shows confirm dialog before dashboard ─────────
function WalletCTA({ size = 44 }: { size?: number }) {
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (publicKey) setShowConfirm(true);
  }, [publicKey]);

  if (!mounted) {
    return (
      <div style={{
        height: size, minWidth: 160, borderRadius: 999,
        background: "oklch(1 0 0 / 0.06)",
        border: "1px solid oklch(1 0 0 / 0.10)",
      }} />
    );
  }

  return (
    <>
      <WalletMultiButton style={{ height: size }}>Connect Wallet</WalletMultiButton>

      {showConfirm && publicKey && (
        <div
          onClick={() => { setShowConfirm(false); disconnect(); }}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "oklch(0.10 0.01 255 / 0.72)", backdropFilter: "blur(14px)", display: "grid", placeItems: "center", animation: "fadeIn .2s ease-out" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 400, padding: "28px 28px 24px", borderRadius: 22, background: "linear-gradient(180deg, oklch(0.22 0.014 255), oklch(0.17 0.012 255))", border: "1px solid oklch(1 0 0 / 0.12)", boxShadow: "0 40px 100px -20px oklch(0 0 0 / 0.6)", animation: "popIn .35s cubic-bezier(.16,1,.3,1)" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.4)", display: "grid", placeItems: "center", color: "var(--acid)", marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Wallet connected</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 6, fontFamily: "var(--font-mono), monospace", background: "oklch(1 0 0 / 0.03)", padding: "8px 10px", borderRadius: 8, border: "1px solid oklch(1 0 0 / 0.06)", wordBreak: "break-all" }}>
              {publicKey.toBase58().slice(0, 20)}…{publicKey.toBase58().slice(-8)}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 22, lineHeight: 1.5 }}>
              Proceed to your PayLink dashboard to create and manage payment links.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowConfirm(false); router.push("/dashboard"); }}
                style={{ flex: 1, height: 44, borderRadius: 12, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Go to Dashboard →
              </button>
              <button
                onClick={() => { setShowConfirm(false); disconnect(); }}
                style={{ height: 44, padding: "0 16px", borderRadius: 12, background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)", color: "var(--ink-2)", fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ position: "relative", paddingTop: 120, paddingBottom: 80, minHeight: 880, overflow: "hidden" }}>
      <Aurora intensity={0.7} />
      <NetworkLines />
      <Particles count={32} intensity={0.7} />
      <div className="container" style={{ position: "relative", zIndex: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <span className="eyebrow">
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--acid)", boxShadow: "0 0 8px var(--acid)" }} />
              Built on Solana · LI.FI · x402
            </span>
            <h1 style={{ margin: "20px 0 22px", fontSize: "clamp(48px, 6.6vw, 80px)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 500 }}>
              Getting paid<br />
              in <span style={{ fontFamily: "var(--font-serif), serif", fontStyle: "italic", color: "var(--acid)" }}>crypto</span> has<br />
              never been<br />
              <span style={{ color: "var(--acid)", textShadow: "0 0 24px var(--acid-glow)" }}>easier.</span>
            </h1>
            <p style={{ fontSize: 19, color: "var(--ink-2)", lineHeight: 1.45, margin: "0 0 30px", maxWidth: 520 }}>
              Generate a link, accept any token from any chain, and receive{" "}
              <span style={{ color: "var(--acid)", fontFamily: "var(--font-mono), monospace", fontSize: 17 }}>USDC</span> on Solana — instantly.
            </p>
            <WalletCTA size={52} />
            <div style={{ marginTop: 38, paddingTop: 22, borderTop: "1px dashed oklch(1 0 0 / 0.08)", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
              {[{ label: "Settles in", val: <><Counter to={3.8} duration={1600} decimals={1} />s</> }, { label: "Avg. fee", val: <>${<Counter to={0.0008} duration={1800} decimals={4} />}</> }, { label: "Chains", val: <><Counter to={12} duration={1400} />+</> }, { label: "Settled YTD", val: <>${<Counter to={184} duration={1800} />}M</> }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "var(--font-mono), monospace" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: stacked visual */}
          <div style={{ position: "relative", height: 620 }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.92 0.24 145 / 0.30), transparent 60%)", filter: "blur(40px)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 3 }}><PaymentPageDemo /></div>
            <div style={{ position: "absolute", top: 0, left: -60, zIndex: 2 }}><BalanceFloat /></div>
            <div style={{ position: "absolute", bottom: 20, right: -40, zIndex: 4 }}><ActivityFloat /></div>
            <div style={{ position: "absolute", top: 30, right: -10, zIndex: 4 }}><ChainSwitchFloat /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MetricsTicker ──────────────────────────────────────────────────────────
function MetricsTicker() {
  const items = [
    { label: "Fees", val: "<$0.001", icon: "bolt" }, { label: "Confirmation", val: "<5s", icon: "clock" },
    { label: "Chains", val: "12+", icon: "globe" }, { label: "Uptime", val: "99.99%", icon: "shield" },
    { label: "Settled (24h)", val: "$2.4M", icon: "spark" }, { label: "Transactions", val: "184k", icon: "chart" },
    { label: "Wallets", val: "40+", icon: "wallet" }, { label: "x402 calls", val: "12.8k", icon: "route" },
  ];
  const loop = [...items, ...items];
  return (
    <section style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)", borderBottom: "1px solid oklch(1 0 0 / 0.06)", background: "oklch(0.165 0.012 255)", padding: "22px 0", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(90deg, oklch(0.165 0.012 255), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(-90deg, oklch(0.165 0.012 255), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ display: "flex", gap: 60, width: "max-content", animation: "ticker 38s linear infinite" }}>
        {loop.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ color: "var(--acid)" }}><Icon name={it.icon} size={18} /></span>
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>{it.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-mono), monospace", textShadow: "0 0 24px var(--acid-glow)" }}>{it.val}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
function BentoCard({ children, span, rowSpan, accent }: { children: React.ReactNode; span?: string; rowSpan?: number; accent?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    ref.current.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  };
  const bg = accent === "violet" ? "linear-gradient(180deg, oklch(0.72 0.18 295 / 0.08), oklch(0.18 0.012 255 / 0.5))"
    : accent === "acid" ? "linear-gradient(180deg, oklch(0.92 0.24 145 / 0.08), oklch(0.18 0.012 255 / 0.5))"
    : "linear-gradient(180deg, oklch(0.20 0.014 255 / 0.5), oklch(0.16 0.012 255 / 0.5))";
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.18)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.08)"; }} style={{ gridColumn: span, gridRow: rowSpan ? `span ${rowSpan}` : undefined, position: "relative", padding: 22, borderRadius: 20, background: bg, border: "1px solid oklch(1 0 0 / 0.08)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color .2s" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), oklch(0.92 0.24 145 / 0.06), transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>{children}</div>
    </div>
  );
}

function CardHeader({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", display: "grid", placeItems: "center", marginBottom: 14, color: "var(--acid)" }}><Icon name={icon} size={18} /></div>
      <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-.01em", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 460 }}>{text}</div>
    </div>
  );
}

function Features() {
  return (
    <section style={{ padding: "140px 0 100px", position: "relative" }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 56 }}>
          <span className="eyebrow"><Icon name="spark" size={12} /> Built for crypto-native payments</span>
          <h2 style={{ margin: 0, fontSize: "clamp(36px, 4.4vw, 64px)", letterSpacing: "-0.03em", lineHeight: 1.02, fontWeight: 500 }}>
            Everything you need to <span style={{ fontFamily: "var(--font-serif), serif", fontStyle: "italic", color: "var(--acid)" }}>accept&nbsp;crypto</span><br />without thinking about crypto.
          </h2>
          <p style={{ margin: 0, color: "var(--ink-2)", maxWidth: 640, fontSize: 18, lineHeight: 1.5 }}>PayLink handles wallet connection, chain bridging, token swaps, and final settlement — so your customers pay with whatever they have, and you receive USDC on Solana.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridAutoRows: "minmax(220px, auto)", gap: 16 }}>
          <BentoCard span="3 / span 3" rowSpan={2}>
            <CardHeader icon="route" title="Smart cross-chain routing" text="LI.FI-powered engine picks the cheapest path across 12+ chains, then bridges to USDC on Solana. Sub-5-second settlement." />
            <div style={{ flex: 1, position: "relative", marginTop: 18, minHeight: 140 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "oklch(0.72 0.18 295 / 0.10)", border: "1px solid oklch(0.72 0.18 295 / 0.30)", borderRadius: 10, fontSize: 12, color: "var(--violet)", width: "fit-content", margin: "0 auto" }}>
                <Icon name="route" size={14} /> ETH → Base → Arbitrum → <span style={{ color: "var(--acid)" }}>USDC on Solana</span>
              </div>
            </div>
          </BentoCard>
          <BentoCard span="span 3">
            <CardHeader icon="bolt" title="Instant settlement" text="Watch funds land in your treasury in real time. Anchor escrow program settles atomically." />
            <div style={{ flex: 1, marginTop: 14, display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", padding: 14, borderRadius: 12, background: "oklch(0.155 0.012 255)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.18)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", color: "var(--acid)" }} className="acid-pulse"><Icon name="check" size={18} /></div>
                  <div><div style={{ fontSize: 18, fontWeight: 500, fontFamily: "var(--font-mono), monospace" }}>+248.00 USDC</div><div style={{ fontSize: 11, color: "var(--ink-3)" }}>3.8s · finalized on Solana</div></div>
                </div>
              </div>
            </div>
          </BentoCard>
          <BentoCard span="span 3">
            <CardHeader icon="shield" title="Non-custodial by design" text="Funds never touch our servers. Anchor escrow program on Solana. You keep your keys." />
          </BentoCard>
          <BentoCard span="span 2">
            <CardHeader icon="globe" title="12+ chains" text="Accept any major token." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
              {["eth", "sol", "base", "arb", "op", "poly", "btc", "usdc"].map((c) => (
                <div key={c} style={{ aspectRatio: "1", borderRadius: 12, display: "grid", placeItems: "center", background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}><ChainGlyph chain={c} size={26} /></div>
              ))}
            </div>
          </BentoCard>
          <BentoCard span="span 2">
            <CardHeader icon="chart" title="Payment analytics" text="Volume, by-chain breakdowns, link status." />
            <div style={{ flex: 1, marginTop: 14, padding: 12, borderRadius: 12, background: "oklch(0.155 0.012 255)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}><span>Volume</span><span style={{ color: "var(--acid)", fontFamily: "var(--font-mono), monospace" }}>+22%</span></div>
              <Sparkline data={[12, 18, 16, 24, 22, 30, 28, 38, 34, 46, 52, 68, 72, 84]} width={220} height={50} />
            </div>
          </BentoCard>
          <BentoCard span="span 2">
            <CardHeader icon="link" title="Shareable links" text="One URL. Any wallet. Any chain. Works on mobile." />
          </BentoCard>
          <BentoCard span="span 3" accent="violet">
            <span className="chip chip-violet" style={{ alignSelf: "flex-start", fontSize: 10.5 }}>BONUS · x402 native</span>
            <CardHeader icon="bolt" title="Programmatic billing for AI agents" text="Charge per API call. Compatible with the x402 standard — your agents pay other agents in USDC, no humans in the loop." />
            <div style={{ flex: 1, marginTop: 18, padding: 12, borderRadius: 12, background: "oklch(0.155 0.012 255)", border: "1px solid oklch(1 0 0 / 0.06)", fontFamily: "var(--font-mono), monospace", fontSize: 11.5 }}>
              <div style={{ color: "var(--ink-3)" }}>$ curl /api/insight</div>
              <div style={{ color: "var(--violet)" }}>HTTP 402 Payment Required</div>
              <div style={{ color: "var(--acid)", marginTop: 4 }}>✓ paid · 200 OK<span className="caret" /></div>
            </div>
          </BentoCard>
          <BentoCard span="span 3" accent="acid">
            <span className="chip chip-acid" style={{ alignSelf: "flex-start", fontSize: 10.5 }}>NEW · Light Protocol</span>
            <CardHeader icon="lock" title="ZK-compressed private payments" text="Hide invoice amounts on-chain. The first payment processor to ship private settlement on Solana." />
            <div style={{ flex: 1, marginTop: 18, padding: 14, borderRadius: 12, background: "oklch(0.155 0.012 255)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "var(--ink-3)" }}>Amount</span><span style={{ fontSize: 18, fontWeight: 500, filter: "blur(3px)", fontFamily: "var(--font-mono), monospace" }}>████.██</span></div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}><span style={{ fontSize: 11, color: "var(--ink-3)" }}>ZK proof</span><span style={{ fontSize: 11, color: "var(--ink-2)", fontFamily: "var(--font-mono), monospace" }}>0x9c…fa1</span></div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

// ── ProductPreview ─────────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <section style={{ padding: "80px 0 100px", position: "relative" }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 56 }}>
          <span className="eyebrow"><Icon name="eye" size={12} /> Inside PayLink</span>
          <h2 style={{ margin: 0, fontSize: "clamp(36px, 4.4vw, 64px)", letterSpacing: "-0.03em", lineHeight: 1.02, fontWeight: 500 }}>
            One dashboard. <span style={{ fontFamily: "var(--font-serif), serif", fontStyle: "italic" }}>Every</span> chain.
          </h2>
          <p style={{ margin: 0, color: "var(--ink-2)", maxWidth: 640, fontSize: 18, lineHeight: 1.5 }}>Track payments in real-time, manage links, and see exactly where your USDC is coming from.</p>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-40px -10% -40px -10%", background: "radial-gradient(1000px 400px at 50% 50%, oklch(0.92 0.24 145 / 0.10), transparent 70%)", pointerEvents: "none" }} />
          <MerchantDashboardPreview />
        </div>
      </div>
    </section>
  );
}

// ── FinalCTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: "40px 0 100px" }}>
      <div className="container">
        <div style={{ padding: "64px 48px", borderRadius: 28, background: "radial-gradient(800px 400px at 50% 0%, oklch(0.92 0.24 145 / 0.20), transparent 70%), linear-gradient(180deg, oklch(0.20 0.014 255), oklch(0.16 0.012 255))", border: "1px solid oklch(1 0 0 / 0.10)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 20, right: 20 }}><span className="chip chip-acid" style={{ fontSize: 10.5 }}><StatusDot size={5} /> Live on Solana</span></div>
          <h2 style={{ margin: "0 0 18px", fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-.03em", lineHeight: 1.05, fontWeight: 500 }}>
            Start accepting <span style={{ fontFamily: "var(--font-serif), serif", fontStyle: "italic", color: "var(--acid)" }}>crypto</span><br />in 5 minutes.
          </h2>
          <p style={{ margin: "0 auto 28px", maxWidth: 560, color: "var(--ink-2)", fontSize: 18, lineHeight: 1.5 }}>
            No setup fee. <span style={{ color: "var(--acid)", fontFamily: "var(--font-mono), monospace", fontSize: 15 }}>0.4%</span> per settled transaction. Deploy to Solana devnet today.
          </p>
          <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <WalletCTA size={52} />
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: "var(--ink-3)" }}>Built on Solana · Powered by LI.FI · x402 native</div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)", padding: "40px 0 30px" }}>
      <div className="container" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <VeloraMark />
          <p style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5, marginTop: 14, maxWidth: 280 }}>Crypto payments without the chaos. Receive USDC on Solana from any chain, any token.</p>
        </div>
        {[["Product", ["Payment links", "Dashboard", "x402 API", "ZK private"]], ["Developers", ["Docs", "SDK", "GitHub", "Status"]], ["Legal", ["Terms", "Privacy", "Security", "Audit"]]].map(([h, items]) => (
          <div key={h as string}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>{h}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(items as string[]).map((i) => <a key={i} href="#" style={{ color: "var(--ink-2)", textDecoration: "none", fontSize: 13.5 }}>{i}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="container" style={{ marginTop: 40, paddingTop: 24, borderTop: "1px dashed oklch(1 0 0 / 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-3)" }}>
        <span>© 2026 PayLink · Built for the Solana / ElevenLabs hackathon</span>
        <span style={{ fontFamily: "var(--font-mono), monospace" }}>paylink.xyz</span>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <MetricsTicker />
      <Features />
      <ProductPreview />
      <FinalCTA />
      <Footer />
    </div>
  );
}
