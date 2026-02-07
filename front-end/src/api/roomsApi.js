export async function fetchRooms(apiBase = "") {
  const res = await fetch(`${apiBase}/api/rooms`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export async function createRoom(apiBase = "", room) {
  const res = await fetch(`${apiBase}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Failed to create room");
  }

  return data;
}
