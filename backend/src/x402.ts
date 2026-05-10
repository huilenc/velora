import { Request, Response, NextFunction } from "express";
import { decodeLinkParam, fetchPaymentLink } from "./solana";

// Standard x402 response body — follows the HTTP 402 Payment Required spec
// used by Coinbase's x402 facilitator and compatible clients.
interface X402PaymentRequired {
  version: "x402";
  scheme: "exact";
  network: "solana-devnet" | "solana-mainnet";
  resource: string;
  payment: {
    linkParam: string;   // "{seller}-{linkId}" — pass back as X-Payment-Link
    amount: number;      // USDC micro-units (6 decimals)
    description: string;
    seller: string;
  };
  instructions: string;
}

// Middleware headers a client must send after paying:
//   X-Payment-Proof  — Solana tx signature from the pay() call
//   X-Payment-Payer  — buyer's base58 public key
//   X-Payment-Link   — "{seller}-{linkId}" (same param as the URL segment)
export async function x402Gate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawParam = req.params["onchainParam"];
  const linkParam = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  if (!linkParam) {
    res.status(400).json({ error: "Missing link param" });
    return;
  }

  // Normalize headers: Express types them as string | string[] | undefined
  const rawProof = req.headers["x-payment-proof"];
  const rawPayer = req.headers["x-payment-payer"];
  const proof = Array.isArray(rawProof) ? rawProof[0] : rawProof;
  const payer = Array.isArray(rawPayer) ? rawPayer[0] : rawPayer;

  // ── No proof present → return 402 with payment details ──────────────────
  if (!proof || !payer) {
    let body: X402PaymentRequired;
    try {
      const { seller, linkId } = decodeLinkParam(linkParam);
      const link = await fetchPaymentLink(seller, linkId);

      body = {
        version: "x402",
        scheme: "exact",
        network: "solana-devnet",
        resource: req.path,
        payment: {
          linkParam,
          amount: link?.amount.toNumber() ?? 0,
          description: link?.description ?? "",
          seller: seller.toBase58(),
        },
        instructions:
          "Pay via the Solana program, then retry with " +
          "X-Payment-Proof (tx signature), X-Payment-Payer (your wallet pubkey), " +
          "and X-Payment-Link (link param) headers.",
      };
    } catch {
      res.status(402).json({ error: "Payment required — invalid link param" });
      return;
    }

    res.status(402).json(body);
    return;
  }

  // ── Proof present → verify on-chain ─────────────────────────────────────
  try {
    const { seller, linkId } = decodeLinkParam(linkParam);
    const link = await fetchPaymentLink(seller, linkId);

    if (!link) {
      res.status(402).json({ error: "Payment link not found on-chain" });
      return;
    }
    if (!link.isX402) {
      res.status(402).json({ error: "Not an x402-enabled link" });
      return;
    }
    if (!link.isPaid) {
      res.status(402).json({ error: "Payment not confirmed on-chain yet" });
      return;
    }

    if (link.buyer.toBase58() !== payer) {
      res.status(403).json({ error: "Payer does not match on-chain buyer" });
      return;
    }

    // Payment verified — pass through to route handler
    next();
  } catch (err) {
    res.status(402).json({ error: "On-chain verification failed", detail: String(err) });
  }
}
