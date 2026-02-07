import { useEffect, useMemo, useState } from "react";
import MessageList from "./MessageList";
import OnlineUsers from "./OnlineUsers";

export default function ChatRoom({ socketRef, me, onLeave }) {
  const socket = socketRef.current;

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]); // includes system messages
  const [text, setText] = useState("");
  const [status, setStatus] = useState("connected"); // small UI state

  const roomLabel = useMemo(() => me.room, [me.room]);

  useEffect(() => {
    if (!socket) return;

    function onUsersUpdate(payload) {
      if (payload.room === me.room) setUsers(payload.users || []);
    }

    function onNewMessage(msg) {
      if (msg.room !== me.room) return;
      setMessages((prev) => [...prev, msg]);
    }

    function onSystemMessage(sys) {
      if (sys.room !== me.room) return;
      setMessages((prev) => [
        ...prev,
        { id: sys.id, text: sys.text, createdAt: sys.createdAt, system: true }
      ]);
    }

    function onConnect() {
      setStatus("connected");
    }

    function onDisconnect() {
      setStatus("disconnected");
    }

    socket.on("users:update", onUsersUpdate);
    socket.on("message:new", onNewMessage);
    socket.on("message:system", onSystemMessage);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("users:update", onUsersUpdate);
      socket.off("message:new", onNewMessage);
      socket.off("message:system", onSystemMessage);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, me.room]);

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

    setText("");
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
          <button onClick={onLeave}>Leave</button>
        </div>

        <MessageList messages={messages} />

        <form onSubmit={send} className="composer">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
