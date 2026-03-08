import { Room } from "../models/Room.js";
import { Message } from "../models/Message.js";
import {
  isNonEmptyString,
  sanitizeRoom,
  sanitizeUsername
} from "../utils/validators.js";

const roomUsers = new Map();
const roomTyping = new Map();

function getRoomMap(room) {
  if (!roomUsers.has(room)) roomUsers.set(room, new Map());
  return roomUsers.get(room);
}

function getOnlineList(room) {
  const map = roomUsers.get(room);
  if (!map) return [];
  // return unique usernames (optional)
  return Array.from(map.values());
}

function getTypingSet(room) {
  if (!roomTyping.has(room)) roomTyping.set(room, new Set());
  return roomTyping.get(room);
}

function getTypingList(room) {
  const set = roomTyping.get(room);
  if (!set) return [];
  return Array.from(set.values());
}

function normalizeMessageDoc(m) {
  const id = String(m._id || m.id);
  const username = m.username || m.sender || "Unknown";
  const readBy = Array.isArray(m.readBy) ? m.readBy : [];
  return {
    id,
    room: m.room,
    username,
    text: m.isDeleted ? "[message deleted]" : m.text,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    editedAt: m.editedAt
      ? m.editedAt instanceof Date
        ? m.editedAt.toISOString()
        : m.editedAt
      : null,
    isDeleted: Boolean(m.isDeleted),
    readBy
  };
}

