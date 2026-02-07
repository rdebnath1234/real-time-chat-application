import express from "express";
import { Message } from "../models/Message.js";
import { sanitizeRoom } from "../utils/validators.js";

const router = express.Router();

/**
 * GET /api/messages?room=general&limit=50
 * Returns latest messages (default 50) in ascending time order (old -> new)
 */
router.get("/", async (req, res) => {
  try {
    const room = sanitizeRoom(req.query.room);
    const limit = Math.min(Number(req.query.limit || 50), 100);

    if (!room) return res.status(400).json({ error: "room is required" });

    // Fetch newest first, then reverse to display old -> new
    const latest = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ room, messages: latest.reverse() });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

export default router;
