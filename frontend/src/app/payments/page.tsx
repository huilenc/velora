"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { Icon, ChainGlyph, VeloraMark, StatusDot } from "@/components/ui";

type SavedLink = {
  id: string;
  linkId: string;
  amount: number;
  description: string;
  createdAt: number;
  txSig: string;
  isPaid?: boolean;
  paidAt?: number;
  payerWallet?: string;
  chain?: string;
};

function Sidebar({ active }: { active: string }) {
  const nav: [string, string, string][] = [
    ["chart", "Overview", "/dashboard"],
    ["bolt", "Payments", "/payments"],
    ["link", "Links", "/links"],
  ];
  return (
    <aside style={{ width: 220, borderRight: "1px solid oklch(1 0 0 / 0.06)", padding: "18px 14px", background: "oklch(0.165 0.012 255)", display: "flex", flexDirection: "column", gap: 0, minHeight: "100vh", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20 }}>
      <Link href="/" style={{ textDecoration: "none" }}><VeloraMark size={20} /></Link>
      <nav style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(([ic, label, href]) => {
          const isActive = active === label.toLowerCase();
          return (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: isActive ? "oklch(1 0 0 / 0.06)" : "transparent", color: isActive ? "var(--ink)" : "var(--ink-2)", textDecoration: "none", fontSize: 13, borderLeft: isActive ? "2px solid var(--acid)" : "2px solid transparent" }}>
              <Icon name={ic} size={16} />{label}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: 12, borderRadius: 12, background: "oklch(0.92 0.24 145 / 0.07)", border: "1px solid oklch(0.92 0.24 145 / 0.20)" }}>
        <div style={{ fontSize: 11, color: "var(--acid)", fontWeight: 500 }}>x402 Enabled</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>Programmatic payments ready</div>
      </div>
    </aside>
  );
}

type Filter = "all" | "this-month" | "last-month";

