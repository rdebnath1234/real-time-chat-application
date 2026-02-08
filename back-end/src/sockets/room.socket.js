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

export function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    // Store current state on socket
    socket.data.username = null;
    socket.data.room = null;

    socket.on("room:join", async (payload, ack) => {
      try {
        const room = sanitizeRoom(payload?.room);
        const username = sanitizeUsername(payload?.username);

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

        if (socket.data.room) {
          socket.leave(socket.data.room);
          const prevRoomMap = getRoomMap(socket.data.room);
          prevRoomMap.delete(socket.id);
          const prevTypingSet = getTypingSet(socket.data.room);
          if (socket.data.username) prevTypingSet.delete(socket.data.username);
          io.to(socket.data.room).emit("users:update", {
            room: socket.data.room,
            users: getOnlineList(socket.data.room)
          });
          io.to(socket.data.room).emit("typing:update", {
            room: socket.data.room,
            users: getTypingList(socket.data.room)
          });
        }
        

        // Join new room
        socket.join(room);
        socket.data.room = room;
        socket.data.username = username;

        // Track presence
        const map = getRoomMap(room);

        // ✅ Prevent duplicate username in the same room (case-insensitive)
        const alreadyTaken = Array.from(map.values()).some(
          (u) => u.toLowerCase() === username.toLowerCase()
        );

        if (alreadyTaken) {
          return ack?.({ ok: false, error: "Username already taken in this room" });
        }



        map.set(socket.id, username);

        // Load last 50 messages from DB
        const latest = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

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
          messages: latest.reverse()
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
        const doc = await Message.create({ room, username, text });

        const msg = {
          id: String(doc._id),
          room,
          username,
          text,
          createdAt: doc.createdAt.toISOString()
        };

        // Broadcast to the room
        io.to(room).emit("message:new", msg);

        return ack?.({ ok: true });
      } catch (err) {
        return ack?.({ ok: false, error: "Failed to send message" });
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
