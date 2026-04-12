/**
 * Medusa Store API — products for storefront.
 * Fetches from NEXT_PUBLIC_MEDUSA_BACKEND_URL/store/products.
 */

import type { Product } from "@/components/ProductCard";
import { getVariantStockInfo } from "@/lib/product-inventory";
import { getCached, readCache, setCache } from "@/lib/server-cache";

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

let cachedRegionId: string | null = null;
let regionIdExpires = 0;

function medusaHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (key) headers["x-publishable-api-key"] = key;
  return headers;
}

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

function appendPricingParams(params: URLSearchParams): Promise<void> {
  return getRegionId().then((regionId) => {
    if (regionId) {
      params.set("region_id", regionId);
      params.set("country_code", "dk");
    }
  });
}

type BrandInfo = { name: string; handle: string };
type BrandRow = { id: string; name: string; handle: string };
let brandLookup: Map<string, BrandInfo> | null = null;
let brandRowsCache: BrandRow[] | null = null;
let brandLookupExpires = 0;

async function getBrandLookup(): Promise<Map<string, BrandInfo>> {
  if (brandLookup && Date.now() < brandLookupExpires) return brandLookup;
  try {
    const res = await fetch(`${MEDUSA_URL}/brands`, {
      headers: medusaHeaders(),
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = (await res.json()) as { brands?: Array<{ id: string; name?: string; handle?: string }> };
      const rows: BrandRow[] = (json.brands ?? []).map((b) => ({
        id: b.id,
        name: b.name ?? "",
        handle: b.handle ?? b.id,
      }));
      brandRowsCache = rows;
      brandLookup = new Map(rows.map((b) => [b.id, { name: b.name, handle: b.handle }]));
      brandLookupExpires = Date.now() + 5 * 60 * 1000;
      return brandLookup;
    }
  } catch { /* fall through */ }
  return brandLookup ?? new Map();
}

/** Brand rows for search; shares cache with getBrandLookup(). */
async function getBrandRows(): Promise<BrandRow[]> {
  await getBrandLookup();
  return brandRowsCache ?? [];
}

/** Split brand text into comparable tokens (whole-word matching). */
function brandTokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s\-_/&,+.]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  );
}

function scoreSingleWordAgainstBrand(
  name: string,
  handle: string,
  nameTokens: Set<string>,
  handleTokens: Set<string>,
  w: string
): number {
  if (w.length < 2) return 0;
  if (handle === w) return 100;
  if (name === w) return 98;
  if (nameTokens.has(w) || handleTokens.has(w)) return 88;
  if (name.startsWith(`${w} `) || name.startsWith(`${w}-`) || name.startsWith(`${w}/`)) return 78;
  if (handle.startsWith(`${w}-`) || handle.startsWith(w)) return 74;
  if (name.includes(w) || handle.includes(w)) {
    return w.length <= 3 ? 34 : 52;
  }
  return 0;
}

/**
 * Higher score = better match. Whole-word and exact handle/name win over arbitrary substring.
 * Multi-word queries: full phrase or best single meaningful token (e.g. "Anua serum" → brand Anua).
 */
function brandMatchScore(b: BrandRow, q: string): number {
  const trimmed = q.trim().toLowerCase();
  if (trimmed.length < 2) return 0;
  const name = b.name.toLowerCase();
  const handle = b.handle.toLowerCase();
  const nameTokens = brandTokenSet(b.name);
  const handleTokens = brandTokenSet(b.handle.replace(/_/g, "-"));

  const queryParts = trimmed.split(/\s+/).filter((p) => p.length >= 2);
  if (queryParts.length === 0) return 0;

  if (queryParts.length === 1) {
    return scoreSingleWordAgainstBrand(name, handle, nameTokens, handleTokens, queryParts[0]);
  }

  const phrase = queryParts.join(" ");
  const phraseAsHandle = phrase.replace(/\s+/g, "-");
  if (name.includes(phrase) || handle === phraseAsHandle || handle.includes(phraseAsHandle)) {
    return 92;
  }

  let best = 0;
  for (const w of queryParts) {
    const s = scoreSingleWordAgainstBrand(name, handle, nameTokens, handleTokens, w);
    if (s > best) best = s;
  }
  if (best >= 88) return best - 2;
  if (best > 0) return best - 8;
  return 0;
}

