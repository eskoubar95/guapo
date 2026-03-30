/**
 * Medusa variant stock: Store API exposes `manage_inventory` and `inventory_quantity`
 * when requested via fields (+variants.inventory_quantity).
 * @see https://docs.medusajs.com/resources/storefront-development/products/inventory
 */

/** Show "few left" when tracked quantity is in [1, threshold) */
export const LOW_STOCK_THRESHOLD = 5;

export interface VariantStockInfo {
  inStock: boolean;
  isLowStock: boolean;
  /** Cap for quantity stepper; null = no cap (up to 99) */
  maxQuantity: number | null;
  availableQuantity: number | null;
}

export function getVariantStockInfo(
  manageInventory: boolean | null | undefined,
  inventoryQuantity: number | null | undefined
): VariantStockInfo {
  const managed = manageInventory === true;
  if (!managed) {
    return {
      inStock: true,
      isLowStock: false,
      maxQuantity: null,
      availableQuantity: null,
    };
  }
  const qty = inventoryQuantity ?? 0;
  const inStock = qty > 0;
  return {
    inStock,
    isLowStock: inStock && qty > 0 && qty < LOW_STOCK_THRESHOLD,
    maxQuantity: inStock ? qty : 0,
    availableQuantity: inventoryQuantity ?? null,
  };
}

export function formatLowStockLabel(template: string, count: number): string {
  return template.replace(/\{\{\s*count\s*\}\}/g, String(count));
}

/** Narrow variant shape on cart line items (Medusa Store API when expanded). */
export type CartLineVariantStock = {
  id?: string;
  manage_inventory?: boolean;
  inventory_quantity?: number | null;
};

/**
 * Max quantity the customer can set for this cart line (1–99).
 * Uses expanded `item.variant` from cart when available.
 *
 * Important: cart line `variant` often omits `inventory_quantity` even when
 * `manage_inventory` is true. Treating missing/null as 0 would cap at the
 * current line quantity and disable + everywhere — so we only cap when we
 * have an actual number; otherwise allow up to 99 and let Medusa validate.
 */
export function getCartLineQuantityCap(item: {
  quantity?: number;
  variant?: CartLineVariantStock | null;
}): number {
  const current = Math.max(1, item.quantity ?? 1);
  const v = item.variant ?? undefined;
  if (v?.manage_inventory !== true) {
    return 99;
  }
  const inv = v.inventory_quantity;
  if (typeof inv !== "number") {
    return 99;
  }
  if (inv <= 0) {
    return current;
  }
  return Math.min(99, inv);
}
