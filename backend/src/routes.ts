import { Router } from "express";
import { createLink, getLinkById, markAsPaid, getAllLinks } from "./db";
import { x402Gate } from "./x402";

export const router = Router();

router.get("/links", (_req, res) => {
  res.json(getAllLinks());
});

router.get("/links/:id", (req, res) => {
  const link = getLinkById(req.params.id);
  if (!link) {
    res.status(404).json({ error: "Link no encontrado" });
    return;
  }
  res.json(link);
});

router.post("/links", (req, res) => {
  const { amount, description, seller } = req.body;
  if (!amount || !seller) {
    res.status(400).json({ error: "amount y seller son requeridos" });
    return;
  }
  res.json(createLink(amount, description, seller));
});

router.post("/webhook/:id", (_req, res) => {
  res.status(404).json({ error: "Link no encontrado" });
});

router.get("/resource/:onchainParam", x402Gate, (req, res) => {
  res.json({
    unlocked: true,
    content: "Access granted. This is the protected resource content.",
    link: req.params["onchainParam"],
    unlockedAt: new Date().toISOString(),
  });
});