/** Distinct brand handles matching the query, best matches first (for product fetch order). */
function brandHandlesMatchingSearchQuery(rows: BrandRow[], q: string): string[] {
  const trimmed = q.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const scored: Array<{ handle: string; score: number }> = [];
  for (const b of rows) {
    if (!b.handle) continue;
    const score = brandMatchScore(b, trimmed);
    if (score > 0) scored.push({ handle: b.handle, score });
  }
  scored.sort((a, b) => b.score - a.score || a.handle.localeCompare(b.handle));

  const out: string[] = [];
  const seen = new Set<string>();
  for (const { handle } of scored) {
    if (seen.has(handle)) continue;
    seen.add(handle);
    out.push(handle);
  }
  return out;
}

interface MedusaProductResponse {
  id: string;
  handle?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  brand?: { id?: string; handle?: string; name?: string };
  thumbnail?: string;
  images?: Array<{ url?: string }>;
  variants?: Array<{
    id?: string;
    title?: string;
    manage_inventory?: boolean;
    inventory_quantity?: number | null;
    calculated_price?: {
      calculated_amount?: number;
      calculated_amount_with_tax?: number;
      is_calculated_price_tax_inclusive?: boolean;
    };
    options?: Array<{ id?: string; value?: string; option?: { title?: string } }>;
  }>;
  categories?: Array<{ id?: string; handle?: string; name?: string }>;
}

async function mapMedusaToProduct(p: MedusaProductResponse): Promise<Product> {
  const img = p.images?.[0]?.url ?? p.thumbnail ?? "";
  const firstVariant = p.variants?.[0];
  const priceObj = firstVariant?.calculated_price;
  const amount = priceObj?.calculated_amount_with_tax ?? priceObj?.calculated_amount;
  const priceDkk = amount != null ? Math.round(amount) : 0;

  const rawVariant = firstVariant?.title ?? "";
  const isDefaultVariant = !rawVariant || /^default(\s+variant)?$/i.test(rawVariant.trim());
  const variantTitle = isDefaultVariant ? undefined : rawVariant;

  let brandName = p.brand?.name ?? (p.metadata?.brand as string) ?? "";
  let brandHandle: string | undefined = p.brand?.handle;
  if (p.brand?.id) {
    const lookup = await getBrandLookup();
    const info = lookup.get(p.brand.id);
    if (info) {
      if (!brandName) brandName = info.name;
      if (!brandHandle) brandHandle = info.handle;
    }
  }
  const subtitle = p.subtitle || (p.metadata?.subtitle as string) || (p.metadata?.benefit as string) || "";

  const rating = p.metadata?.rating;
  const reviewCount = p.metadata?.reviewCount;
  const stock = getVariantStockInfo(
    firstVariant?.manage_inventory,
    firstVariant?.inventory_quantity
  );
  return {
    id: p.handle ?? p.id,
    name: p.title ?? p.handle ?? p.id,
    brand: brandName,
    brandHandle: brandHandle || undefined,
    benefit: subtitle,
    price: priceDkk,
    image: img,
    variant: variantTitle,
    variantId: stock.inStock ? firstVariant?.id : undefined,
    inStock: stock.inStock,
    lowStock: stock.isLowStock,
    stockCount: stock.availableQuantity,
    subtitle: subtitle || undefined,
    ...(typeof rating === "number" && { rating }),
    ...(typeof reviewCount === "number" && { reviewCount }),
  };
}

export interface ProductsResult {
  products: Product[];
  count: number;
  /**
   * When set, the Medusa Store API call failed (non-OK status or network).
   * Distinguishes “API error” from a real empty catalog. Not cached.
   */
  fetchError?: { status: number; path: string; message?: string };
}

/**
 * Fetch products by category_id from Medusa.
 * Falls back to mock data when Medusa returns empty or errors.
 */
export async function fetchProductsByCategory(
  categoryId: string,
  _sort?: string
): Promise<ProductsResult> {
  const key = `medusa:products:${categoryId}:${_sort ?? "default"}`;
  const cached = getCached<ProductsResult>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      category_id: categoryId,
      limit: "50",
      fields:
        "id,handle,title,subtitle,metadata,thumbnail,*images.url,*variants.title,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,*brand.*",
    });
    await appendPricingParams(params);
    if (_sort === "price-asc") params.set("order", "variants.calculated_price:asc");
    else if (_sort === "price-desc") params.set("order", "variants.calculated_price:desc");
    else if (_sort === "newest") params.set("order", "created_at:desc");
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], count: 0 };
    const json = (await res.json()) as { products?: MedusaProductResponse[]; count?: number };
    const list = json.products ?? [];
    const products = await Promise.all(list.map(mapMedusaToProduct));
    const result = { products, count: json.count ?? products.length };
    setCache(key, result);
    return result;
  } catch {
    return { products: [], count: 0 };
  }
}

