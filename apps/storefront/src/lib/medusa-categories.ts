/**
 * Medusa Store API — categories for storefront.
 * Fetches from NEXT_PUBLIC_MEDUSA_BACKEND_URL/store/product-categories.
 * Optional Payload enrichment via PAYLOAD_API_URL for CMS fields (name, body, SEO).
 */

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

const PAYLOAD_URL = process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

const CACHE_TTL_MS = 60 * 1000; // 1 min
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

function medusaHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (key) headers["x-publishable-api-key"] = key;
  return headers;
}

export interface MedusaCategory {
  id: string;
  handle: string;
  name?: string;
  description?: string;
  parent_category_id?: string | null;
  category_children?: MedusaCategory[];
  rank?: number;
}

/** List all categories with children tree, then filter to top-level (no parent). */
export async function fetchTopLevelCategories(): Promise<MedusaCategory[]> {
  const key = "medusa:top-categories";
  const cached = getCached<MedusaCategory[]>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      include_descendants_tree: "true",
      fields: "id,handle,name,description,parent_category_id,rank,*category_children.id,*category_children.handle,*category_children.name,*category_children.rank",
      limit: "100",
    });
    const res = await fetch(`${MEDUSA_URL}/product-categories?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { product_categories?: MedusaCategory[] };
    const all = json.product_categories ?? [];
    const topLevel = all.filter(
      (c) => !c.parent_category_id || c.parent_category_id === "null" || c.parent_category_id === ""
    );
    setCache(key, topLevel);
    return topLevel;
  } catch {
    return [];
  }
}

/** Get category by handle (searches in flat list). */
export async function fetchCategoryByHandle(handle: string): Promise<MedusaCategory | null> {
  const key = `medusa:category:${handle}`;
  const cached = getCached<MedusaCategory | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      handle,
      include_descendants_tree: "true",
      fields: "id,handle,name,description,parent_category_id,rank,*category_children.id,*category_children.handle,*category_children.name,*category_children.rank",
      limit: "1",
    });
    const res = await fetch(`${MEDUSA_URL}/product-categories?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { product_categories?: MedusaCategory[] };
    const cat = json.product_categories?.[0] ?? null;
    if (cat !== null) setCache(key, cat);
    return cat;
  } catch {
    return null;
  }
}

export interface PayloadCategoryEnrichment {
  name?: string;
  slug?: string;
  body?: unknown;
  /** SEO group from Payload (incl. optional OG image relation when fetched with depth). */
  meta?: { title?: string; description?: string; image?: unknown };
}

function pickLocalizedTextField(
  value: unknown,
  locale: string
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : undefined;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, string | undefined>;
    const key = locale === "da" ? "da" : "en";
    const raw = o[key] ?? o.da ?? o.en;
    if (typeof raw === "string") {
      const t = raw.trim();
      return t.length > 0 ? t : undefined;
    }
  }
  return undefined;
}

/**
 * Localized `meta` group can be flat (REST + ?locale) or nested per locale depending on Payload version.
 */
function normalizePayloadCategoryMeta(
  metaVal: unknown,
  locale: string
): PayloadCategoryEnrichment["meta"] | undefined {
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
      image: flatImage,
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
    image: img,
  };
}

/** Optional: enrich with Payload CMS category data (name override, body, SEO). */
export async function fetchPayloadCategoryByHandle(
  handle: string,
  locale: string
): Promise<PayloadCategoryEnrichment | null> {
  if (!PAYLOAD_URL) return null;
  try {
    const params = new URLSearchParams({
      "where[handle][equals]": handle,
      limit: "1",
      locale,
      depth: "1",
    });
    const res = await fetch(`${PAYLOAD_URL}/api/categories?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
    const doc = json.docs?.[0];
    if (!doc) return null;
    const name = pickLocalizedTextField(doc.name, locale);
    const meta = normalizePayloadCategoryMeta(doc.meta, locale);
    return {
      name,
      slug: pickLocalizedTextField(doc.slug, locale),
      body: doc.body,
      meta,
    };
  } catch {
    return null;
  }
}
