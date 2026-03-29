/**
 * Show first name + last initial for privacy (e.g. "Nicklas E.") while keeping a human feel.
 * Single-token names are shown as-is.
 */
export function formatReviewerDisplayName(
  raw: string | null | undefined,
  locale: string,
): string {
  const fallback = locale === "da" ? "Anonym" : "Anonymous";
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const initial = last[0]?.toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}
