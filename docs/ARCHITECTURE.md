# PayLink — Architecture

> Pay from any chain. Receive USDC on Solana. Under a minute.

---

## Overview

PayLink is a cross-chain payment link platform. A seller generates a unique URL, shares it with a client, and the client pays from any supported chain (Ethereum, Arbitrum, Base, Polygon, etc.) using any token. The seller always receives USDC on Solana, regardless of what the buyer holds or which chain they're on.

The entire flow is non-custodial: funds move through an on-chain Anchor escrow program and are settled atomically. No intermediary ever holds funds.

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                                                                  │
│  /              Landing page                                     │
│  /dashboard     Seller dashboard — create & manage links         │
│  /pay/[id]      Payment page — client-facing checkout            │
└──────────────────┬──────────────────────────────────────────────┘
                   │ REST / WebSocket
┌──────────────────▼──────────────────────────────────────────────┐
│                         BACKEND API                              │
│                                                                  │
│  POST /links            Generate payment link                    │
│  GET  /links/:id        Fetch link metadata                      │
│  POST /webhook          Receive tx confirmation events           │
│  GET  /quote            Proxy to LI.FI SDK for cross-chain quote │
│  middleware /x402       HTTP 402 micropayment gate               │
└───────┬──────────────────────┬──────────────┬───────────────────┘
        │                      │              │
        ▼                      ▼              ▼
┌──────────────┐   ┌──────────────────┐  ┌──────────────────────┐
│  LI.FI SDK   │   │  Solana Program   │  │  ElevenLabs MCP      │
│  (bridge +   │   │  (Anchor/Rust)    │  │  Voice confirmation  │
│   swap)      │   │                  │  │  call on settlement  │
│              │   │  - Escrow        │  └──────────────────────┘
│  10+ chains  │   │  - Settlement    │
│  USDC output │   │  - ZK proofs     │
└──────────────┘   └──────────────────┘
```

---

## Components

### 1. Frontend — `app/`

Built with **Next.js 16 App Router**, React 19, and Tailwind CSS 4.

| Route | Purpose |
|-------|---------|
| `/` | Landing page. Stats, value prop, CTA to dashboard or demo link. |
| `/dashboard` | Seller dashboard. Create links (amount + description), list recent links with status badges. |
| `/pay/[id]` | Payment page. Shows payment details for the given link ID. Hosts the LI.FI Widget for wallet connection and cross-chain payment. |

**Key libraries:**

| Library | Role |
|---------|------|
| `@solana/wallet-adapter-react` | Solana wallet connection (Phantom, Backpack, etc.) |
| `@solana/wallet-adapter-react-ui` | Wallet modal UI |
| `@solana/web3.js` | Solana RPC, tx building |
| `wagmi` + `viem` | EVM wallet connection (MetaMask, Coinbase, etc.) |
| `@lifi/widget` | Embedded cross-chain swap/bridge UI |
| `@lifi/sdk` | Programmatic quote/route fetching |
| `@tanstack/react-query` | Server state, quote polling |

---

### 2. Solana Program — `programs/paylink/`

Written in **Rust** with the **Anchor 0.31.1** framework. Deployed to Solana devnet (and eventually mainnet).

**Program ID:** `8SuWfRSyqJxpXXQ57S2hmiwKgFqpf877Gyf89yky8KhC` (localnet workspace)

#### Accounts

```
PaymentLink (PDA)
├── seller_pubkey      — who receives funds
├── amount_usdc        — requested amount in lamports (6 decimals)
├── description        — UTF-8 string
├── status             — Pending | Paid | Cancelled
└── created_at         — Unix timestamp

