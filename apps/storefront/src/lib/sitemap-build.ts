/**
 * Collects URL rows for Next.js MetadataRoute.Sitemap (Medusa + Payload + static routes).
 */
import type { MetadataRoute } from "next";
import { isValidLocale, sitemapLocales, type Locale } from "@/i18n/config";
import { getStorefrontSiteUrl } from "@/lib/site-url";
import { fetchTopLevelCategories, type MedusaCategory } from "@/lib/medusa-categories";
import { CONCERN_PLP_HANDLES } from "@/lib/concern-handles";

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

const PAYLOAD_URL = (process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "").replace(
  /\/$/,
  "",
);

function medusaHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (key) headers["x-publishable-api-key"] = key;
  return headers;
}

let cachedRegionId: string | null = null;
let regionIdExpires = 0;

async function getRegionId(): Promise<string | null> {
  if (cachedRegionId && Date.now() < regionIdExpires) return cachedRegionId;
  try {
    const res = await fetch(`${MEDUSA_URL}/regions?currency_code=dkk`, {
      headers: medusaHeaders(),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const regions = data.regions ?? data;
    const id = Array.isArray(regions) ? regions[0]?.id : regions?.id;
    if (id) {
      cachedRegionId = id;
      regionIdExpires = Date.now() + 5 * 60 * 1000;
    }
    return id ?? null;
  } catch {
    return null;
  }
}

async function appendPricingParams(params: URLSearchParams): Promise<void> {
  const regionId = await getRegionId();
  if (regionId) {
    params.set("region_id", regionId);
    params.set("country_code", "dk");
  }
}

function flattenCategoryHandles(categories: MedusaCategory[]): string[] {
  const out: string[] = [];
  function walk(c: MedusaCategory) {
    if (c.handle) out.push(c.handle);
    for (const ch of c.category_children ?? []) walk(ch);
  }
  for (const c of categories) walk(c);
  return [...new Set(out)];
}

async function fetchAllProductHandles(): Promise<string[]> {
  const handles: string[] = [];
  const limit = 100;
  let offset = 0;
  const maxPages = 200;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      fields: "id,handle",
    });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const json = (await res.json()) as { products?: Array<{ handle?: string }> };
    const list = json.products ?? [];
    for (const p of list) {
      if (p.handle) handles.push(p.handle);
    }
    if (list.length < limit) break;
    offset += limit;
  }
  return [...new Set(handles)];
}

async function fetchBrandHandles(): Promise<string[]> {
  try {
    const res = await fetch(`${MEDUSA_URL}/brands`, {
      headers: medusaHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { brands?: Array<{ handle?: string }> };
    const rows = json.brands ?? [];
    return [...new Set(rows.map((b) => b.handle).filter((h): h is string => !!h && h.length > 0))];
  } catch {
    return [];
  }
}

interface SitemapPayloadResponse {
  pages?: Array<{ locale: string; path: string; updatedAt?: string | null }>;
  articles?: Array<{ locale: string; slug: string; updatedAt?: string | null }>;
}

async function fetchPayloadSitemapRows(): Promise<SitemapPayloadResponse> {
  if (!PAYLOAD_URL) return {};
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/sitemap-data`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return (await res.json()) as SitemapPayloadResponse;
  } catch {
    return {};
  }
}

function staticPublicPaths(): string[] {
  return [
    "",
    "/categories",
    "/brands",
    "/concerns",
    "/blog",
    "/support/faq",
    "/support/contact",
    "/policies/terms",
    "/policies/privacy",
    "/policies/cookies",
    "/policies/returns",
  ];
}

function toLastMod(iso: string | null | undefined): Date | undefined {
  if (!iso || typeof iso !== "string") return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Builds the full sitemap for the storefront (locales in `sitemapLocales` from i18n config).
 */
function pushEntry(
  entries: MetadataRoute.Sitemap,
  seen: Set<string>,
  row: MetadataRoute.Sitemap[number],
) {
  if (seen.has(row.url)) return;
  seen.add(row.url);
  entries.push(row);
}

export async function buildStorefrontSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getStorefrontSiteUrl();
  const entries: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  const [categories, productHandles, brandHandles, payloadRows] = await Promise.all([
    fetchTopLevelCategories(),
    fetchAllProductHandles(),
    fetchBrandHandles(),
    fetchPayloadSitemapRows(),
  ]);

  const categoryHandles = flattenCategoryHandles(categories);

  const sitemapLocaleSet = new Set<string>(sitemapLocales);

  for (const row of payloadRows.pages ?? []) {
    if (!isValidLocale(row.locale)) continue;
    const loc = row.locale;
    if (!sitemapLocaleSet.has(loc)) continue;
    const path = row.path.trim();
    if (path === "home") {
      pushEntry(entries, seenUrls, {
        url: `${base}/${loc}`,
        lastModified: toLastMod(row.updatedAt),
        changeFrequency: "daily",
        priority: 1,
      });
      continue;
    }
    const u = `${base}/${loc}/${path.split("/").map(encodeURIComponent).join("/")}`;
    pushEntry(entries, seenUrls, {
      url: u,
      lastModified: toLastMod(row.updatedAt),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const row of payloadRows.articles ?? []) {
    if (!isValidLocale(row.locale)) continue;
    const loc = row.locale;
    if (!sitemapLocaleSet.has(loc)) continue;
    const u = `${base}/${loc}/blog/${encodeURIComponent(row.slug.trim())}`;
    pushEntry(entries, seenUrls, {
      url: u,
      lastModified: toLastMod(row.updatedAt),
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  for (const locale of sitemapLocales) {
    const loc = locale as Locale;
    const prefix = `/${loc}`;

    for (const p of staticPublicPaths()) {
      const url = `${base}${prefix}${p || ""}`;
      if (p === "" && seenUrls.has(url)) continue;
      pushEntry(entries, seenUrls, {
        url,
        changeFrequency: p === "" ? "daily" : "weekly",
        priority: p === "" ? 1 : 0.7,
      });
    }

    for (const h of categoryHandles) {
      pushEntry(entries, seenUrls, {
        url: `${base}${prefix}/categories/${encodeURIComponent(h)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const h of brandHandles) {
      pushEntry(entries, seenUrls, {
        url: `${base}${prefix}/brands/${encodeURIComponent(h)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const h of CONCERN_PLP_HANDLES) {
      pushEntry(entries, seenUrls, {
        url: `${base}${prefix}/concerns/${h}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const handle of productHandles) {
      pushEntry(entries, seenUrls, {
        url: `${base}${prefix}/products/${encodeURIComponent(handle)}`,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  return entries;
}
