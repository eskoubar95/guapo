/**
 * Standalone fetch of Shipmondo products (GET /products) for sync script.
 * Uses same types and parsing as the fulfillment provider.
 */
import type { ShipmondoProduct, ShipmondoWeightInterval } from "./service";

function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

function parseWeightIntervals(raw: unknown): ShipmondoWeightInterval[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ShipmondoWeightInterval[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const from = Number(o.from_weight);
    const to = Number(o.to_weight);
    if (!Number.isNaN(from) && !Number.isNaN(to) && from >= 0 && to >= 0) {
      out.push({
        from_weight: Math.round(from),
        to_weight: Math.round(to),
        description: typeof o.description === "string" ? o.description : undefined,
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

function normalizeProduct(
  p: Record<string, unknown> & { code: string; service_point_product: boolean }
): ShipmondoProduct {
  const product: ShipmondoProduct = {
    code: p.code,
    service_point_product: p.service_point_product,
    name: typeof p.name === "string" ? p.name : undefined,
    carrier_code: typeof p.carrier_code === "string" ? p.carrier_code : undefined,
  };
  const intervals = parseWeightIntervals(p.weight_intervals);
  if (intervals?.length) product.weight_intervals = intervals;
  return product;
}

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
