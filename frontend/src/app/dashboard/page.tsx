"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SystemProgram, SYSVAR_RENT_PUBKEY, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import { useAnchorProgram } from "@/lib/program";
import { getConfigPda, getPaymentLinkPda, getEscrowVaultPda, encodeLinkParam } from "@/lib/pdas";
import { USDC_MINT, PLATFORM_FEE_BPS, usdcToLamports, lamportsToUsdc } from "@/lib/constants";
import { Icon, ChainGlyph, VeloraMark, StatusDot, Sparkline } from "@/components/ui";

type SavedLink = { id: string; linkId: string; amount: number; description: string; createdAt: number; txSig: string; isPaid?: boolean };

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ active }: { active: string }) {
  return (
    <aside style={{ width: 220, borderRight: "1px solid oklch(1 0 0 / 0.06)", padding: "18px 14px", background: "oklch(0.165 0.012 255)", display: "flex", flexDirection: "column", gap: 0, minHeight: "100vh", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20 }}>
      <Link href="/" style={{ textDecoration: "none" }}><VeloraMark size={20} /></Link>
      <nav style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 2 }}>
        {[["chart", "Overview", "/dashboard"], ["bolt", "Payments", "/dashboard"], ["link", "Links", "/dashboard"], ["spark", "Analytics", "/dashboard"]].map(([ic, label, href], i) => {
          const isActive = i === 0;
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
          <div><div style={{ fontSize: 18, fontWeight: 500 }}>New payment link</div><div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Creates an on-chain escrow on Solana</div></div>
          <button onClick={onClose} style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.10)", color: "var(--ink)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="close" size={14} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><label style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Amount</label><span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono), monospace" }}>USDC</span></div>
            <input type="number" placeholder="200" min="0.000001" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, display: "block", marginBottom: 8 }}>Description</label>
            <input type="text" placeholder="Brand identity · Helia Labs" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 14, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.08)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }} />
          </div>
          <button type="button" onClick={() => setIsX402(!isX402)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: isX402 ? "oklch(0.72 0.18 295 / 0.10)" : "oklch(1 0 0 / 0.025)", border: isX402 ? "1px solid oklch(0.72 0.18 295 / 0.35)" : "1px solid oklch(1 0 0 / 0.08)", color: isX402 ? "var(--violet)" : "var(--ink-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="bolt" size={14} /> x402 micropayment gate</span>
            <span style={{ width: 32, height: 18, borderRadius: 999, background: isX402 ? "var(--violet)" : "oklch(1 0 0 / 0.10)", position: "relative", transition: "background .2s" }}><span style={{ position: "absolute", top: 2, left: isX402 ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .2s" }} /></span>
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

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  // Redirect to landing immediately when wallet disconnects
  useEffect(() => {
    if (!publicKey) router.replace("/");
  }, [publicKey, router]);
  const program = useAnchorProgram();
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    const raw = localStorage.getItem(`paylink-links-${publicKey.toBase58()}`);
    if (raw) setLinks(JSON.parse(raw));
    // Fetch USDC balance
    const mint = USDC_MINT;
    const ata = getAssociatedTokenAddressSync(mint, publicKey);
    connection.getTokenAccountBalance(ata).then((r) => setUsdcBalance(r.value.uiAmount ?? 0)).catch(() => setUsdcBalance(0));
  }, [publicKey, connection]);

  const saveLink = useCallback((link: SavedLink) => {
    if (!publicKey) return;
    setLinks((prev) => {
      const updated = [link, ...prev];
      localStorage.setItem(`paylink-links-${publicKey.toBase58()}`, JSON.stringify(updated));
      return updated;
    });
  }, [publicKey]);

  function parseAnchorError(err: unknown): string {
    // "Attempt to load a program that does not exist" → friendly message
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || msg.includes("0x0") || msg.includes("AccountNotFound")) {
      return "Program not deployed yet. Run `anchor deploy` on devnet and fund the deployer wallet first.";
    }
    if (msg.includes("insufficient funds") || msg.includes("InsufficientFunds")) {
      return "Insufficient SOL for transaction fees. Airdrop some devnet SOL first.";
    }
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
    } catch (e) {
      throw new Error(parseAnchorError(e));
    }
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
        .createPaymentLink(linkId, amountLamports, description || "PayLink payment", isX402, new BN(0))
        .accounts({
          config: configPda, paymentLink: paymentLinkPda, escrowVault: escrowVaultPda,
          mint: USDC_MINT, seller: publicKey, tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      saveLink({ id: encodeLinkParam(publicKey, linkId), linkId: linkId.toString(), amount: parseFloat(amount), description: description || "PayLink payment", createdAt: Date.now(), txSig });
    } catch (e) {
      throw new Error(parseAnchorError(e));
    }
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalVolume = links.reduce((s, l) => s + l.amount, 0);

  // Blank while redirect is in flight
  if (!publicKey) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar active="overview" />
      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 220, padding: "24px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.01em" }}>Overview</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>{publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-8)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="chip chip-acid"><StatusDot size={5} /> Live · Solana</span>
            <WalletMultiButton />
            <button onClick={() => setShowCreate(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 999, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Icon name="plus" size={14} stroke="#0a0c0a" /> New link</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total links", val: links.length.toString(), spark: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, links.length], color: "var(--acid)" },
            { label: "USDC balance", val: usdcBalance != null ? `$${usdcBalance.toFixed(2)}` : "…", spark: [40, 52, 46, 68, 62, 80, 72, 90, 84, 110], color: "var(--cyan)" },
            { label: "Volume created", val: `$${totalVolume.toFixed(2)}`, spark: [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, totalVolume / 10], color: "var(--violet)" },
            { label: "Network", val: "Devnet", spark: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5], color: "var(--amber)" },
          ].map((k, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 16, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", marginTop: 4, fontFamily: "var(--font-mono), monospace" }}>{k.val}</div>
              <Sparkline data={k.spark} width={120} height={24} stroke={k.color} />
            </div>
          ))}
        </div>

        {/* Links table */}
        <div style={{ padding: "16px 20px 12px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Payment links</div>
            {links.length > 0 && <span className="chip" style={{ fontSize: 10.5 }}>{links.length} total</span>}
          </div>

          {links.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 8 }}>No links yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first payment link to get started</div>
              <button onClick={() => setShowCreate(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 999, background: "var(--acid)", color: "#0a0c0a", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Icon name="plus" size={14} stroke="#0a0c0a" /> Create link</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--ink-3)", textAlign: "left", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {["Description", "Amount", "Link", "Status", "Tx", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 8px", fontWeight: 500, borderBottom: "1px solid oklch(1 0 0 / 0.05)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                      <div style={{ fontWeight: 500 }}>{link.description}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{new Date(link.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)", fontFamily: "var(--font-mono), monospace", fontWeight: 500, color: "var(--acid)" }}>${link.amount} USDC</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--ink-3)" }}>/pay/{link.id.slice(0, 16)}…</span>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                      <span className="chip chip-acid" style={{ fontSize: 10 }}><StatusDot size={5} /> Active</span>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                      <a href={`https://explorer.solana.com/tx/${link.txSig}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--ink-3)", textDecoration: "none" }}>{link.txSig.slice(0, 8)}… ↗</a>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid oklch(1 0 0 / 0.04)" }}>
                      <button onClick={() => copyLink(link.id)} className="chip" style={{ cursor: "pointer", fontSize: 10.5 }}><Icon name="copy" size={11} /> {copied === link.id ? "Copied!" : "Copy URL"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity */}
        {links.length > 0 && (
          <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 18, background: "oklch(1 0 0 / 0.025)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Recent on-chain activity</div>
              <span className="chip chip-acid" style={{ fontSize: 10.5 }}><StatusDot size={5} /> {links.length} links created</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {links.slice(0, 5).map((link, i) => (
                <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: i === 0 ? "oklch(0.92 0.24 145 / 0.06)" : "oklch(1 0 0 / 0.02)", border: i === 0 ? "1px solid oklch(0.92 0.24 145 / 0.20)" : "1px solid oklch(1 0 0 / 0.04)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "oklch(0.92 0.24 145 / 0.10)", border: "1px solid oklch(0.92 0.24 145 / 0.30)", display: "grid", placeItems: "center", color: "var(--acid)" }}><Icon name="link" size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>{link.description}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}><ChainGlyph chain="sol" size={11} /> Created · {new Date(link.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <span className="chip chip-acid" style={{ fontSize: 10.5 }}><Icon name="check" size={10} stroke="var(--acid)" /> ${link.amount} USDC</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
