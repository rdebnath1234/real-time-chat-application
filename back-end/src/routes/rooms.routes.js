import express from "express";
import { Room } from "../models/Room.js";
import { sanitizeRoom, isNonEmptyString } from "../utils/validators.js";

const router = express.Router();

/**
 * GET /api/rooms
 */
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 }).lean();
    res.json({ rooms: rooms.map((r) => r.name) });
  } catch {
    res.status(500).json({ error: "Failed to load rooms" });
  }
});

/**
 * POST /api/rooms
 * body: { room: "movies" }
 */
router.post("/", async (req, res) => {
  try {
    const room = sanitizeRoom(req.body?.room);

    if (!isNonEmptyString(room)) {
      return res.status(400).json({ error: "room is required" });
    }

    if (room.length > 30) {
      return res.status(400).json({ error: "room name too long (max 30)" });
    }

    // allow a-z, 0-9, -, _
    if (!/^[a-z0-9-_]+$/.test(room)) {
      return res
        .status(400)
        .json({ error: "room can contain a-z, 0-9, - and _ only" });
    }

    // Create (unique index will enforce no duplicates)
    await Room.create({ name: room });

    const rooms = await Room.find().sort({ name: 1 }).lean();
    return res.status(201).json({ ok: true, room, rooms: rooms.map((r) => r.name) });
  } catch (err) {
    // duplicate key error
    if (err?.code === 11000) {
      return res.status(409).json({ error: "room already exists" });
    }
    return res.status(500).json({ error: "Failed to create room" });
  }
});

export default router;
