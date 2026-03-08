/**
 * Server-only cart read helpers (no "use server").
 * Use this from server components and route handlers to avoid Turbopack "Panic in async function"
 * when importing from the server-actions cart module.
 */
import { cookies } from "next/headers";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
  };
}

export interface StoreCartItem {
  id?: string;
  variant_id?: string;
  thumbnail?: string;
  product_title?: string;
  title?: string;
  variant_title?: string;
  variant?: {
    id?: string;
    product?: { thumbnail?: string; title?: string };
    title?: string;
  };
  unit_price?: number;
  quantity?: number;
  total?: number;
  metadata?: Record<string, unknown>;
}

export interface StoreCart {
  id?: string;
  items?: StoreCartItem[];
  subtotal?: number;
  shipping_total?: number;
  total?: number;
  completed_at?: string | null;
}

export async function getCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cart_id")?.value ?? null;
}

export async function clearCartId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("cart_id");
}

export async function getCart(): Promise<StoreCart | null> {
  try {
    const cartId = await getCartId();
    if (!cartId) return null;

    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const cart = (data as { cart?: StoreCart & { completed_at?: string | null } }).cart;
    if (cart?.completed_at) {
      await clearCartId();
      return null;
    }
    return cart ?? null;
  } catch {
    return null;
  }
}