/**
 * Fetch a single product by handle from Medusa Store API.
 * Returns null if not found.
 */
export async function fetchProductByHandle(handle: string): Promise<MedusaProductResponse | null> {
  const key = `medusa:product:${handle}`;
  const cached = readCache<MedusaProductResponse | null>(key);
  if (cached.hit) return cached.value;

  try {
    const params = new URLSearchParams({
      handle,
      limit: "1",
      fields:
        "id,handle,title,subtitle,metadata,thumbnail,*images.url,*variants.id,*variants.title,*variants.calculated_price,*variants.options,+variants.inventory_quantity,+variants.manage_inventory,*brand.id,*brand.handle,*brand.name,*categories.id,*categories.handle,*categories.name",
    });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { products?: MedusaProductResponse[] };
    const product = json.products?.[0] ?? null;
    setCache(key, product);
    return product;
  } catch {
    return null;
  }
}

/**
 * Fetch products by handles from Medusa (for homepage featured sections).
 * Returns products in the order of handles; skips missing.
 */
export async function fetchProductsByHandles(handles: string[]): Promise<Product[]> {
  if (handles.length === 0) return [];
  const uniq = [...new Set(handles)];
  const results = await Promise.all(uniq.map((h) => fetchProductByHandle(h)));
  const valid = results.filter((p): p is MedusaProductResponse => p !== null);
  return Promise.all(valid.map(mapMedusaToProduct));
}

function logBrandProductsFetchFailure(
  pathForLog: string,
  status: number,
  detail?: string
): void {
  const msg = `[medusa-products] Brand PLP: GET ${pathForLog} failed${status ? ` (${status})` : ""}${detail ? `: ${detail}` : ""}`;
  console.error(msg);
}

/**
 * Fetch products by brand handle from Medusa.
 */
export async function fetchProductsByBrand(
  brandHandle: string,
  _sort?: string
): Promise<ProductsResult> {
  const key = `medusa:products:brand:${brandHandle}:${_sort ?? "default"}`;
  const cached = getCached<ProductsResult>(key);
  if (cached !== null) return cached;

  const url = new URL(`${MEDUSA_URL}/products/by-brand/${encodeURIComponent(brandHandle)}`);
  const regionId = await getRegionId();
  if (regionId) {
    url.searchParams.set("region_id", regionId);
    url.searchParams.set("country_code", "dk");
  }
  if (_sort === "price-asc") url.searchParams.set("order", "variants.calculated_price:asc");
  else if (_sort === "price-desc") url.searchParams.set("order", "variants.calculated_price:desc");
  else if (_sort === "newest") url.searchParams.set("order", "created_at:desc");

  const pathForLog = `${url.pathname}${url.search}`;
  const errorResult = (status: number, message?: string): ProductsResult => ({
    products: [],
    count: 0,
    fetchError: { status, path: pathForLog, message },
  });

  try {
    const res = await fetch(String(url), {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      const bodySnippet = (await res.text()).slice(0, 240).replace(/\s+/g, " ").trim();
      logBrandProductsFetchFailure(pathForLog, res.status, bodySnippet || res.statusText);
      return errorResult(res.status, res.statusText || bodySnippet);
    }
    const json = (await res.json()) as { products?: MedusaProductResponse[]; count?: number };
    const list = json.products ?? [];
    const products = await Promise.all(list.map(mapMedusaToProduct));
    const result: ProductsResult = { products, count: json.count ?? products.length };
    setCache(key, result);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logBrandProductsFetchFailure(pathForLog, 0, message);
    return errorResult(0, message);
  }
}

const PRODUCT_FIELDS =
  "id,handle,title,subtitle,metadata,thumbnail,*images.url,*variants.title,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,*brand.*";

/**
 * Fetch related products from the same category, excluding the current product.
 * Returns up to `limit` products (default 6). Empty if no category or no results.
 */
export async function fetchRelatedProducts(
  categoryId: string,
  excludeHandle: string,
  limit = 6
): Promise<ProductsResult> {
  const key = `medusa:related:${categoryId}:${excludeHandle}:${limit}`;
  const cached = getCached<ProductsResult>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      category_id: categoryId,
      limit: String(Math.min(limit + 5, 50)),
      fields: PRODUCT_FIELDS,
    });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], count: 0 };
    const json = (await res.json()) as { products?: MedusaProductResponse[]; count?: number };
    const list = json.products ?? [];
    const filtered = list
      .filter((p) => (p.handle ?? "") !== excludeHandle)
      .slice(0, limit);
    const products = await Promise.all(filtered.map(mapMedusaToProduct));
    const result = { products, count: products.length };
    setCache(key, result);
    return result;
  } catch {
    return { products: [], count: 0 };
  }
}

