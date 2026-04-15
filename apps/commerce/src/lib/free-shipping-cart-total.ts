/**
 * Cart total for free-shipping threshold — items after discounts, inkl. moms (DKK).
 * All Medusa amounts in this project are in DKK (major units).
 *
 * Prefers computed `item_total` when available (Store API / Query responses).
 * Falls back to manual calculation from raw item fields (module.retrieveCart responses
 * where computed totals are absent).
 */

export type CartLineLike = {
  unit_price?: unknown;
  quantity?: unknown;
  is_tax_inclusive?: boolean | null;
  adjustments?: Array<{ amount?: unknown }> | null;
};

export type CartLike = {
  items?: CartLineLike[] | null;
  item_total?: unknown;
  original_item_total?: unknown;
  discount_total?: unknown;
};

function toMajor(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value !== null && "numeric" in value) {
    const n = (value as { numeric?: unknown }).numeric;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Items incl. VAT minus discounts (DKK). */
export function computeCartTotalForFreeShippingThreshold(cart: CartLike): number {
  const itemTotal = toMajor(cart.item_total);
  if (itemTotal != null) return Math.max(0, itemTotal);

  const originalItemTotal = toMajor(cart.original_item_total);
  if (originalItemTotal != null) {
    const discount = toMajor(cart.discount_total) ?? 0;
    return Math.max(0, originalItemTotal - discount);
  }

  const items = cart.items ?? [];
  let total = 0;
  for (const item of items) {
    const lineExVat = (toMajor(item.unit_price) ?? 0) * (toMajor(item.quantity) ?? 1);
    const lineInclVat = item.is_tax_inclusive ? lineExVat : lineExVat * 1.25;
    const adjExVat = (item.adjustments ?? []).reduce(
      (s, a) => s + (toMajor(a.amount) ?? 0),
      0
    );
    total += lineInclVat - adjExVat * 1.25;
  }
  return Math.max(0, total);
}
