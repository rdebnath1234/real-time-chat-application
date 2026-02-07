import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function JoinForm({ onJoin }) {
  const [username, setUsername] = useState("");
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
      if (!room && data.rooms?.length) {
        setRoom((prev) => prev || data.rooms?.[0] || "");
      }
    } catch {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    const r = newRoom.trim().toLowerCase();
    if (!r) return;

    try {
      setCreating(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: r })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      setRooms(data.rooms);
      setRoom(r);
      setNewRoom("");
    } catch {
      setError("Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    const u = username.trim();
    const r = room.trim().toLowerCase();
    if (!u) return setError("Username is required");
    if (u.length > 32) return setError("Username max 32 characters");
    if (!r) return setError("Please select a room");

    onJoin({ username: u, room : r });
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>Join Chat</h2>

      <label>Username</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Your name"
      />

      <label>Room</label>
      {loading ? (
        <p className="hint">Loading rooms...</p>
      ) : (
        <select value={room} onChange={(e) => setRoom(e.target.value)}>
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}

      <label>Create new room</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="e.g. movies"
        />
        <button type="button" onClick={handleCreateRoom} disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit">Join</button>

      <button
        type="button"
        onClick={loadRooms}
        style={{ background: "#111827" }}
      >
        Refresh rooms
      </button>
    </form>
  );
}
