import type { FulfillmentItemDTO } from "@medusajs/types";

import {
  DEFAULT_FLAT_RATE_MINOR,
  DEFAULT_TOTAL_WEIGHT_GRAMS,
  DEFAULT_WEIGHT_GRAMS_PER_ITEM,
  MAX_PARCEL_WEIGHT_GRAMS,
  MIN_PARCEL_WEIGHT_GRAMS,
} from "./env";
import type { ShipmondoPriceBand } from "../types";

/** Get flat rate in minor units from env or default. */
export function getFlatRateMinorFromEnv(): number {
  const env = process.env.SHIPMONDO_FLAT_RATE_MINOR;
  if (env != null && env !== "") {
    const n = Number(env);
    if (!Number.isNaN(n) && n >= 0) return Math.round(n);
  }
  return DEFAULT_FLAT_RATE_MINOR;
}

/** Parse weight-based price bands from SHIPMONDO_PRICE_BANDS (JSON array). Sorted by max_grams asc. */
export function getPriceBandsFromEnv(): ShipmondoPriceBand[] {
  const raw = process.env.SHIPMONDO_PRICE_BANDS;
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsePriceBandsArray(parsed).sort((a, b) => a.max_grams - b.max_grams);
  } catch {
    return [];
  }
}

/** Resolve price from bands array (sorted by max_grams). Returns amount_minor or null if no match. */
export function priceFromBands(weightGrams: number, bands: ShipmondoPriceBand[]): number | null {
  if (!Array.isArray(bands) || bands.length === 0) return null;
  for (const band of bands) {
    if (
      typeof band.max_grams === "number" &&
      typeof band.amount_minor === "number" &&
      weightGrams <= band.max_grams
    ) {
      return Math.max(0, Math.round(band.amount_minor));
    }
  }
  const last = bands[bands.length - 1];
  return typeof last?.amount_minor === "number" ? Math.max(0, Math.round(last.amount_minor)) : null;
}

export function parsePriceBandsArray(raw: unknown): ShipmondoPriceBand[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (b): b is { max_grams: number; amount_minor?: number; amount_major?: number } =>
        typeof b === "object" &&
        b != null &&
        typeof (b as { max_grams?: number }).max_grams === "number" &&
        (typeof (b as { amount_minor?: number }).amount_minor === "number" ||
          typeof (b as { amount_major?: number }).amount_major === "number")
    )
    .map((b) => ({
      max_grams: Math.max(0, b.max_grams),
      amount_minor:
        typeof b.amount_minor === "number" && !Number.isNaN(b.amount_minor)
          ? Math.max(0, Math.round(b.amount_minor))
          : Math.max(0, Math.round((b.amount_major ?? 0) * 100)),
    }));
}

/**
 * Price bands from shipping option JSON (Admin / seed / sync).
 * Supports: data.price_bands, top-level price_bands, stringified data JSON.
 */
export function getPriceBandsFromOptionData(optionData: Record<string, unknown> | undefined): ShipmondoPriceBand[] {
  if (!optionData || typeof optionData !== "object") return [];
  const chunks: ShipmondoPriceBand[] = [];
  const dataVal = optionData.data;
  if (dataVal && typeof dataVal === "object" && dataVal !== null) {
    chunks.push(...parsePriceBandsArray((dataVal as Record<string, unknown>).price_bands));
  }
  if (typeof dataVal === "string") {
    try {
      const parsed = JSON.parse(dataVal) as Record<string, unknown>;
      chunks.push(...parsePriceBandsArray(parsed.price_bands));
      const inner = parsed.data;
      if (inner && typeof inner === "object" && inner !== null) {
        chunks.push(...parsePriceBandsArray((inner as Record<string, unknown>).price_bands));
      }
    } catch {
      /* ignore */
    }
  }
  chunks.push(...parsePriceBandsArray(optionData.price_bands));
  if (chunks.length === 0) return [];
  const byMax = new Map<number, ShipmondoPriceBand>();
  for (const b of chunks) {
    byMax.set(b.max_grams, b);
  }
  return Array.from(byMax.values()).sort((a, b) => a.max_grams - b.max_grams);
}

