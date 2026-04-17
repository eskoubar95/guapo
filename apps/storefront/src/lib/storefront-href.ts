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
  const localePrefix = `/${locale}`;
  let path = t.startsWith("/") ? t : `/${t}`;
  if (path === localePrefix || path.startsWith(`${localePrefix}/`)) return path;
  return `${localePrefix}${path === "/" ? "" : path}`;
}
