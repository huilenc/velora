"use client";
import React from "react";

export function Aurora({ intensity = 0.7 }: { intensity?: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", opacity: intensity }}>
      <div style={{ position: "absolute", top: "-20%", left: "20%", width: "60%", height: "70%", background: "radial-gradient(circle, oklch(0.92 0.24 145 / 0.30), transparent 60%)", filter: "blur(60px)", animation: "auroraMove1 18s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", top: "5%", right: "-10%", width: "50%", height: "60%", background: "radial-gradient(circle, oklch(0.72 0.18 295 / 0.25), transparent 60%)", filter: "blur(70px)", animation: "auroraMove2 22s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "60%", height: "50%", background: "radial-gradient(circle, oklch(0.82 0.13 215 / 0.22), transparent 60%)", filter: "blur(80px)", animation: "auroraMove3 26s ease-in-out infinite alternate" }} />
    </div>
  );
}

export function Particles({ count = 28, intensity = 1 }: { count?: number; intensity?: number }) {
  // State starts empty so server HTML is blank; dots are added after mount
  // to avoid SSR/hydration mismatch from Math.random()
  const [dots, setDots] = React.useState<
    { id: number; left: number; top: number; size: number; delay: number; duration: number; xDrift: number; hue: number; opacity: number }[]
  >([]);

  React.useEffect(() => {
    setDots(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: -Math.random() * 14,
        duration: 10 + Math.random() * 14,
        xDrift: (Math.random() - 0.5) * 60,
        hue: Math.random() < 0.6 ? 145 : Math.random() < 0.5 ? 215 : 295,
        opacity: (0.3 + Math.random() * 0.6) * intensity,
      }))
    );
  }, [count, intensity]);

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {dots.map((d) => (
        <span key={d.id} style={{
          position: "absolute", left: `${d.left}%`, top: `${d.top}%`,
          width: d.size, height: d.size, borderRadius: "50%",
          background: `oklch(0.9 0.2 ${d.hue})`,
          boxShadow: `0 0 ${d.size * 4}px oklch(0.9 0.2 ${d.hue} / 0.8)`,
          opacity: d.opacity,
          animation: `particleDrift ${d.duration}s linear ${d.delay}s infinite`,
          ["--xd" as string]: `${d.xDrift}px`,
        }} />
      ))}
    </div>
  );
}

export function NetworkLines() {
  return (
    <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.5 }} preserveAspectRatio="none" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="netLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.92 0.24 145)" stopOpacity="0" />
          <stop offset="50%" stopColor="oklch(0.92 0.24 145)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.72 0.18 295)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#netLine)" strokeWidth="1" fill="none">
        <path d="M 0 300 Q 300 200 600 350 T 1200 280" className="dash-anim" />
        <path d="M 0 500 Q 350 600 700 480 T 1200 520" className="dash-anim" style={{ animationDelay: "-2s" }} />
        <path d="M 100 0 Q 250 200 400 250 T 800 800" className="dash-anim" style={{ animationDelay: "-4s" }} />
        <path d="M 1100 0 Q 950 250 800 350 T 400 800" className="dash-anim" style={{ animationDelay: "-6s" }} />
      </g>
    </svg>
  );
}
