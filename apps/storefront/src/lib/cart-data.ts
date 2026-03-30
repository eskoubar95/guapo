/**
 * Store cart shape for client components and hooks (aligned with Medusa + `lib/cart`).
 * Kept separate from `cart.ts` (server actions) to avoid client/server boundary issues.
 */
export interface StoreCartItem {
  id?: string;
  variant_id?: string;
  thumbnail?: string;
  product_title?: string;
  title?: string;
  variant_title?: string;
  product_id?: string;
  variant?: {
    id?: string;
    product?: { thumbnail?: string; title?: string };
    title?: string;
    manage_inventory?: boolean;
    inventory_quantity?: number | null;
  };
  unit_price?: number;
  quantity?: number;
  subtotal?: number;
  total?: number;
  original_total?: number;
  discount_total?: number;
  tax_total?: number;
  is_tax_inclusive?: boolean;
  adjustments?: Array<{ id?: string; code?: string; amount?: number }>;
  metadata?: Record<string, unknown>;
}

export interface StoreCart {
  id?: string;
  items?: StoreCartItem[];
  subtotal?: number;
  item_subtotal?: number;
  item_tax_total?: number;
  original_item_total?: number;
  original_item_subtotal?: number;
  item_total?: number;
  shipping_subtotal?: number;
  shipping_tax_total?: number;
  tax_total?: number;
  discount_total?: number;
  discount_tax_total?: number;
  original_total?: number;
  shipping_total?: number;
  total?: number;
  completed_at?: string | null;
  region?: { currency_code?: string };
  shipping_methods?: Array<{ id?: string; amount?: number; name?: string }>;
}
