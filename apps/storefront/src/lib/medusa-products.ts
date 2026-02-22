/**
 * Medusa Store API — products for storefront.
 * Fetches from NEXT_PUBLIC_MEDUSA_BACKEND_URL/store/products.
 */

import type { Product } from "@/components/ProductCard";

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

interface MedusaProductResponse {
  id: string;
  handle?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  brand?: { id?: string; handle?: string; name?: string };
  thumbnail?: string;
  images?: Array<{ url?: string }>;
  variants?: Array<{
    id?: string;
    title?: string;
    calculated_price?: { calculated_amount?: number };
  }>;
  categories?: Array<{ id?: string; handle?: string; name?: string }>;
}

function mapMedusaToProduct(p: MedusaProductResponse): Product {
  const img = p.images?.[0]?.url ?? p.thumbnail ?? "";
  const priceObj = p.variants?.[0]?.calculated_price;
  const amount = priceObj?.calculated_amount;
  const priceDkk = amount != null ? Math.round(amount) : 0;

  const rating = p.metadata?.rating;
  const reviewCount = p.metadata?.reviewCount;
  return {
    id: p.handle ?? p.id,
    name: p.title ?? p.handle ?? p.id,
    brand: (p.brand?.name ?? (p.metadata?.brand as string)) ?? "",
    benefit: (p.metadata?.benefit as string) ?? "",
    price: priceDkk,
    image: img,
    ...(typeof rating === "number" && { rating }),
    ...(typeof reviewCount === "number" && { reviewCount }),
  };
}

export interface ProductsResult {
  products: Product[];
  count: number;
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
      fields: "id,handle,title,metadata,thumbnail,*images.url,*variants.calculated_price,*brand.*",
    });
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
    const products = list.map(mapMedusaToProduct);
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
  const cached = getCached<MedusaProductResponse | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      handle,
      limit: "1",
      fields:
        "id,handle,title,metadata,thumbnail,*images.url,*variants.id,*variants.title,*variants.calculated_price,*variants.options,*brand.id,*brand.handle,*brand.name,*categories.id,*categories.handle,*categories.name",
    });
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
 * Fetch products by brand handle from Medusa.
 */
export async function fetchProductsByBrand(
  brandHandle: string,
  _sort?: string
): Promise<ProductsResult> {
  const key = `medusa:products:brand:${brandHandle}:${_sort ?? "default"}`;
  const cached = getCached<ProductsResult>(key);
  if (cached !== null) return cached;

  try {
    const url = new URL(`${MEDUSA_URL}/products/by-brand/${encodeURIComponent(brandHandle)}`);
    if (_sort === "price-asc") url.searchParams.set("order", "variants.calculated_price:asc");
    else if (_sort === "price-desc") url.searchParams.set("order", "variants.calculated_price:desc");
    else if (_sort === "newest") url.searchParams.set("order", "created_at:desc");
    const res = await fetch(String(url), {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], count: 0 };
    const json = (await res.json()) as { products?: MedusaProductResponse[]; count?: number };
    const list = json.products ?? [];
    const products = list.map(mapMedusaToProduct);
    const result = { products, count: json.count ?? products.length };
    setCache(key, result);
    return result;
  } catch {
    return { products: [], count: 0 };
  }
}

const PRODUCT_FIELDS =
  "id,handle,title,metadata,thumbnail,*images.url,*variants.calculated_price,*brand.*";

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
    const products = filtered.map(mapMedusaToProduct);
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
    const products = filtered.map(mapMedusaToProduct);
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
    const res = await fetch(`${MEDUSA_URL}/products-bought-together/${productId}?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { products?: MedusaProductResponse[] };
    const list = json.products ?? [];
    const products = list.slice(0, limit).map(mapMedusaToProduct);
    setCache(key, products);
    return products;
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
