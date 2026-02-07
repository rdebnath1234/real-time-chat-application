import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "chat-backend" });
});

export default router;
