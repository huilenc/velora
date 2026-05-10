"use client";
import React from "react";

// ── Icon ──────────────────────────────────────────────────────────────────
export function Icon({ name, size = 22, stroke = "currentColor" }: { name: string; size?: number; stroke?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bolt":    return <svg {...p}><path d="M13 3 L5 14 H12 L11 21 L19 10 H12 Z" /></svg>;
    case "link":    return <svg {...p}><path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 1 1 5.6 5.6L17 12.4M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L7 11.6"/></svg>;
    case "shield":  return <svg {...p}><path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"/><path d="M9 12 L11 14 L15 10"/></svg>;
    case "route":   return <svg {...p}><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18 H14 a4 4 0 0 0 0-8 H10 a4 4 0 0 1 0-8" /></svg>;
    case "wallet":  return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10 H18 a3 3 0 0 1 3 3v1H17 a2 2 0 0 1 0-4 H21"/></svg>;
    case "chart":   return <svg {...p}><path d="M3 21 V3 M3 21 H21 M7 17 V12 M11 17 V8 M15 17 V14 M19 17 V6"/></svg>;
    case "arrow":   return <svg {...p}><path d="M5 12 H19 M13 6 L19 12 L13 18"/></svg>;
    case "check":   return <svg {...p}><path d="M5 12 L10 17 L19 7"/></svg>;
    case "close":   return <svg {...p}><path d="M6 6 L18 18 M6 18 L18 6"/></svg>;
    case "copy":    return <svg {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8 V6 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 V14 a2 2 0 0 0 2 2 H8"/></svg>;
    case "plus":    return <svg {...p}><path d="M12 5 V19 M5 12 H19"/></svg>;
    case "globe":   return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12 H21 M12 3 a13 13 0 0 1 0 18 a13 13 0 0 1 0 -18"/></svg>;
    case "clock":   return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></svg>;
    case "lock":    return <svg {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/></svg>;
    case "spark":   return <svg {...p}><path d="M12 3 V8 M12 16 V21 M3 12 H8 M16 12 H21 M5.6 5.6 L9 9 M15 15 L18.4 18.4 M5.6 18.4 L9 15 M15 9 L18.4 5.6"/></svg>;
    case "invoice": return <svg {...p}><path d="M6 3 H16 L20 7 V21 H6 Z"/><path d="M9 12 H17 M9 16 H14 M9 8 H13"/></svg>;
    case "play":    return <svg {...p}><path d="M8 5 V19 L19 12 Z"/></svg>;
    case "qr":      return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 21h3M21 17v4"/></svg>;
    case "refresh": return <svg {...p}><path d="M3 12 a9 9 0 0 1 15-6.7 L21 8 M21 3 V8 H16 M21 12 a9 9 0 0 1 -15 6.7 L3 16 M3 21 V16 H8"/></svg>;
    case "search":  return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 L21 21"/></svg>;
    case "bell":    return <svg {...p}><path d="M6 19 H18 L16 17 V11 a4 4 0 0 0 -8 0 V17 Z"/><path d="M10 22 H14"/></svg>;
    case "eye":     return <svg {...p}><path d="M2 12 C5 6 9 4 12 4 s7 2 10 8 c-3 6 -7 8 -10 8 s-7 -2 -10 -8 Z"/><circle cx="12" cy="12" r="3"/></svg>;
    default: return null;
  }
}

// ── ChainGlyph ────────────────────────────────────────────────────────────
export function ChainGlyph({ chain, size = 24 }: { chain: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24" };
  switch (chain) {
    case "sol": return <svg {...p}><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="oklch(0.72 0.18 295)" /><stop offset="1" stopColor="oklch(0.82 0.18 165)" /></linearGradient></defs><path d="M5 7 L17 7 L19 4.5 L7 4.5 Z" fill="url(#sg)" /><path d="M5 13 L17 13 L19 10.5 L7 10.5 Z" fill="url(#sg)" opacity="0.85" /><path d="M5 19.5 L17 19.5 L19 17 L7 17 Z" fill="url(#sg)" opacity="0.7" /></svg>;
    case "eth": return <svg {...p}><path d="M12 2 L19 12 L12 16 L5 12 Z" fill="oklch(0.78 0.05 260)" /><path d="M12 17 L19 13 L12 22 L5 13 Z" fill="oklch(0.62 0.05 260)" /></svg>;
    case "base": return <svg {...p}><circle cx="12" cy="12" r="10" fill="oklch(0.65 0.18 245)" /><rect x="2" y="11" width="12" height="2" fill="#0a0c0a" /></svg>;
    case "arb": return <svg {...p}><circle cx="12" cy="12" r="10" fill="oklch(0.55 0.12 255)" /><path d="M8 17 L12 7 L16 17 M10 14 L14 14" stroke="oklch(0.92 0.05 60)" strokeWidth="1.6" fill="none" /></svg>;
    case "op": return <svg {...p}><circle cx="12" cy="12" r="10" fill="oklch(0.62 0.22 25)" /><text x="12" y="16" fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="ui-sans-serif">O</text></svg>;
    case "poly": return <svg {...p}><path d="M12 3 L20 7 L20 17 L12 21 L4 17 L4 7 Z" fill="oklch(0.62 0.22 295)" /></svg>;
    case "usdc": return <svg {...p}><circle cx="12" cy="12" r="10" fill="oklch(0.62 0.18 245)" /><text x="12" y="16" fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="ui-sans-serif">$</text></svg>;
    case "btc": return <svg {...p}><circle cx="12" cy="12" r="10" fill="oklch(0.78 0.16 60)" /><text x="12" y="16" fontSize="10" fontWeight="700" textAnchor="middle" fill="white" fontFamily="ui-sans-serif">₿</text></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10" fill="var(--ink-3)" /></svg>;
  }
}

// ── VeloraMark ────────────────────────────────────────────────────────────
export function VeloraMark({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><linearGradient id="vmark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="oklch(0.92 0.24 145)" /><stop offset="1" stopColor="oklch(0.78 0.16 165)" /></linearGradient></defs>
        <path d="M4 6 L10 6 L16 22 L22 6 L28 6 L19 26 L13 26 Z" fill="url(#vmark)" style={{ filter: "drop-shadow(0 0 8px oklch(0.92 0.24 145 / 0.5))" }} />
      </svg>
      {withText && <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em", color: "var(--ink)" }}>Velora</span>}
    </span>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────
export function StatusDot({ color = "var(--acid)", size = 8 }: { color?: string; size?: number }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}` }} className="pulse-dot" />;
}

// ── Sparkline ─────────────────────────────────────────────────────────────
export function Sparkline({ data, width = 120, height = 40, stroke = "var(--acid)" }: { data: number[]; width?: number; height?: number; stroke?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height * 0.85 - height * 0.05}`).join(" ");
  const areaPts = `0,${height} ${pts} ${width},${height}`;
  const id = React.useId();
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity="0.35" /><stop offset="1" stopColor={stroke} stopOpacity="0" /></linearGradient></defs>
      <polygon points={areaPts} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Counter ───────────────────────────────────────────────────────────────
export function Counter({ to, duration = 1400, decimals = 0, suffix = "" }: { to: number; duration?: number; decimals?: number; suffix?: string }) {
  const [val, setVal] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const started = React.useRef(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(eased * to);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [to, duration]);
  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString();
  return <span ref={ref} style={{ fontFamily: "var(--font-mono), monospace" }}>{formatted}{suffix}</span>;
}
