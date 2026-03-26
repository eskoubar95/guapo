/**
 * Standalone fetch of Shipmondo products (GET /products) for sync script and Admin catalog.
 * Query shape aligned with Shipmondo API: receiver_country_code, sender_country_code, optional carrier_code.
 */
import { getBaseUrl } from "./lib/env";
import { normalizeProduct, rawShipmondoProductIsServicePoint } from "./lib/products";
import type { ShipmondoProduct } from "./types";

export type FetchShipmondoProductsOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
  /** Receiver / destination country (maps to `receiver_country_code`; also sets `country_code` for compatibility). */
  countryCode?: string;
  /** Sender country; defaults to same as countryCode when omitted (domestic corridor). */
  senderCountryCode?: string;
  /** Optional carrier filter (e.g. `gls`, `dao`, `pdk`). */
  carrierCode?: string;
  /** If true, only service-point products (legacy `service_point_product` or `service_point_required`). */
  servicePointOnly?: boolean;
};

/**
 * Build GET /products query string.
 * See Shipmondo API: receiver_country_code + sender_country_code (+ optional carrier_code).
 */
export function buildShipmondoProductsQueryString(opts: {
  countryCode: string;
  senderCountryCode?: string;
  carrierCode?: string;
}): string {
  const receiver = opts.countryCode.trim().toUpperCase() || "DK";
  const sender = opts.senderCountryCode?.trim().toUpperCase() || receiver;
  const params = new URLSearchParams({
    receiver_country_code: receiver,
    country_code: receiver,
    sender_country_code: sender,
  });
  if (opts.carrierCode?.trim()) {
    params.set("carrier_code", opts.carrierCode.trim().toLowerCase());
  }
  return params.toString();
}

/**
 * Fetch shipping products from Shipmondo API.
 */
export async function fetchShipmondoProducts(
  options: FetchShipmondoProductsOptions
): Promise<ShipmondoProduct[]> {
  const {
    apiUser,
    apiKey,
    sandbox = false,
    countryCode = "DK",
    senderCountryCode,
    carrierCode,
    servicePointOnly = true,
  } = options;
  if (!apiUser || !apiKey) return [];
  const baseUrl = getBaseUrl(sandbox);
  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    const q = buildShipmondoProductsQueryString({
      countryCode,
      senderCountryCode,
      carrierCode,
    });
    res = await fetch(`${baseUrl}/products?${q}`, {
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
  const filtered = list.filter((p): p is Record<string, unknown> & { code: string } => typeof p?.code === "string");
  const normalized = filtered
    .filter((p) => (servicePointOnly ? rawShipmondoProductIsServicePoint(p) : true))
    .map((p) =>
      normalizeProduct({
        ...p,
        code: p.code as string,
      })
    );
  return normalized;
}