EscrowVault (PDA, per link)
└── holds USDC until settlement is confirmed
```

#### Instructions

| Instruction | Actor | Description |
|-------------|-------|-------------|
| `initialize_config` | Seller (once) | Creates per-seller `Config` PDA with fee_bps and treasury |
| `create_payment_link` | Seller | Initializes `PaymentLink` PDA + `escrow_vault` TokenAccount in one tx |
| `pay` | Buyer | Transfers USDC from buyer ATA → escrow vault; emits `PaymentReceived` |
| `settle` | Seller / backend | Releases escrow to seller (minus fee to treasury); emits `PaymentSettled` |
| `cancel_payment` | Seller | Cancels link; refunds buyer if already paid |
| `claim_expired` | Buyer | Reclaims funds from expired unpaid link |
| `x402_verify` | Backend / requester | Verifies x402 HTTP payment; emits `X402AccessGranted` |
| `update_config` | Seller | Updates fee_bps, treasury, or paused state |

#### Events emitted

| Event | When | Used by |
|-------|------|---------|
| `PaymentLinkCreated` | `create_payment_link` | Backend indexes links |
| `PaymentReceived` | `pay` | Backend webhook triggers `settle` + ElevenLabs call |
| `PaymentSettled` | `settle` | Frontend confirmation screen |
| `X402AccessGranted` | `x402_verify` | x402 middleware grants HTTP access |

#### PDAs

```
Config        seeds: ["config", seller_pubkey]
PaymentLink   seeds: ["payment_link", seller_pubkey, link_id_le8]
EscrowVault   seeds: ["escrow_vault", seller_pubkey, link_id_le8]  ← TokenAccount
```

#### Dependencies (Cargo)

| Crate | Version | Purpose |
|-------|---------|---------|
| `anchor-lang` | 0.31.1 | Framework macros, account types |
| `anchor-spl` | 0.31.1 | SPL Token / Token-2022 CPI helpers |
| `mpl-token-metadata` | 5.1.1 | Metaplex metadata (receipt NFTs, optional) |

---

### 3. Backend API

Node.js / TypeScript service (to be scaffolded under `api/`).

#### Responsibilities

- **Link generation**: Creates a UUID-based link, stores metadata (amount, seller wallet, description) in a DB, calls `create_link` on the Solana program.
- **LI.FI proxy**: Wraps `@lifi/sdk` to return cross-chain quotes without exposing API keys to the browser.
- **Webhook listener**: Subscribes to Solana transaction confirmations (via WebSocket or Helius webhooks). When a `deposit` lands, triggers `settle` CPI and notifies ElevenLabs.
- **x402 middleware**: Implements the [HTTP 402 Payment Required](https://x402.org) spec. Any route behind `/x402` requires a valid on-chain micropayment before returning the response.

#### x402 Flow

```
Client → GET /x402/resource
         ← 402 Payment Required  { paymentAddress, amount, chain }

Client pays on-chain
Client → GET /x402/resource  (with payment proof header)
         ← 200 OK  { resource }
```

---

### 4. LI.FI Integration

LI.FI handles the cross-chain heavy lifting: quoting, routing, and executing bridges + swaps so the buyer can pay in any token on any chain.

**Frontend**: The `@lifi/widget` is embedded directly in `/pay/[id]`. It handles wallet detection, chain switching, route selection, and transaction signing — all in one UI component.

**Backend**: `@lifi/sdk` is used server-side to pre-fetch quotes and estimate fees before the widget loads, improving perceived performance.

**Output token**: Always USDC on Solana (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).

---

### 5. ElevenLabs Integration

Used to place a **voice call** to the seller when a payment is confirmed, giving PayLink a memorable, human touch during the demo.

**Trigger**: Backend webhook, after `settle` is confirmed on-chain.

**MCP Server**: Configured in `.claude/settings.json` via `uvx elevenlabs-mcp`. Provides tools for text-to-speech, voice agents, and call initiation.

**Skills installed**: `agents`, `text-to-speech`, `voice-changer`, `sound-effects`, `speech-to-text` (from `elevenlabs/skills`).

**Call script example:**
> "Hola! Tu pago de 200 USDC de [buyer address] fue confirmado en Solana. ¡Ya está en tu wallet!"

---

### 6. ZK Proofs (Light Protocol)

Optional but high-impact feature. Uses **Light Protocol** on Solana to generate ZK-compressed transactions that hide the payment amount.

- Buyer submits a ZK proof alongside the transaction.
- The Solana program verifies the proof via `verify_zk_proof`.
- The settlement still occurs but the amount is private on-chain.
- Judges see: "private payments on Solana, built in 3 days" — very few teams can demo this.

---

## Data Flow: End-to-End Payment

```
1. SELLER creates link
   dashboard → POST /api/links → Solana create_link ix → link URL generated