export function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    // Store current state on socket
    socket.data.username = null;
    socket.data.room = null;

    socket.on("room:join", async (payload, ack) => {
      try {
        const room = sanitizeRoom(payload?.room);
        const username = sanitizeUsername(payload?.username);
        const prevRoom = socket.data.room;
        const prevUsername = socket.data.username;

        if (!isNonEmptyString(room) || !isNonEmptyString(username)) {
          return ack?.({ ok: false, error: "room and username are required" });
        }
        if (username.length > 32) {
          return ack?.({ ok: false, error: "username too long (max 32)" });
        }

        const exists = await Room.exists({ name: room });
        if (!exists) {
          return ack?.({ ok: false, error: "Room does not exist. Create it first." });
        }

        const targetRoomMap = getRoomMap(room);
        const alreadyTaken = Array.from(targetRoomMap.entries()).some(
          ([sid, u]) =>
            sid !== socket.id &&
            u.toLowerCase() === username.toLowerCase()
        );

        if (alreadyTaken) {
          return ack?.({ ok: false, error: "Username already taken in this room" });
        }

        if (prevRoom && prevRoom !== room) {
          socket.leave(prevRoom);
          const prevRoomMap = getRoomMap(prevRoom);
          prevRoomMap.delete(socket.id);
          const prevTypingSet = getTypingSet(prevRoom);
          if (prevUsername) prevTypingSet.delete(prevUsername);
          io.to(prevRoom).emit("users:update", {
            room: prevRoom,
            users: getOnlineList(prevRoom)
          });
          io.to(prevRoom).emit("typing:update", {
            room: prevRoom,
            users: getTypingList(prevRoom)
          });
        }

        socket.join(room);
        socket.data.room = room;
        socket.data.username = username;

        targetRoomMap.set(socket.id, username);

        // Load last 50 messages from DB
        const latest = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        const normalized = latest.map((m) => normalizeMessageDoc(m));

        // Notify room about new user list + system event
        io.to(room).emit("users:update", { room, users: getOnlineList(room) });

        io.to(room).emit("message:system", {
          id: `sys-${Date.now()}`,
          room,
          text: `${username} joined`,
          createdAt: new Date().toISOString()
        });

        return ack?.({
          ok: true,
          room,
          username,
          users: getOnlineList(room),
          messages: normalized.reverse()
        });
      } catch (err) {
        console.error("❌ room:join error:", err); // ✅ see real error in terminal
        return ack?.({
          ok: false,
          error: err?.message || "Failed to join room"
        });
      }
    });

    socket.on("typing:start", () => {
      const room = sanitizeRoom(socket.data.room);
      const username = sanitizeUsername(socket.data.username);
      if (!room || !username) return;
      const set = getTypingSet(room);
      if (set.has(username)) return;
      set.add(username);
      io.to(room).emit("typing:update", { room, users: getTypingList(room) });
    });

    socket.on("typing:stop", () => {
      const room = sanitizeRoom(socket.data.room);
      const username = sanitizeUsername(socket.data.username);
      if (!room || !username) return;
      const set = getTypingSet(room);
      if (!set.has(username)) return;
      set.delete(username);
      io.to(room).emit("typing:update", { room, users: getTypingList(room) });
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const room = sanitizeRoom(socket.data.room);
        const username = sanitizeUsername(socket.data.username);
        const text = String(payload?.text || "").trim();

        if (!room || !username) {
          return ack?.({ ok: false, error: "Join a room first" });
        }
        if (!isNonEmptyString(text)) {
          return ack?.({ ok: false, error: "Message cannot be empty" });
        }
        if (text.length > 1000) {
          return ack?.({ ok: false, error: "Message too long (max 1000)" });
        }

        // Save to DB
        const doc = await Message.create({
          room,
          username,
          text,
          readBy: [username.toLowerCase()]
        });
        const msg = normalizeMessageDoc(doc);

        // Broadcast to the room
        io.to(room).emit("message:new", msg);

        return ack?.({ ok: true });
      } catch (err) {
        return ack?.({ ok: false, error: "Failed to send message" });
      }
    });

    socket.on("message:read", async (payload) => {
      try {
        const room = sanitizeRoom(socket.data.room);
        const username = sanitizeUsername(socket.data.username);
        const messageId = String(payload?.id || "").trim();
        if (!room || !username || !messageId) return;

        const doc = await Message.findOne({ _id: messageId, room });
        if (!doc) return;

        const marker = username.toLowerCase();
        const readBy = new Set((doc.readBy || []).map((u) => String(u).toLowerCase()));
        if (readBy.has(marker)) return;
        readBy.add(marker);
        doc.readBy = Array.from(readBy);
        await doc.save();

        io.to(room).emit("message:read:update", {
          id: String(doc._id),
          readBy: doc.readBy
        });
      } catch {
        // no-op
      }
    });

    socket.on("message:edit", async (payload, ack) => {
      try {
        const room = sanitizeRoom(socket.data.room);
        const username = sanitizeUsername(socket.data.username);
        const messageId = String(payload?.id || "").trim();
        const text = String(payload?.text || "").trim();

        if (!room || !username) return ack?.({ ok: false, error: "Join a room first" });
        if (!messageId) return ack?.({ ok: false, error: "Message id is required" });
        if (!isNonEmptyString(text)) return ack?.({ ok: false, error: "Message cannot be empty" });
        if (text.length > 1000) return ack?.({ ok: false, error: "Message too long (max 1000)" });

        const doc = await Message.findOne({ _id: messageId, room });
        if (!doc) return ack?.({ ok: false, error: "Message not found" });
        if ((doc.username || "").toLowerCase() !== username.toLowerCase()) {
          return ack?.({ ok: false, error: "You can edit only your own messages" });
        }
        if (doc.isDeleted) return ack?.({ ok: false, error: "Deleted message cannot be edited" });

        const readers = new Set((doc.readBy || []).map((u) => String(u).toLowerCase()));
        readers.delete(username.toLowerCase());
        if (readers.size > 0) {
          return ack?.({ ok: false, error: "Cannot edit after message is read" });
        }

        doc.text = text;
        doc.editedAt = new Date();
        await doc.save();

        io.to(room).emit("message:updated", normalizeMessageDoc(doc));
        return ack?.({ ok: true });
      } catch {
        return ack?.({ ok: false, error: "Failed to edit message" });
      }
    });

    socket.on("message:delete", async (payload, ack) => {
      try {
        const room = sanitizeRoom(socket.data.room);
        const username = sanitizeUsername(socket.data.username);
        const messageId = String(payload?.id || "").trim();

        if (!room || !username) return ack?.({ ok: false, error: "Join a room first" });
        if (!messageId) return ack?.({ ok: false, error: "Message id is required" });

        const doc = await Message.findOne({ _id: messageId, room });
        if (!doc) return ack?.({ ok: false, error: "Message not found" });
        if ((doc.username || "").toLowerCase() !== username.toLowerCase()) {
          return ack?.({ ok: false, error: "You can delete only your own messages" });
        }
        if (doc.isDeleted) return ack?.({ ok: true });

        const readers = new Set((doc.readBy || []).map((u) => String(u).toLowerCase()));
        readers.delete(username.toLowerCase());
        if (readers.size > 0) {
          return ack?.({ ok: false, error: "Cannot delete after message is read" });
        }

        doc.isDeleted = true;
        doc.text = "[message deleted]";
        doc.editedAt = null;
        await doc.save();

        io.to(room).emit("message:deleted", { id: String(doc._id), isDeleted: true, text: "[message deleted]" });
        return ack?.({ ok: true });
      } catch {
        return ack?.({ ok: false, error: "Failed to delete message" });
      }
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;
      const username = socket.data.username;

      if (!room) return;

      const map = getRoomMap(room);
      map.delete(socket.id);
      const typingSet = getTypingSet(room);
      if (username) typingSet.delete(username);

      io.to(room).emit("users:update", { room, users: getOnlineList(room) });
      io.to(room).emit("typing:update", { room, users: getTypingList(room) });

      if (username) {
        io.to(room).emit("message:system", {
          id: `sys-${Date.now()}`,
          room,
          text: `${username} left`,
          createdAt: new Date().toISOString()
        });
      }
    });
  });
}
