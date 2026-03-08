import { useEffect, useMemo, useRef, useState } from "react";
import MessageList from "./MessageList";
import OnlineUsers from "./OnlineUsers";

export default function ChatRoom({ socketRef, me, onLeave }) {
  const socket = socketRef.current;

  const [users, setUsers] = useState(() => me.initialUsers || []);
  const [messages, setMessages] = useState(() => me.initialMessages || []); // includes system messages
  const [text, setText] = useState("");
  const [status, setStatus] = useState("connected"); // small UI state
  const [typingUsers, setTypingUsers] = useState([]);

  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const roomLabel = useMemo(() => me.room, [me.room]);
  const typingLabel = useMemo(() => {
    const others = typingUsers.filter(
      (u) => u && u.toLowerCase() !== me.username.toLowerCase()
    );
    if (others.length === 0) return "";
    if (others.length === 1) return `${others[0]} is typing...`;
    if (others.length === 2) return `${others[0]} and ${others[1]} are typing...`;
    return `${others[0]} and ${others.length - 1} others are typing...`;
  }, [typingUsers, me.username]);

  useEffect(() => {
    if (!socket) return;

    function onUsersUpdate(payload) {
      if (payload.room === me.room) setUsers(payload.users || []);
    }

    function onNewMessage(msg) {
      if (msg.room !== me.room) return;
      setMessages((prev) => [...prev, msg]);
      if (msg.username?.toLowerCase() !== me.username.toLowerCase()) {
        socket.emit("message:read", { id: msg.id });
      }
    }

    function onMessageUpdated(msg) {
      if (msg.room !== me.room) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    }

    function onMessageDeleted(payload) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.id
            ? { ...m, isDeleted: true, text: "[message deleted]", editedAt: null }
            : m
        )
      );
    }

    function onReadUpdate(payload) {
      if (!payload?.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, readBy: payload.readBy || [] } : m))
      );
    }

    function onSystemMessage(sys) {
      if (sys.room !== me.room) return;
      setMessages((prev) => [
        ...prev,
        { id: sys.id, text: sys.text, createdAt: sys.createdAt, system: true }
      ]);
    }

    function onTypingUpdate(payload) {
      if (payload.room !== me.room) return;
      setTypingUsers(payload.users || []);
    }

    function onConnect() {
      setStatus("connected");
    }

    function onDisconnect() {
      setStatus("disconnected");
    }

    socket.on("users:update", onUsersUpdate);
    socket.on("message:new", onNewMessage);
    socket.on("message:updated", onMessageUpdated);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("message:read:update", onReadUpdate);
    socket.on("message:system", onSystemMessage);
    socket.on("typing:update", onTypingUpdate);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("users:update", onUsersUpdate);
      socket.off("message:new", onNewMessage);
      socket.off("message:updated", onMessageUpdated);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("message:read:update", onReadUpdate);
      socket.off("message:system", onSystemMessage);
      socket.off("typing:update", onTypingUpdate);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, me.room]);

  useEffect(() => {
    setMessages(me.initialMessages || []);
    setUsers(me.initialUsers || []);
    setTypingUsers([]);
  }, [me.room, me.initialMessages, me.initialUsers]);

  useEffect(() => {
    if (!socket) return;
    for (const m of messages) {
      if (m.system || !m.id) continue;
      if ((m.username || "").toLowerCase() === me.username.toLowerCase()) continue;
      const readers = new Set((m.readBy || []).map((u) => String(u).toLowerCase()));
      if (readers.has(me.username.toLowerCase())) continue;
      socket.emit("message:read", { id: m.id });
    }
  }, [messages, me.username, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop();
    };
  }, []);

  function emitTypingStart() {
    if (!socket || typingRef.current) return;
    typingRef.current = true;
    socket.emit("typing:start");
  }

  function emitTypingStop() {
    if (!socket || !typingRef.current) return;
    typingRef.current = false;
    socket.emit("typing:stop");
  }

  function scheduleTypingStop() {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 1200);
  }

  // Send message
  async function send(e) {
    e.preventDefault();
    if (!socket) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    socket.emit("message:send", { text: trimmed }, (ack) => {
      if (!ack?.ok) {
        alert(ack?.error || "Failed to send");
      }
    });

    emitTypingStop();
    setText("");
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setText(value);

    if (!socket) return;
    if (!value.trim()) {
      emitTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    emitTypingStart();
    scheduleTypingStop();
  }

  function handleLeave() {
    emitTypingStop();
    onLeave();
  }

  function editMessage(id, nextText) {
    if (!socket) return;
    socket.emit("message:edit", { id, text: nextText }, (ack) => {
      if (!ack?.ok) alert(ack?.error || "Failed to edit message");
    });
  }

  function deleteMessage(id) {
    if (!socket) return;
    socket.emit("message:delete", { id }, (ack) => {
      if (!ack?.ok) alert(ack?.error || "Failed to delete message");
    });
  }

  return (
    <div className="layout">
      <OnlineUsers users={users} />

      <div className="card main">
        <div className="topbar">
          <div>
            <h2>Room: {roomLabel}</h2>
            <p className="hint">
              You are <strong>{me.username}</strong> • Status: {status}
            </p>
          </div>
          <button onClick={handleLeave}>Leave</button>
        </div>

        <MessageList
          messages={messages}
          meUsername={me.username}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />

        {typingLabel ? <div className="typing">{typingLabel}</div> : null}

        <form onSubmit={send} className="composer">
          <input
            value={text}
            onChange={handleInputChange}
            placeholder="Type a message..."
            maxLength={1000}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
