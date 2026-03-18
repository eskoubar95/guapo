/**
 * Cart amount display normalization.
 * Medusa store cart can return some amounts in minor units (øre) and others in major (DKK).
 * Fulfillment/shipping often returns øre; item totals may be in DKK. We normalize for consistent display (always DKK).
 */

/** Threshold: amounts >= this are treated as minor units (øre) and converted to DKK by /100. */
const MINOR_UNIT_THRESHOLD = 1000;

/**
 * Normalize shipping amount for display. Shipping from fulfillment is often in øre (e.g. 3900 = 39 DKK).
 */
export function normalizeShippingForDisplay(amount: number): number {
  if (amount >= MINOR_UNIT_THRESHOLD) return amount / 100;
  return amount;
}

/**
 * Normalize tax amount for display when it might be in øre.
 */
export function normalizeTaxForDisplay(amount: number): number {
  if (amount >= MINOR_UNIT_THRESHOLD) return amount / 100;
  return amount;
}

/**
 * Detect mixed-unit total (e.g. item total in DKK + shipping in øre added as 375 + 3900 = 4275).
 * When true, we should compute total from normalized parts instead of using raw total.
 */
export function isLikelyMixedUnitTotal(
  rawTotal: number,
  itemTotalInclTax: number,
  shippingTotal: number
): boolean {
  const wrongSum = itemTotalInclTax + shippingTotal;
  return rawTotal > itemTotalInclTax + 500 && Math.abs(rawTotal - wrongSum) < 10;
}

/**
 * Total for display: use normalized parts when raw total is wrong due to mixed units.
 */
export function cartTotalForDisplay(
  rawTotal: number,
  itemTotalInclTax: number,
  shippingTotal: number,
  discountTotal: number
): number {
  if (isLikelyMixedUnitTotal(rawTotal, itemTotalInclTax, shippingTotal)) {
    return itemTotalInclTax - discountTotal + normalizeShippingForDisplay(shippingTotal);
  }
  return rawTotal;
}

/**
 * Line item amount for display. Medusa line item total/original_total can be in øre.
 * Returns amount in DKK for formatPrice().
 */
export function lineAmountForDisplay(amount: number | undefined): number {
  if (amount == null || !Number.isFinite(amount)) return 0;
  if (amount >= MINOR_UNIT_THRESHOLD) return amount / 100;
  return amount;
}
