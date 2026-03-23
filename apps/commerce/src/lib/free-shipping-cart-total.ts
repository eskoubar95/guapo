/**
 * Cart total for free-shipping threshold — items after discounts, inkl. moms (DKK).
 * All Medusa amounts in this project are in DKK (major units).
 *
 * Prefers computed `item_total` when available (Store API / Query responses).
 * Falls back to manual calculation from raw item fields (module.retrieveCart responses
 * where computed totals are absent).
 */

export type CartLineLike = {
  unit_price?: number | null;
  quantity?: number | null;
  is_tax_inclusive?: boolean | null;
  adjustments?: Array<{ amount?: number | null }> | null;
};

export type CartLike = {
  items?: CartLineLike[] | null;
  item_total?: number | null;
  original_item_total?: number | null;
  discount_total?: number | null;
};

/** Items incl. VAT minus discounts (DKK). */
export function computeCartTotalForFreeShippingThreshold(cart: CartLike): number {
  if (cart.item_total != null) return cart.item_total;
  if (cart.original_item_total != null) {
    const discount = cart.discount_total ?? 0;
    return Math.max(0, cart.original_item_total - discount);
  }

  const items = cart.items ?? [];
  let total = 0;
  for (const item of items) {
    const lineExVat = (item.unit_price ?? 0) * (item.quantity ?? 1);
    const lineInclVat = item.is_tax_inclusive ? lineExVat : lineExVat * 1.25;
    const adjExVat = (item.adjustments ?? []).reduce(
      (s, a) => s + (a.amount ?? 0),
      0
    );
    total += lineInclVat - adjExVat * 1.25;
  }
  return Math.max(0, total);
}
