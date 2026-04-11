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
    const nameVal = doc.name;
    const name = typeof nameVal === "string" ? nameVal : (nameVal as { da?: string; en?: string })?.[locale === "da" ? "da" : "en"];
    const metaVal = doc.meta;
    const meta = metaVal as PayloadCategoryEnrichment["meta"] | undefined;
    return {
      name: name as string | undefined,
      slug: doc.slug as string | undefined,
      body: doc.body,
      meta,
    };
  } catch {
    return null;
  }
}
