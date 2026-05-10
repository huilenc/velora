export interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  seller: string;
  status: "pendiente" | "pagado";
  createdAt: string;
}

// Encode link data into the ID itself — no database, no cold-start loss.
export function createLink(amount: number, description: string, seller: string): PaymentLink {
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({ amount, description, seller, createdAt });
  const id = Buffer.from(payload).toString("base64url");
  return { id, amount, description, seller, status: "pendiente", createdAt };
}

export function getLinkById(id: string): PaymentLink | null {
  try {
    const payload = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
    if (typeof payload.amount !== "number" || !payload.seller) return null;
    return {
      id,
      amount: payload.amount,
      description: payload.description ?? "",
      seller: payload.seller,
      status: "pendiente",
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Payment status is tracked on-chain — nothing to persist here.
export function markAsPaid(_id: string): PaymentLink | null {
  return null;
}

export function getAllLinks(): PaymentLink[] {
  return [];
}
