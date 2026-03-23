/**
 * Fallback threshold when Medusa `/store/free-shipping-config` is unavailable.
 * Primary source: Medusa `guapo_free_shipping_setting` + `useFreeShippingStatus`.
 * Set NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_DKK in .env.local (e.g. 499).
 */
const DEFAULT_THRESHOLD_DKK = 499;

export function getFreeShippingThresholdDkk(): number {
  if (typeof process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_DKK !== "string") {
    return DEFAULT_THRESHOLD_DKK;
  }
  const n = Number.parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_DKK, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_THRESHOLD_DKK;
}

/** Returns threshold in øre (minor units) – useful if an øre-based amount needs comparing. */
export function getFreeShippingThresholdOre(): number {
  return getFreeShippingThresholdDkk() * 100;
}