2. SELLER shares link
   paylink.xyz/pay/abc123

3. BUYER opens link
   /pay/abc123 → GET /api/links/abc123 → renders amount + LI.FI widget

4. BUYER connects wallet + pays
   LI.FI Widget handles:
   ├── wallet connection (Phantom / MetaMask / etc.)
   ├── route calculation (bridge + swap to USDC on Solana)
   └── transaction signing + broadcast

5. BRIDGE executes
   EVM → LI.FI relayer → Solana USDC → EscrowVault PDA

6. BACKEND detects deposit
   Solana WebSocket / Helius webhook → deposit confirmed event

7. BACKEND settles
   Backend signs + sends settle ix → USDC moves from EscrowVault → seller wallet
   Link status updated to "Paid"

8. ELEVENLABS notified
   Backend calls ElevenLabs MCP → voice call placed to seller

9. BUYER sees confirmation
   /pay/abc123 updates to "Payment confirmed ✓"
```

---

## Directory Structure

```
paylink/
├── app/                          # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx            # Root layout, metadata
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/page.tsx    # Seller dashboard
│   │   └── pay/[id]/page.tsx     # Payment page (checkout)
│   ├── components/               # (to be created)
│   │   ├── WalletProvider.tsx    # Solana + EVM wallet context
│   │   ├── LiFiWidget.tsx        # Wrapped LI.FI widget
│   │   └── PaymentStatus.tsx     # Tx confirmation UI
│   ├── lib/                      # (to be created)
│   │   ├── solana.ts             # Program client, IDL
│   │   └── lifi.ts               # SDK helpers, quote fetching
│   └── package.json
│
├── programs/                     # Anchor workspace
│   └── paylink/
│       └── src/lib.rs            # Solana program
│
├── api/                          # Backend (to be scaffolded)
│   ├── routes/
│   │   ├── links.ts
│   │   ├── quote.ts
│   │   ├── webhook.ts
│   │   └── x402.ts
│   └── index.ts
│
├── tests/                        # Anchor tests
│   └── paylink.ts
│
├── .claude/
│   └── settings.json             # ElevenLabs MCP config
│
├── .agents/
│   └── skills/
│       ├── solana-dev/           # Solana Foundation dev skill
│       ├── agents/               # ElevenLabs agents skill
│       ├── text-to-speech/       # ElevenLabs TTS skill
│       └── ...                   # Other ElevenLabs skills
│
├── docs/
│   └── ARCHITECTURE.md           # This file
│
├── Anchor.toml                   # Anchor config (localnet → devnet)
├── Cargo.toml                    # Rust workspace
└── package.json                  # JS workspace root
```

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_PROGRAM_ID` | app | Deployed Anchor program address |
| `NEXT_PUBLIC_RPC_URL` | app | Solana RPC endpoint (Helius recommended) |
| `ELEVENLABS_API_KEY` | api / MCP | ElevenLabs voice API |
| `LIFI_API_KEY` | api | LI.FI SDK API key (optional, increases rate limits) |
| `DATABASE_URL` | api | Link metadata storage |
| `SELLER_PHONE` | api | Phone number for ElevenLabs voice call |

---

## Deployment Targets

| Layer | Target |
|-------|--------|
| Frontend | Vercel (automatic on push to `main`) |
| Backend API | Railway / Render |
| Solana Program | Devnet → Mainnet-beta |
| Database | PlanetScale / Supabase |

---

## Key Differentiators for the Hackathon

1. **x402 bonus track** — HTTP 402 micropayment gate is rarely implemented; qualifies for extra prize pool with minimal competition.
2. **ZK private payments** — Light Protocol integration on Solana. Visually impressive demo moment.
3. **ElevenLabs voice call** — "Your $200 USDC just landed" phone call is a crowd/judge moment no other team will have.
4. **Cross-chain UX** — LI.FI widget means zero chain-switching friction for the buyer. MetaMask pays ETH, seller receives USDC on Solana.
5. **Beautiful design** — Payment page is the demo centrepiece. Prioritize polish there above all else.
