import { Router } from "express";
import { createLink, getLinkById, markAsPaid, db } from "./db";
import { x402Gate } from "./x402";

export const router = Router();

// Obtener todos los links del seller
router.get("/links", (req, res) => {
  res.json(db);
});

// Obtener un link por id
router.get("/links/:id", (req, res) => {
  const link = getLinkById(req.params.id);
  if (!link) {
    res.status(404).json({ error: "Link no encontrado" });
    return;
  }
  res.json(link);
});

// Crear un nuevo link
router.post("/links", (req, res) => {
  const { amount, description, seller } = req.body;
  if (!amount || !seller) {
    res.status(400).json({ error: "amount y seller son requeridos" });
    return;
  }
  const link = createLink(amount, description, seller);
  res.json(link);
});

// Marcar un link como pagado (webhook)
router.post("/webhook/:id", (req, res) => {
  const link = markAsPaid(req.params.id);
  if (!link) {
    res.status(404).json({ error: "Link no encontrado" });
    return;
  }
  res.json({ success: true, link });
});

// x402-gated resource — returns 402 without payment proof, 200 after on-chain verification
// :onchainParam format: "{base58seller}-{linkId}"
router.get("/resource/:onchainParam", x402Gate, (req, res) => {
  res.json({
    unlocked: true,
    content: "Access granted. This is the protected resource content.",
    link: req.params["onchainParam"],
    unlockedAt: new Date().toISOString(),
  });
});