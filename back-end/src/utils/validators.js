export function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function sanitizeRoom(room) {
  return String(room || "").trim().toLowerCase();
}

export function sanitizeUsername(username) {
  return String(username || "").trim();
}