/** Flat fallback from option JSON (root or nested data). */
export function getFlatAmountFromOption(optionData: Record<string, unknown> | undefined): number | null {
  if (!optionData) return null;
  const nested = optionData.data;
  if (nested && typeof nested === "object" && nested !== null) {
    const n = (nested as Record<string, unknown>).flat_amount_minor;
    if (typeof n === "number" && !Number.isNaN(n) && n >= 0) return Math.round(n);
    const m = (nested as Record<string, unknown>).flat_amount_major;
    if (typeof m === "number" && !Number.isNaN(m) && m >= 0) return Math.round(m * 100);
  }
  if (typeof optionData.flat_amount_minor === "number" && optionData.flat_amount_minor >= 0) {
    return Math.round(optionData.flat_amount_minor);
  }
  if (typeof optionData.flat_amount_major === "number" && optionData.flat_amount_major >= 0) {
    return Math.round(optionData.flat_amount_major * 100);
  }
  if (typeof optionData.amount_minor === "number" && optionData.amount_minor >= 0) {
    return Math.round(optionData.amount_minor);
  }
  if (typeof optionData.amount_major === "number" && optionData.amount_major >= 0) {
    return Math.round(optionData.amount_major * 100);
  }
  return null;
}

/** Resolve price in minor units: by weight bands if available, else flat rate. Env fallback only. */
export function getPriceForWeightGrams(weightGrams: number, bandsFromOption?: ShipmondoPriceBand[]): number {
  const bands = bandsFromOption?.length ? bandsFromOption : getPriceBandsFromEnv();
  const fromBands = priceFromBands(weightGrams, bands);
  if (fromBands !== null) return fromBands;
  return getFlatRateMinorFromEnv();
}

/** Total weight in grams from cart/context items (variant weight or default per item). */
export function getWeightFromContext(context: Record<string, unknown> | undefined): number {
  if (!context || typeof context !== "object") return 0;
  type ItemRow = { quantity?: number; variant?: { weight?: number }; weight?: number };
  let items = context.items as ItemRow[] | undefined;
  if (!Array.isArray(items) || items.length === 0) {
    const cart = context.cart as { items?: ItemRow[] } | undefined;
    if (Array.isArray(cart?.items) && cart.items.length > 0) items = cart.items;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const lineItems = context.line_items as ItemRow[] | undefined;
    if (Array.isArray(lineItems) && lineItems.length > 0) items = lineItems;
  }
  if (!Array.isArray(items) || items.length === 0) return 0;
  let total = 0;
  for (const i of items) {
    const qty = typeof i?.quantity === "number" && i.quantity > 0 ? i.quantity : 1;
    const w = i?.weight ?? i?.variant?.weight;
    const grams = typeof w === "number" && w >= 0 ? w : DEFAULT_WEIGHT_GRAMS_PER_ITEM;
    total += qty * grams;
  }
  return total;
}

/** Total weight in grams from fulfillment items (variant weight or default per item). */
export function getTotalWeightGramsForFulfillmentItems(
  items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[]
): number {
  let total = 0;
  for (const i of items) {
    const qty = (i as { quantity?: number }).quantity ?? 1;
    const itemWithVariant = i as { variant?: { weight?: number }; weight?: number };
    const weight =
      itemWithVariant.weight ??
      itemWithVariant.variant?.weight ??
      DEFAULT_WEIGHT_GRAMS_PER_ITEM;
    total += qty * (typeof weight === "number" && weight >= 0 ? weight : DEFAULT_WEIGHT_GRAMS_PER_ITEM);
  }
  if (total <= 0) return DEFAULT_TOTAL_WEIGHT_GRAMS;
  return Math.min(Math.max(total, MIN_PARCEL_WEIGHT_GRAMS), MAX_PARCEL_WEIGHT_GRAMS);
}
