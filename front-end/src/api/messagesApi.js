export async function fetchLastMessages(apiBase, room, limit = 50) {
  const url = new URL(`${apiBase}/api/messages`);
  url.searchParams.set("room", room);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}
