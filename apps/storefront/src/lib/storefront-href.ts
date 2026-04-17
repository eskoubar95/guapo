/**
 * Maps CMS-entered paths or external URLs to values suitable for next/link href.
 * Empty / whitespace-only input returns undefined (caller chooses default or omits link).
 */
export function resolveStorefrontLinkHref(
  raw: string | null | undefined,
  locale: string,
): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  // Anchors, protocol-relative URLs, and non-http(s) schemes (mailto:, tel:, …)
  if (t.startsWith("#") || t.startsWith("//")) return t;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return t;
  const localePrefix = `/${locale}`;
  let path = t.startsWith("/") ? t : `/${t}`;
  if (path === localePrefix || path.startsWith(`${localePrefix}/`)) return path;
  return `${localePrefix}${path === "/" ? "" : path}`;
}
