"use client";
import React from "react";
import { ChainGlyph, Icon, VeloraMark, StatusDot, Sparkline } from "./ui";

// ── PaymentPageDemo ────────────────────────────────────────────────────────
// Auto-cycling mock for landing page hero (not connected to Solana)
export function PaymentPageDemo() {
  const [stage, setStage] = React.useState<"connect" | "pay" | "success">("connect");
  const [chain, setChain] = React.useState("eth");

  React.useEffect(() => {
    const order = ["connect", "pay", "success"] as const;
    const t = setInterval(() => setStage((s) => order[(order.indexOf(s) + 1) % order.length]), 4200);
    return () => clearInterval(t);
  }, []);

  const chains = [
    { id: "eth", name: "Ethereum" }, { id: "base", name: "Base" },
    { id: "arb", name: "Arbitrum" }, { id: "op", name: "Optimism" },
    { id: "poly", name: "Polygon" }, { id: "sol", name: "Solana" },
  ];

  return (
    <div style={{ width: 400, borderRadius: "var(--radius-xl)", background: "linear-gradient(180deg, oklch(0.22 0.014 255 / 0.92), oklch(0.17 0.012 255 / 0.92))", border: "1px solid oklch(1 0 0 / 0.10)", boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0 0 0 / 0.4)", backdropFilter: "blur(20px)", overflow: "hidden", color: "var(--ink)" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VeloraMark size={20} withText={false} />
          <div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pay to</div><div style={{ fontSize: 13, fontWeight: 500 }}>Helia Labs</div></div>
        </div>
        <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={6} /> Secure</span>
      </div>

      <div style={{ padding: "24px 20px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Amount due</div>
        <div style={{ marginTop: 6, fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", fontFamily: "var(--font-mono), monospace" }}>$248<span style={{ color: "var(--ink-3)" }}>.00</span></div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>Invoice <span style={{ fontFamily: "var(--font-mono), monospace" }}>#vlr_8a91</span> · expires in 14:22</div>
      </div>

      {stage === "connect" && (
        <div style={{ padding: "4px 20px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 10 }}>Connect your wallet</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ n: "MetaMask", c: "oklch(0.78 0.16 60)" }, { n: "Phantom", c: "oklch(0.72 0.18 295)" }, { n: "Coinbase", c: "oklch(0.65 0.18 245)" }, { n: "WalletConnect", c: "oklch(0.65 0.16 215)" }].map((w) => (
              <button key={w.n} style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", padding: "12px 12px", borderRadius: 12, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: w.c }} />{w.n}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "pay" && (
        <div style={{ padding: "4px 20px 18px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {chains.map((c) => (
              <button key={c.id} onClick={() => setChain(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 999, border: chain === c.id ? "1px solid oklch(0.92 0.24 145 / 0.5)" : "1px solid oklch(1 0 0 / 0.08)", background: chain === c.id ? "oklch(0.92 0.24 145 / 0.10)" : "oklch(1 0 0 / 0.03)", color: chain === c.id ? "var(--acid)" : "var(--ink-2)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                <ChainGlyph chain={c.id} size={14} />{c.name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: "oklch(1 0 0 / 0.03)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)" }}><span>You pay</span><span>Balance <span style={{ fontFamily: "var(--font-mono), monospace" }}>2.418 ETH</span></span></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.02em", fontFamily: "var(--font-mono), monospace" }}>0.0742</div>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                <ChainGlyph chain="eth" size={14} /> ETH ▾
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, fontFamily: "var(--font-mono), monospace" }}>≈ $248.00 · 1 ETH = $3,342.10</div>
          </div>
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "oklch(0.72 0.18 295 / 0.06)", border: "1px solid oklch(0.72 0.18 295 / 0.20)", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="route" size={16} stroke="var(--violet)" />
            <div style={{ fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>ETH <Icon name="arrow" size={12} stroke="var(--ink-3)" /> USDC <Icon name="arrow" size={12} stroke="var(--ink-3)" /> <span style={{ color: "var(--violet)" }}>Solana</span></div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>Smart route via LI.FI · est. 38s</div>
            </div>
          </div>
          <button style={{ marginTop: 14, width: "100%", height: 48, border: "none", borderRadius: 14, background: "var(--acid)", color: "#0a0c0a", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 12px 28px -10px var(--acid-glow)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="bolt" size={16} stroke="#0a0c0a" /> Confirm · $248.00
          </button>
        </div>
      )}

      {stage === "success" && (
        <div style={{ padding: "8px 20px 24px", textAlign: "center" }}>
          <div style={{ margin: "4px auto 14px", width: 64, height: 64, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.15)", border: "1px solid oklch(0.92 0.24 145 / 0.5)", display: "grid", placeItems: "center", boxShadow: "0 0 30px oklch(0.92 0.24 145 / 0.5)" }}>
            <Icon name="check" size={28} stroke="var(--acid)" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Payment received</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>248.00 USDC settled on Solana · 3.8s</div>
        </div>
      )}

      <div style={{ padding: "10px 20px", borderTop: "1px solid oklch(1 0 0 / 0.06)", fontSize: 10.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
        <span>Powered by paylink</span>
        <span style={{ fontFamily: "var(--font-mono), monospace" }}>paylink.xyz/pay/demo</span>
      </div>
    </div>
  );
}

// ── Float cards ────────────────────────────────────────────────────────────
export function BalanceFloat() {
  const data = [12, 18, 14, 22, 28, 24, 32, 30, 38, 42, 40, 48, 55, 52, 62, 68, 72, 78, 82, 88];
  return (
    <div className="float" style={{ width: 260, padding: 16, borderRadius: 18, background: "linear-gradient(180deg, oklch(0.22 0.014 255 / 0.92), oklch(0.17 0.012 255 / 0.92))", border: "1px solid oklch(1 0 0 / 0.10)", boxShadow: "0 24px 60px -20px oklch(0 0 0 / 0.5)", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Balance</div>
        <span className="chip chip-acid"><StatusDot size={6} /> live</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.02em", marginTop: 6, fontFamily: "var(--font-mono), monospace" }}>$84,213<span style={{ color: "var(--ink-3)" }}>.42</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}><span style={{ color: "var(--acid)", fontFamily: "var(--font-mono), monospace" }}>+12.4%</span><span style={{ color: "var(--ink-3)" }}>this week</span></div>
      <div style={{ marginTop: 10 }}><Sparkline data={data} width={228} height={48} /></div>
    </div>
  );
}

export function ActivityFloat() {
  const items = [
    { who: "maya@design", amt: "$248.00", chain: "eth", t: "just now", acid: true },
    { who: "pierre.b", amt: "$1,420.00", chain: "base", t: "12s" },
    { who: "kai_studio", amt: "$96.50", chain: "sol", t: "1m" },
  ];
  return (
    <div className="float-slow" style={{ width: 280, padding: 14, borderRadius: 18, background: "linear-gradient(180deg, oklch(0.22 0.014 255 / 0.92), oklch(0.17 0.012 255 / 0.92))", border: "1px solid oklch(1 0 0 / 0.10)", boxShadow: "0 24px 60px -20px oklch(0 0 0 / 0.5)", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>Recent payments</div>
        <span className="chip" style={{ fontSize: 10 }}>live</span>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: it.acid ? "oklch(0.92 0.24 145 / 0.08)" : "oklch(1 0 0 / 0.025)", border: it.acid ? "1px solid oklch(0.92 0.24 145 / 0.25)" : "1px solid oklch(1 0 0 / 0.04)", marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "oklch(1 0 0 / 0.06)", display: "grid", placeItems: "center", fontSize: 11 }}>{it.who.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.who}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4 }}><ChainGlyph chain={it.chain} size={11} /> {it.t}</div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, fontFamily: "var(--font-mono), monospace" }}>{it.amt}</div>
        </div>
      ))}
    </div>
  );
}

export function ChainSwitchFloat() {
  return (
    <div className="float" style={{ animationDelay: "-3s", padding: "10px 14px", borderRadius: 999, background: "linear-gradient(90deg, oklch(0.65 0.18 245 / 0.25), oklch(0.72 0.18 295 / 0.25))", border: "1px solid oklch(1 0 0 / 0.18)", backdropFilter: "blur(16px)", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 18px 40px -14px oklch(0 0 0 / 0.5)" }}>
      <ChainGlyph chain="eth" size={20} />
      <Icon name="arrow" size={14} stroke="var(--ink-2)" />
      <ChainGlyph chain="sol" size={20} />
      <span style={{ fontSize: 12, fontFamily: "var(--font-mono), monospace" }}><span style={{ color: "var(--acid)" }}>+248.00</span> USDC</span>
    </div>
  );
}

// ── MerchantDashboardPreview ───────────────────────────────────────────────
// Static preview mockup for the landing page "Product" section
export function MerchantDashboardPreview() {
  const data = [40, 52, 46, 68, 62, 80, 72, 90, 84, 110, 98, 124, 118, 136, 128, 152, 148, 170, 164, 188, 180, 210, 202, 234, 222];
  return (
    <div style={{ width: "100%", borderRadius: 18, background: "linear-gradient(180deg, oklch(0.18 0.012 255), oklch(0.15 0.01 255))", border: "1px solid oklch(1 0 0 / 0.08)", boxShadow: "0 40px 100px -30px oklch(0 0 0 / 0.7)", overflow: "hidden", display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 500 }}>
      <aside style={{ borderRight: "1px solid oklch(1 0 0 / 0.06)", padding: "18px 14px", background: "oklch(0.165 0.012 255)" }}>
        <VeloraMark size={20} />
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 2 }}>
          {[["chart", "Overview", true], ["bolt", "Payments", false], ["link", "Links", false], ["spark", "Analytics", false]].map(([ic, label, active], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: active ? "oklch(1 0 0 / 0.06)" : "transparent", color: active ? "var(--ink)" : "var(--ink-2)", fontSize: 13, borderLeft: active ? "2px solid var(--acid)" : "2px solid transparent" }}>
              <Icon name={ic as string} size={16} />{label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: 12, borderRadius: 12, background: "oklch(0.92 0.24 145 / 0.07)", border: "1px solid oklch(0.92 0.24 145 / 0.20)" }}>
          <div style={{ fontSize: 11, color: "var(--acid)", fontWeight: 500 }}>x402 Enabled</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>6 active endpoints</div>
        </div>
      </aside>
      <main style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 18, fontWeight: 500 }}>Overview</div><div style={{ fontSize: 12, color: "var(--ink-3)" }}>Last 30 days</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="chip chip-acid"><StatusDot size={6} /> Live</span>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 999, background: "var(--acid)", color: "#0a0c0a", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Icon name="plus" size={14} stroke="#0a0c0a" /> New link</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[{ label: "Volume", val: "$284,610", delta: "+18.2%", spark: [20, 28, 22, 30, 40, 38, 52, 48, 62, 68, 80], color: "var(--acid)" }, { label: "Txns", val: "1,284", delta: "+12.4%", spark: [12, 18, 14, 22, 28, 24, 32, 30, 38, 42, 40], color: "var(--cyan)" }, { label: "Settle", val: "3.8s", delta: "↓0.4s", spark: [8, 7, 8, 6, 5, 6, 5, 4, 4, 4, 3], color: "var(--violet)" }, { label: "Fee", val: "$0.0008", delta: "↓12%", spark: [5, 6, 5, 4, 5, 4, 4, 3, 3, 4, 3], color: "var(--amber)" }].map((k, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 12, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.02em", marginTop: 4, fontFamily: "var(--font-mono), monospace" }}>{k.val}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: k.color }}>{k.delta}</span>
                <Sparkline data={k.spark} width={56} height={20} stroke={k.color} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderRadius: 14, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)", flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Settlement volume</div>
          <svg viewBox="0 0 560 160" width="100%" height={160} style={{ display: "block" }}>
            <defs><linearGradient id="bigArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="oklch(0.92 0.24 145)" stopOpacity="0.45" /><stop offset="1" stopColor="oklch(0.92 0.24 145)" stopOpacity="0" /></linearGradient></defs>
            {(() => {
              const W = 560, H = 160, P = 12;
              const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
              const step = (W - P * 2) / (data.length - 1);
              const pts = data.map((v, i) => `${P + i * step},${P + (H - P * 2) - ((v - min) / range) * (H - P * 2) * 0.9}`).join(" ");
              const areaPts = `${P},${H - P} ${pts} ${W - P},${H - P}`;
              return (<><polygon points={areaPts} fill="url(#bigArea)" /><polyline points={pts} fill="none" stroke="oklch(0.92 0.24 145)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>);
            })()}
          </svg>
        </div>
      </main>
    </div>
  );
}
