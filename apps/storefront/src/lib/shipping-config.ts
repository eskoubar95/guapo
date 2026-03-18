/**
 * Free shipping threshold — configurable per environment.
 * Set NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_DKK in .env.local (e.g. 499).
 * Later this can be wired to Medusa region/shipping options or CMS.
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
