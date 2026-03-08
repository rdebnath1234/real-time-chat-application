import { useState } from "react";
import JoinForm from "./components/JoinForm";
import ChatRoom from "./components/ChatRoom";
import { useSocket } from "./hooks/useSocket";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export default function App() {
  const { socketRef, isConnected } = useSocket(SOCKET_URL);

  const [me, setMe] = useState(null);
  const [loadingJoin, setLoadingJoin] = useState(false);

  function join({ username, room }) {
    if (!socketRef.current) return;

    setLoadingJoin(true);

    socketRef.current.emit("room:join", { username, room }, (ack) => {
      setLoadingJoin(false);

      if (!ack?.ok) {
        alert(ack?.error || "Failed to join");
        return;
      }

      const initialMessages = (ack.messages || []).map((m) => ({
        id: String(m._id || m.id),
        room: ack.room,
        username: m.username,
        text: m.text,
        createdAt: m.createdAt
      }));

      setMe({
        username: ack.username,
        room: ack.room,
        initialMessages,
        initialUsers: ack.users || []
      });
    });
  }

  function leave() {
    setMe(null);
  }

  // ✅ THIS is the real fix
  if (!isConnected) return <div className="page">Connecting...</div>;

  return (
    <div className="page">
      <h1>Mini Real-time Chat</h1>
      {me ? (
        <ChatRoom socketRef={socketRef} me={me} onLeave={leave} />
      ) : (
        <>
          {loadingJoin ? <p>Joining...</p> : null}
          <JoinForm onJoin={join} />
        </>
      )}
    </div>
  );
}
