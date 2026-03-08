export async function fetchLastMessages(apiBase, room, limit = 50) {
  const base = apiBase || window.location.origin;
  const url = new URL("/api/messages", base);
  url.searchParams.set("room", room);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}
