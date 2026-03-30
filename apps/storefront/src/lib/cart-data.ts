/**
 * Store cart shape for client components and hooks (aligned with Medusa + `lib/cart`).
 * Kept separate from `cart.ts` (server actions) to avoid client/server boundary issues.
 */
export interface StoreCart {
  id?: string;
  items?: Array<{ id?: string; metadata?: Record<string, unknown> }>;
  subtotal?: number;
  shipping_total?: unknown;
  total?: number;
  tax_total?: number;
  completed_at?: string | null;
  shipping_methods?: unknown[];
}
