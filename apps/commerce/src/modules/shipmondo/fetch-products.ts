/**
 * Standalone fetch of Shipmondo products (GET /products) for sync script.
 * Uses same types and parsing as the fulfillment provider.
 */
import { getBaseUrl } from "./lib/env";
import { normalizeProduct } from "./lib/products";
import type { ShipmondoProduct } from "./types";

export type FetchShipmondoProductsOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};

/**
 * Fetch shipping products from Shipmondo API (DK), filter service_point products.
 * Returns full product objects including weight_intervals. No cache.
 */
export async function fetchShipmondoProducts(
  options: FetchShipmondoProductsOptions
): Promise<ShipmondoProduct[]> {
  const { apiUser, apiKey, sandbox = false } = options;
  if (!apiUser || !apiKey) return [];
  const baseUrl = getBaseUrl(sandbox);
  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/products?country_code=DK`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shipmondo API error: ${res.status} ${text.slice(0, 300)}`);
  }
  const raw = (await res.json()) as ShipmondoProduct[] | { products?: ShipmondoProduct[] };
  const list = Array.isArray(raw) ? raw : raw?.products ?? [];
  return list
    .filter(
      (p): p is Record<string, unknown> & { code: string; service_point_product: boolean } =>
        typeof p?.code === "string" && p.service_point_product === true
    )
    .map(normalizeProduct);
}
