/**
 * Cart price display helpers.
 *
 * All Medusa cart amounts in this project are in DKK (major units).
 * Item-level computed totals (original_total, total, discount_total, tax_total)
 * require `?fields=+items.*` on the Store API call — see cart-data.ts getCart().
 *
 * The only exception is shipping from the fulfillment module, which may arrive
 * in øre (minor units). Use normalizeShippingForDisplay() for shipping only.
 */

import type { StoreCart, StoreCartItem } from "@/lib/cart-data";

// ---------------------------------------------------------------------------
// Shipping normalization (fulfillment amounts can be øre)
// ---------------------------------------------------------------------------

const SHIPPING_MINOR_UNIT_THRESHOLD = 1000;

export function normalizeShippingForDisplay(amount: number): number {
  if (amount >= SHIPPING_MINOR_UNIT_THRESHOLD) return amount / 100;
  return amount;
}

// ---------------------------------------------------------------------------
// Line item display helpers
// ---------------------------------------------------------------------------

/**
 * Line's original total inkl. moms, before any discounts.
 * Medusa: `original_total = subtotal_before_discount + original_tax_total`.
 */
export function getLineOriginalTotal(item: StoreCartItem): number {
  if (item.original_total != null) return item.original_total;
  if (item.subtotal != null && item.tax_total != null) {
    return item.subtotal + item.tax_total;
  }
  return (item.unit_price ?? 0) * (item.quantity ?? 1);
}

/**
 * Line's final total inkl. moms, after discounts.
 * Medusa: `total = original_total − discount_total`.
 */
export function getLineTotal(item: StoreCartItem): number {
  if (item.total != null) return item.total;
  return getLineOriginalTotal(item);
}

/**
 * Customer-facing discount inkl. moms for a single line.
 */
export function getLineDiscount(item: StoreCartItem): number {
  if (item.discount_total != null && item.discount_total > 0) {
    return item.discount_total;
  }
  return Math.max(0, getLineOriginalTotal(item) - getLineTotal(item));
}

/**
 * Whether the line has a meaningful discount (avoids floating-point noise).
 */
export function isLineDiscounted(item: StoreCartItem): boolean {
  return getLineDiscount(item) > 0.005;
}

/**
 * Per-unit "list price" inkl. moms (before discount).
 */
export function getLineUnitPrice(item: StoreCartItem): number {
  const qty = item.quantity ?? 1;
  return qty > 0 ? getLineOriginalTotal(item) / qty : 0;
}

// ---------------------------------------------------------------------------
// Cart-level summary helpers
// ---------------------------------------------------------------------------

/**
 * Sum of all line items' original totals inkl. moms (before discounts).
 * Use for the "Varer i alt" / subtotal row.
 */
export function getCartItemsOriginalTotal(cart: StoreCart | null | undefined): number {
  if (!cart) return 0;
  if (cart.original_item_total != null) return cart.original_item_total;
  return (cart.items ?? []).reduce((sum, item) => sum + getLineOriginalTotal(item), 0);
}

/**
 * Sum of all line items' totals inkl. moms (after discounts, no shipping).
 * Use for the bottom-line "Pris i alt" when no shipping is selected yet.
 */
export function getCartItemsTotal(cart: StoreCart | null | undefined): number {
  if (!cart) return 0;
  if (cart.item_total != null) return cart.item_total;
  return (cart.items ?? []).reduce((sum, item) => sum + getLineTotal(item), 0);
}

/**
 * Total item-level discount inkl. moms (excludes shipping discounts like FREESHIPPING).
 * Uses line-item totals instead of cart.discount_total which may include shipping adjustments.
 */
export function getCartDiscountTotal(cart: StoreCart | null | undefined): number {
  if (!cart) return 0;
  return Math.max(0, getCartItemsOriginalTotal(cart) - getCartItemsTotal(cart));
}
