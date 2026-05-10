import { randomUUID } from "crypto";

export interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  seller: string;
  status: "pendiente" | "pagado";
  createdAt: string;
}

// Base de datos en memoria por ahora (para el hackathon está perfecto)
export const db: PaymentLink[] = [
  {
    id: "abc123",
    amount: 200,
    description: "Diseño de logo",
    seller: "gloria.sol",
    status: "pagado",
    createdAt: new Date().toISOString(),
  },
  {
    id: "xyz789",
    amount: 500,
    description: "Website completo",
    seller: "gloria.sol",
    status: "pendiente",
    createdAt: new Date().toISOString(),
  },
];

export function createLink(amount: number, description: string, seller: string): PaymentLink {
  const link: PaymentLink = {
    id: randomUUID().slice(0, 8),
    amount,
    description,
    seller,
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  db.push(link);
  return link;
}

export function getLinkById(id: string): PaymentLink | undefined {
  return db.find((l) => l.id === id);
}

export function markAsPaid(id: string): PaymentLink | undefined {
  const link = db.find((l) => l.id === id);
  if (link) link.status = "pagado";
  return link;
}