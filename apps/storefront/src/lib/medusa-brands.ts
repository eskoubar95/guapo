/**
 * Medusa Store API — brands for storefront.
 * Fetches from NEXT_PUBLIC_MEDUSA_BACKEND_URL/store/brands.
 * Optional Payload enrichment via NEXT_PUBLIC_PAYLOAD_API_URL / PAYLOAD_API_URL.
 */

import { stripCategorySeoTitleSuffix } from "@/lib/medusa-categories";

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

const PAYLOAD_URL = (process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "").replace(
  /\/$/,
  ""
);

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

export interface PayloadBrandEnrichment {
  displayName?: string;
  body?: unknown;
  meta?: { title?: string; description?: string; image?: unknown };
}

function pickLocalizedTextField(value: unknown, locale: string): string | undefined {
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

function normalizePayloadMeta(
  metaVal: unknown,
  locale: string
): PayloadBrandEnrichment["meta"] | undefined {
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

/**
 * H1 + title fallback: Payload displayName → stripped SEO title → Medusa name → handle.
 */
export function resolveBrandDisplayTitle(
  payloadBrand: PayloadBrandEnrichment | null,
  medusaName: string,
  medusaHandle: string
): string {
  const d = payloadBrand?.displayName?.trim();
  if (d) return d;
  const mt = payloadBrand?.meta?.title?.trim();
  if (mt) return stripCategorySeoTitleSuffix(mt);
  const m = medusaName?.trim();
  if (m) return m;
  return medusaHandle;
}

export async function fetchPayloadBrandByHandle(
  handle: string,
  locale: string,
  medusaBrandId?: string
): Promise<PayloadBrandEnrichment | null> {
  if (!PAYLOAD_URL) return null;
  try {
    const fallbackLocale = locale === "da" ? "en" : "da";
    const params = new URLSearchParams({
      locale,
      "fallback-locale": fallbackLocale,
    });
    if (medusaBrandId) {
      params.set("medusa_id", medusaBrandId);
    }
    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/brand/${encodeURIComponent(handle)}?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale === "da" ? "da,en" : "en,da",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
    const doc = json.docs?.[0];
    if (!doc) return null;
    return {
      displayName: pickLocalizedTextField(doc.displayName, locale),
      body: doc.body,
      meta: normalizePayloadMeta(doc.meta, locale),
    };
  } catch {
    return null;
  }
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
