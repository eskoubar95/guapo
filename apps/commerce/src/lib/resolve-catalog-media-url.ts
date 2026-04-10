/**
 * Product thumbnails from Medusa may be absolute URLs or paths relative to the backend.
 * Email clients need absolute https URLs.
 */
export function resolveCatalogMediaUrl(raw: string | null | undefined): string | undefined {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  const backend = (process.env.MEDUSA_BACKEND_URL ?? process.env.STOREFRONT_URL ?? "").replace(/\/$/, "");
  const s3Public = (process.env.S3_FILE_URL ?? "").replace(/\/$/, "");
  if (v.startsWith("/")) {
    if (backend) return `${backend}${v}`;
    return undefined;
  }
  if (s3Public) return `${s3Public}/${v.replace(/^\//, "")}`;
  if (backend) return `${backend}/${v.replace(/^\//, "")}`;
  return undefined;
}
