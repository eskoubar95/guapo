export const DEFAULT_LABEL_FORMAT = "10x19_pdf";

/** GET/DELETE and other API calls — keep responsive for checkout option loading. */
export const DEFAULT_SHIPMONDO_REQUEST_TIMEOUT_MS = 10_000;
/**
 * POST /shipments can exceed 10s when Shipmondo talks to carriers (GLS etc.).
 * Aborting early surfaces as "This operation was aborted" while the shipment may already exist server-side.
 */
export const DEFAULT_SHIPMONDO_SHIPMENT_POST_TIMEOUT_MS = 60_000;

export const DEFAULT_FLAT_RATE_MINOR = 3900; // 39 DKK in minor units
export const PRODUCTS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const ENABLED_PRODUCTS_CACHE_TTL_MS = 60 * 1000; // 1 minute
export const CART_WEIGHT_CACHE_TTL_MS = 4000;
export const DEFAULT_WEIGHT_GRAMS_PER_ITEM = 500;
export const MIN_PARCEL_WEIGHT_GRAMS = 200;
export const MAX_PARCEL_WEIGHT_GRAMS = 30000;
export const DEFAULT_TOTAL_WEIGHT_GRAMS = 2000;
export const DEFAULT_SERVICE_CODES = "EMAIL_NT";

export function shipmondoLabelFormat(): string {
  return process.env.SHIPMONDO_LABEL_FORMAT?.trim() || DEFAULT_LABEL_FORMAT;
}

export function parsePositiveTimeoutMs(envName: string, fallback: number): number {
  const raw = process.env[envName]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1000 ? n : fallback;
}

export function parsePositiveIntCapped(name: string, fallback: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, n));
}

export function shipmondoLabelPollDelayMs(): number {
  const raw = process.env.SHIPMONDO_LABEL_GET_RETRY_MS?.trim();
  if (!raw) return 3000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 200 ? n : 3000;
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";
}

export function minorToMajor(amountMinor: number): number {
  return Math.round(amountMinor) / 100;
}
