/**
 * Canonical storefront origin for metadata, OG tags, and absolute URLs.
 * Prefer NEXT_PUBLIC_SITE_URL in all deployed environments.
 */
export function getStorefrontSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

/** Turn a path or protocol-relative URL into an absolute https URL for crawlers (Facebook, etc.). */
export function toAbsoluteStorefrontUrl(pathOrUrl: string): string {
  const t = pathOrUrl.trim();
  if (!t) return "";
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = getStorefrontSiteUrl();
  return `${base}${t.startsWith("/") ? "" : "/"}${t}`;
}

/**
 * Absolute https URL for og:image / Twitter. Handles protocol-relative and Medusa path-only assets.
 */
export function normalizeImageUrlForSharing(url: string): string {
  const raw = url.trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const medusa = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "");
  if (raw.startsWith("/") && medusa) return `${medusa}${raw}`;
  return toAbsoluteStorefrontUrl(raw);
}
