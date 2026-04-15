/** Plain text for JSON-LD descriptions (strip simple HTML tags). */
export function stripHtmlToPlainText(html: string, maxLen = 8000): string {
  if (!html) return "";
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? `${plain.slice(0, maxLen - 1)}…` : plain;
}
