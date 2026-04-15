/**
 * Normalize Payload `meta` for storefront (flat per locale vs nested by locale from API).
 * Matches logic used for category Payload enrichment.
 */
import type { PayloadHomepageMeta } from "@/lib/payload-homepage";

/**
 * Returns a flat `meta` object for the active locale (title, description, image reference).
 */
export function normalizePayloadSeoMeta(
  metaVal: unknown,
  locale: string,
): PayloadHomepageMeta | undefined {
  if (metaVal == null) return undefined;
  if (typeof metaVal !== "object" || Array.isArray(metaVal)) return undefined;
  const m = metaVal as Record<string, unknown>;

  const flatTitle = typeof m.title === "string" ? m.title.trim() : undefined;
  const flatDesc = typeof m.description === "string" ? m.description.trim() : undefined;
  const flatImage = m.image;

  if (flatTitle || flatDesc || flatImage != null) {
    return {
      title: flatTitle || undefined,
      description: flatDesc || undefined,
      image: flatImage as PayloadHomepageMeta["image"],
    };
  }

  const key = locale === "da" ? "da" : "en";
  const inner = (m[key] ?? m.da ?? m.en) as Record<string, unknown> | undefined;
  if (!inner || typeof inner !== "object") return undefined;
  const t = typeof inner.title === "string" ? inner.title.trim() : undefined;
  const d = typeof inner.description === "string" ? inner.description.trim() : undefined;
  const img = inner.image;
  if (!t && !d && img == null) return undefined;
  return {
    title: t || undefined,
    description: d || undefined,
    image: img as PayloadHomepageMeta["image"],
  };
}

/** Merge normalized meta onto a document-shaped object if it has a `meta` key. */
export function withNormalizedSeoMeta<T extends { meta?: unknown }>(
  doc: T,
  locale: string,
): T {
  const normalized = normalizePayloadSeoMeta(doc.meta, locale);
  if (!normalized) return doc;
  return { ...doc, meta: normalized };
}