/**
 * Fetch random/other products from the catalog, excluding the current product.
 * Uses list products with offset/limit; for true randomness we request a page and take up to `limit`.
 */
export async function fetchRandomProducts(
  excludeHandle: string,
  limit = 6
): Promise<ProductsResult> {
  const key = `medusa:random:${excludeHandle}:${limit}`;
  const cached = getCached<ProductsResult>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      limit: String(Math.min(limit + 10, 50)),
      offset: "0",
      fields: PRODUCT_FIELDS,
    });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], count: 0 };
    const json = (await res.json()) as { products?: MedusaProductResponse[]; count?: number };
    const list = json.products ?? [];
    const filtered = list
      .filter((p) => (p.handle ?? "") !== excludeHandle)
      .slice(0, limit);
    const products = await Promise.all(filtered.map(mapMedusaToProduct));
    const result = { products, count: products.length };
    setCache(key, result);
    return result;
  } catch {
    return { products: [], count: 0 };
  }
}

/**
 * Fetch "products bought together" from Medusa plugin @rsc-labs/medusa-products-bought-together-v2.
 * Returns empty array if plugin is not installed or returns no data.
 */
export async function fetchProductsBoughtTogether(
  productId: string,
  limit = 6
): Promise<Product[]> {
  const key = `medusa:bought-together:${productId}:${limit}`;
  const cached = getCached<Product[]>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({ limit: String(limit), fields: PRODUCT_FIELDS });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products-bought-together/${productId}?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { products?: MedusaProductResponse[] };
    const list = json.products ?? [];
    const products = await Promise.all(list.slice(0, limit).map(mapMedusaToProduct));
    setCache(key, products);
    return products;
  } catch {
    return [];
  }
}

/**
 * Search products by query string (Medusa Store API `q`) plus products linked to brands
 * whose name/handle matches the query (Medusa `q` does not search brand relation).
 */
export async function fetchProductsByQuery(
  q: string,
  limit = 12
): Promise<Product[]> {
  const trimmed = (q ?? "").trim();
  if (!trimmed) return [];

  const key = `medusa:search:${trimmed}:${limit}`;
  const cached = getCached<Product[]>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      q: trimmed,
      limit: String(limit),
      fields: PRODUCT_FIELDS,
    });
    await appendPricingParams(params);
    const res = await fetch(`${MEDUSA_URL}/products?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 30 },
    });
    let primary: Product[] = [];
    if (res.ok) {
      const json = (await res.json()) as { products?: MedusaProductResponse[] };
      const list = json.products ?? [];
      primary = await Promise.all(list.map(mapMedusaToProduct));
    }

    const merged: Product[] = [...primary];
    const seen = new Set(merged.map((p) => p.id));

    if (merged.length < limit) {
      const rows = await getBrandRows();
      const handles = brandHandlesMatchingSearchQuery(rows, trimmed).slice(0, 8);
      for (const h of handles) {
        if (merged.length >= limit) break;
        const { products: fromBrand } = await fetchProductsByBrand(h);
        for (const p of fromBrand) {
          if (merged.length >= limit) break;
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
      }
    }

    setCache(key, merged);
    return merged;
  } catch {
    return [];
  }
}

/**
 * Get recommended products for PDP: Bought Together (if plugin) → same category → random. No Payload.
 */
export async function fetchRecommendedProducts(
  excludeHandle: string,
  categoryId: string | undefined,
  limit = 6,
  medusaProductId?: string
): Promise<Product[]> {
  if (medusaProductId) {
    const boughtTogether = await fetchProductsBoughtTogether(medusaProductId, limit);
    if (boughtTogether.length > 0) return boughtTogether;
  }
  if (categoryId) {
    const byCategory = await fetchRelatedProducts(categoryId, excludeHandle, limit);
    if (byCategory.products.length > 0) return byCategory.products;
  }
  const random = await fetchRandomProducts(excludeHandle, limit);
  return random.products;
}
