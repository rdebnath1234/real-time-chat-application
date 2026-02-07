// ✅ Escape HTML to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Supports:
 * - **bold**
 * - *italic*
 * - auto-link (http/https)
 *
 * Safe approach:
 * 1) escape everything
 * 2) apply limited formatting
 * 3) linkify
 */
export function formatMessage(text) {
  let safe = escapeHtml(text);

  // Bold: **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  // (simple version; works for basic cases)
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Auto-link URLs
  safe = safe.replace(
    /(https?:\/\/[^\s]+)/g,
    `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`
  );

  return safe;
}