export default function PaymentsPage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [allLinks, setAllLinks] = useState<SavedLink[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!publicKey) { router.replace("/"); return; }
    const raw = localStorage.getItem(`paylink-links-${publicKey.toBase58()}`);
    if (raw) setAllLinks(JSON.parse(raw));
  }, [publicKey, router]);

  if (!publicKey) return null;

  const paid = allLinks.filter((l) => l.isPaid);

  const now = Date.now();
  const MS_MONTH = 30 * 24 * 60 * 60 * 1000;

  const filtered = paid.filter((l) => {
    const ts = l.paidAt ?? l.createdAt;
    if (filter === "this-month") return now - ts < MS_MONTH;
    if (filter === "last-month") return now - ts >= MS_MONTH && now - ts < 2 * MS_MONTH;
    return true;
  });

  const totalReceived = paid.reduce((s, l) => s + l.amount, 0);
  const thisMonth = paid.filter((l) => now - (l.paidAt ?? l.createdAt) < MS_MONTH);
  const thisMonthVol = thisMonth.reduce((s, l) => s + l.amount, 0);
  const avgPayment = paid.length > 0 ? totalReceived / paid.length : 0;

  const kpis = [
    { label: "Total received", val: `$${totalReceived.toFixed(2)}`, sub: "USDC on Solana", accent: "var(--acid)" },
    { label: "This month", val: `$${thisMonthVol.toFixed(2)}`, sub: `${thisMonth.length} payment${thisMonth.length !== 1 ? "s" : ""}`, accent: "var(--cyan)" },
    { label: "Avg. payment", val: `$${avgPayment.toFixed(2)}`, sub: "per transaction", accent: "var(--violet)" },
    { label: "Settled", val: paid.length.toString(), sub: `of ${allLinks.length} link${allLinks.length !== 1 ? "s" : ""}`, accent: "var(--amber)" },
  ];

  const filterTabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All time" },
    { id: "this-month", label: "This month" },
    { id: "last-month", label: "Last month" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar active="payments" />

      <main style={{ flex: 1, marginLeft: 220, padding: "24px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.01em" }}>Payments</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Settled payments received through your links</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="chip chip-acid"><StatusDot size={5} /> Live · Solana</span>
            <WalletMultiButton />
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 16, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", marginTop: 4, fontFamily: "var(--font-mono), monospace", color: k.accent }}>{k.val}</div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ padding: "16px 20px 12px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Payment history</div>
            <div style={{ display: "flex", gap: 6 }}>
              {filterTabs.map((tab) => (
                <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ padding: "4px 12px", borderRadius: 999, fontSize: 11, cursor: "pointer", fontFamily: "inherit", border: "1px solid", borderColor: filter === tab.id ? "oklch(0.92 0.24 145 / 0.35)" : "oklch(1 0 0 / 0.08)", background: filter === tab.id ? "oklch(0.92 0.24 145 / 0.10)" : "transparent", color: filter === tab.id ? "var(--acid)" : "var(--ink-3)", transition: "all .15s" }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {paid.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0", color: "var(--ink-3)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "oklch(0.82 0.13 215 / 0.10)", border: "1px solid oklch(0.82 0.13 215 / 0.25)", display: "grid", placeItems: "center", color: "var(--cyan)", margin: "0 auto 16px" }}>
                <Icon name="bolt" size={24} />
              </div>
              <div style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 6 }}>No payments yet</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.55 }}>
                Payments will appear here once clients complete a transaction through your links.
              </div>
              <Link href="/links" className="btn btn-ghost" style={{ fontSize: 13 }}>
                <Icon name="link" size={14} /> View links
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-3)", fontSize: 13 }}>
              No payments in this period.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--ink-3)", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {["Description", "Amount", "Client", "Chain", "Date received", "Settlement tx"].map((h) => (
                    <th key={h} style={{ padding: "6px 8px 10px", fontWeight: 500, borderBottom: "1px solid oklch(1 0 0 / 0.05)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((link) => {
                  const dateTs = link.paidAt ?? link.createdAt;
                  return (
                    <tr key={link.id} style={{ transition: "background .1s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(1 0 0 / 0.02)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <div style={{ fontWeight: 500 }}>{link.description}</div>
                        <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>
                          /pay/{link.id.slice(0, 12)}…
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 600, color: "var(--acid)" }}>+${link.amount.toFixed(2)}</span>
                        <span style={{ fontSize: 10.5, color: "var(--ink-4)", marginLeft: 4 }}>USDC</span>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        {link.payerWallet ? (
                          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--ink-2)" }}>
                            {link.payerWallet.slice(0, 6)}…{link.payerWallet.slice(-4)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-4)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <ChainGlyph chain={link.chain ?? "sol"} size={14} />
                          <span style={{ fontSize: 11, color: "var(--ink-2)" }}>
                            {link.chain ? link.chain.toUpperCase() : "Solana"}
                          </span>
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)", fontSize: 11, color: "var(--ink-3)" }}>
                        {new Date(dateTs).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        <div style={{ color: "var(--ink-4)", marginTop: 1 }}>
                          {new Date(dateTs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <a
                          href={`https://explorer.solana.com/tx/${link.txSig}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--ink-3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          {link.txSig.slice(0, 8)}… <span style={{ opacity: 0.6 }}>↗</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Breakdown by link — only shown when there are paid links */}
        {paid.length > 0 && (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Top links */}
            <div style={{ padding: "16px 20px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Top links by revenue</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...paid].sort((a, b) => b.amount - a.amount).slice(0, 5).map((link, i) => (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.07)", display: "grid", placeItems: "center", fontSize: 10, color: "var(--ink-3)", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.description}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--acid)", flexShrink: 0 }}>${link.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div style={{ padding: "16px 20px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Recent activity</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...paid].sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt)).slice(0, 5).map((link, i) => (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: i === 0 ? "oklch(0.92 0.24 145 / 0.05)" : "transparent", border: i === 0 ? "1px solid oklch(0.92 0.24 145 / 0.15)" : "1px solid transparent" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.10)", border: "1px solid oklch(0.92 0.24 145 / 0.25)", display: "grid", placeItems: "center", color: "var(--acid)", flexShrink: 0 }}>
                      <Icon name="check" size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.description}</div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 1 }}>
                        {new Date(link.paidAt ?? link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span className="chip chip-acid" style={{ fontSize: 10, flexShrink: 0 }}>${link.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
