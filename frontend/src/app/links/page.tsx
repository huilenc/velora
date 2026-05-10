"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SystemProgram, SYSVAR_RENT_PUBKEY, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/program";
import { getConfigPda, getPaymentLinkPda, getEscrowVaultPda, encodeLinkParam } from "@/lib/pdas";
import { USDC_MINT, PLATFORM_FEE_BPS, usdcToLamports } from "@/lib/constants";
import { Icon, VeloraMark, StatusDot } from "@/components/ui";

type SavedLink = {
  id: string;
  linkId: string;
  amount: number;
  description: string;
  createdAt: number;
  txSig: string;
  isPaid?: boolean;
  paidAt?: number;
  isX402?: boolean;
  expiresAt?: number;
};

type Filter = "all" | "active" | "paid";

// ── Sidebar ────────────────────────────────────────────────────────────────
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

// ── Create link modal ──────────────────────────────────────────────────────
function CreateLinkModal({ onClose, onCreate }: { onClose: () => void; onCreate: (amount: string, description: string, isX402: boolean) => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isX402, setIsX402] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onCreate(amount, description, isX402);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "oklch(0.10 0.01 255 / 0.7)", backdropFilter: "blur(12px)", display: "grid", placeItems: "center", animation: "fadeIn .2s ease-out" }} onClick={onClose}>
      <div style={{ width: 480, padding: 28, borderRadius: 22, background: "linear-gradient(180deg, oklch(0.20 0.014 255), oklch(0.16 0.012 255))", border: "1px solid oklch(1 0 0 / 0.12)", boxShadow: "0 40px 100px -20px oklch(0 0 0 / 0.6)", animation: "popIn .35s cubic-bezier(.16,1,.3,1)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>New payment link</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Creates an on-chain escrow on Solana</div>
          </div>
          <button onClick={onClose} style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)", color: "var(--ink)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="close" size={14} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Amount</label>
              <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono), monospace" }}>USDC</span>
            </div>
            <input type="number" placeholder="200" min="0.000001" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, display: "block", marginBottom: 8 }}>Description</label>
            <input type="text" placeholder="Brand identity · Helia Labs" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }} />
          </div>
          <button type="button" onClick={() => setIsX402(!isX402)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: isX402 ? "oklch(0.72 0.18 295 / 0.10)" : "oklch(1 0 0 / 0.025)", border: isX402 ? "1px solid oklch(0.72 0.18 295 / 0.35)" : "1px solid oklch(1 0 0 / 0.08)", color: isX402 ? "var(--violet)" : "var(--ink-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="bolt" size={14} /> x402 micropayment gate</span>
            <span style={{ width: 32, height: 18, borderRadius: 999, background: isX402 ? "var(--violet)" : "oklch(1 0 0 / 0.10)", position: "relative", transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 2, left: isX402 ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </span>
          </button>
          {error && <p style={{ color: "var(--rose)", fontSize: 13, background: "oklch(0.78 0.16 25 / 0.10)", borderRadius: 10, padding: "10px 12px" }}>{error}</p>}
          <button type="submit" disabled={loading || !amount} style={{ height: 48, borderRadius: 14, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 14, cursor: loading || !amount ? "not-allowed" : "pointer", opacity: loading || !amount ? 0.5 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? "Creating on Solana…" : <><Icon name="bolt" size={16} stroke="#0a0c0a" /> Generate link</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function LinksPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const program = useAnchorProgram();

  const [links, setLinks] = useState<SavedLink[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) { router.replace("/"); return; }
    const raw = localStorage.getItem(`paylink-links-${publicKey.toBase58()}`);
    if (raw) setLinks(JSON.parse(raw));
  }, [publicKey, router]);

  const saveLink = useCallback((link: SavedLink) => {
    if (!publicKey) return;
    setLinks((prev) => {
      const updated = [link, ...prev];
      localStorage.setItem(`paylink-links-${publicKey.toBase58()}`, JSON.stringify(updated));
      return updated;
    });
  }, [publicKey]);

  function parseAnchorError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("0x0") || msg.includes("AccountNotFound"))
      return "Program not deployed yet. Run `anchor deploy` on devnet and fund the deployer wallet first.";
    if (msg.includes("insufficient funds") || msg.includes("InsufficientFunds"))
      return "Insufficient SOL for transaction fees. Airdrop some devnet SOL first.";
    return msg;
  }

  async function ensureConfig(): Promise<PublicKey> {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    const [configPda] = getConfigPda(publicKey);
    const existing = await connection.getAccountInfo(configPda);
    if (existing) return configPda;
    try {
      await program.methods
        .initializeConfig(PLATFORM_FEE_BPS, publicKey)
        .accounts({ config: configPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
    } catch (e) { throw new Error(parseAnchorError(e)); }
    return configPda;
  }

  async function handleCreate(amount: string, description: string, isX402: boolean) {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    const configPda = await ensureConfig();
    const linkId = new BN(Date.now());
    const amountLamports = new BN(usdcToLamports(parseFloat(amount)).toString());
    const [paymentLinkPda] = getPaymentLinkPda(publicKey, linkId);
    const [escrowVaultPda] = getEscrowVaultPda(publicKey, linkId);
    try {
      const txSig = await program.methods
        .createPaymentLink(linkId, amountLamports, description || "Velora payment", isX402, new BN(0))
        .accounts({
          config: configPda, paymentLink: paymentLinkPda, escrowVault: escrowVaultPda,
          mint: USDC_MINT, seller: publicKey, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      saveLink({ id: encodeLinkParam(publicKey, linkId), linkId: linkId.toString(), amount: parseFloat(amount), description: description || "Velora payment", createdAt: Date.now(), txSig, isX402 });
    } catch (e) { throw new Error(parseAnchorError(e)); }
  }

  function copyLink(id: string) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    navigator.clipboard.writeText(`${base}/pay/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!publicKey) return null;

  const filtered = links.filter((l) => {
    if (filter === "active") return !l.isPaid;
    if (filter === "paid") return !!l.isPaid;
    return true;
  });

  const activeCount = links.filter((l) => !l.isPaid).length;
  const paidCount = links.filter((l) => !!l.isPaid).length;
  const totalVolume = links.reduce((s, l) => s + l.amount, 0);
  const conversionRate = links.length > 0 ? Math.round((paidCount / links.length) * 100) : 0;

  const kpis = [
    { label: "Total links", val: links.length.toString(), sub: "all time", accent: "var(--ink)" },
    { label: "Active", val: activeCount.toString(), sub: "awaiting payment", accent: "var(--acid)" },
    { label: "Paid", val: paidCount.toString(), sub: "settled", accent: "var(--cyan)" },
    { label: "Conversion", val: `${conversionRate}%`, sub: "paid / total", accent: "var(--violet)" },
  ];

  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: links.length },
    { id: "active", label: "Active", count: activeCount },
    { id: "paid", label: "Paid", count: paidCount },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar active="links" />

      <main style={{ flex: 1, marginLeft: 220, padding: "24px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.01em" }}>Links</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Manage your payment links and on-chain escrows</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="chip chip-acid"><StatusDot size={5} /> Live · Solana</span>
            <WalletMultiButton />
            <button onClick={() => setShowCreate(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 999, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <Icon name="plus" size={14} stroke="#0a0c0a" /> New link
            </button>
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

        {/* Volume strip */}
        {links.length > 0 && (
          <div style={{ marginBottom: 14, padding: "12px 18px", borderRadius: 14, background: "oklch(0.92 0.24 145 / 0.06)", border: "1px solid oklch(0.92 0.24 145 / 0.18)", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="spark" size={16} stroke="var(--acid)" />
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Total volume created:</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 600, color: "var(--acid)" }}>${totalVolume.toFixed(2)} USDC</span>
            <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: "auto" }}>across {links.length} link{links.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Table */}
        <div style={{ padding: "16px 20px 12px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {filterTabs.map((tab) => (
                <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "1px solid", borderColor: filter === tab.id ? "oklch(0.92 0.24 145 / 0.35)" : "oklch(1 0 0 / 0.08)", background: filter === tab.id ? "oklch(0.92 0.24 145 / 0.10)" : "transparent", color: filter === tab.id ? "var(--acid)" : "var(--ink-3)", transition: "all .15s" }}>
                  {tab.label}
                  <span style={{ padding: "1px 6px", borderRadius: 999, background: filter === tab.id ? "oklch(0.92 0.24 145 / 0.20)" : "oklch(1 0 0 / 0.06)", fontSize: 10 }}>{tab.count}</span>
                </button>
              ))}
            </div>
            {filtered.length > 0 && <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>}
          </div>

          {links.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.10)", border: "1px solid oklch(0.92 0.24 145 / 0.30)", display: "grid", placeItems: "center", color: "var(--acid)", margin: "0 auto 16px" }}>
                <Icon name="link" size={24} />
              </div>
              <div style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 6 }}>No links yet</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 300, margin: "0 auto 20px", lineHeight: 1.55 }}>
                Create your first payment link. Your client pays with any token — you receive USDC.
              </div>
              <button onClick={() => setShowCreate(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 999, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Icon name="plus" size={14} stroke="#0a0c0a" /> Create first link
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-3)", fontSize: 13 }}>
              No {filter} links.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--ink-3)", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {["Description", "Amount", "Link", "Status", "x402", "Created", "Expires", ""].map((h) => (
                    <th key={h} style={{ padding: "6px 8px 10px", fontWeight: 500, borderBottom: "1px solid oklch(1 0 0 / 0.05)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((link) => {
                  const isExpired = link.expiresAt && link.expiresAt > 0 && Date.now() > link.expiresAt;
                  const status = link.isPaid ? "paid" : isExpired ? "expired" : "active";
                  return (
                    <tr key={link.id} onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(1 0 0 / 0.02)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} style={{ transition: "background .1s" }}>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <div style={{ fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.description}</div>
                        <a href={`https://explorer.solana.com/tx/${link.txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--ink-4)", textDecoration: "none" }}>
                          tx: {link.txSig.slice(0, 8)}… ↗
                        </a>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 600, color: "var(--acid)" }}>${link.amount.toFixed(2)}</span>
                        <span style={{ fontSize: 10.5, color: "var(--ink-4)", marginLeft: 4 }}>USDC</span>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10.5, color: "var(--ink-3)" }}>
                          /pay/{link.id.slice(0, 14)}…
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        {status === "paid" && <span className="chip chip-cyan" style={{ fontSize: 10 }}><Icon name="check" size={10} stroke="var(--cyan)" /> Paid</span>}
                        {status === "active" && <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={5} /> Active</span>}
                        {status === "expired" && <span className="chip" style={{ fontSize: 10 }}>Expired</span>}
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        {link.isX402
                          ? <span className="chip chip-violet" style={{ fontSize: 10 }}><Icon name="bolt" size={10} stroke="var(--violet)" /> x402</span>
                          : <span style={{ color: "var(--ink-4)", fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)", fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                        {new Date(link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <div style={{ color: "var(--ink-4)", marginTop: 1 }}>
                          {new Date(link.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)", fontSize: 11, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
                        {link.expiresAt && link.expiresAt > 0
                          ? new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Never"
                        }
                      </td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={() => copyLink(link.id)} className="chip" style={{ cursor: "pointer", fontSize: 10.5, whiteSpace: "nowrap" }}>
                            <Icon name={copied === link.id ? "check" : "copy"} size={11} />
                            {copied === link.id ? "Copied!" : "Copy URL"}
                          </button>
                          <Link href={`/pay/${link.id}`} target="_blank" className="chip" style={{ fontSize: 10.5, textDecoration: "none", whiteSpace: "nowrap" }}>
                            <Icon name="arrow" size={11} /> Preview
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
