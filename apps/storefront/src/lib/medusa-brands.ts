/**
 * Medusa Store API — brands for storefront.
 * Fetches from NEXT_PUBLIC_MEDUSA_BACKEND_URL/store/brands.
 */

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

const CACHE_TTL_MS = 60 * 1000;
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

export interface MedusaBrand {
  id: string;
  handle: string;
  name: string;
}

/**
 * Fetch all brands from Medusa Store API.
 */
export async function fetchMedusaBrands(): Promise<MedusaBrand[]> {
  const key = "medusa:brands";
  const cached = getCached<MedusaBrand[]>(key);
  if (cached !== null) return cached;

  try {
    const res = await fetch(`${MEDUSA_URL}/brands`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { brands?: Array<{ id?: string; handle?: string; name?: string }> };
    const list = (json.brands ?? [])
      .filter((b) => b.handle)
      .map((b) => ({ id: b.id ?? "", handle: b.handle ?? "", name: b.name ?? b.handle ?? "" }));
    setCache(key, list);
    return list;
  } catch {
    return [];
  }
}

/**
 * Fetch brand by handle.
 */
export async function fetchMedusaBrandByHandle(handle: string): Promise<MedusaBrand | null> {
  const brands = await fetchMedusaBrands();
  return brands.find((b) => b.handle === handle) ?? null;
}
