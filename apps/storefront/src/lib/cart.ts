"use server";

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

async function getRegionId(): Promise<string | null> {
  const res = await fetch(`${MEDUSA_URL}/store/regions?currency_code=dkk`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const regions = data.regions ?? data;
  return Array.isArray(regions) ? regions[0]?.id : regions?.id;
}

export async function getCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cart_id")?.value ?? null;
}

async function setCartId(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set("cart_id", cartId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Clear the cart cookie (call after order completion so next visit gets a fresh cart) */
/** Medusa store cart shape (minimal for page usage) */
export interface StoreCart {
  id?: string;
  items?: unknown[];
  subtotal?: number;
  shipping_total?: number;
  total?: number;
  completed_at?: string | null;
}

export async function clearCartId() {
  const cookieStore = await cookies();
  cookieStore.delete("cart_id");
}

export async function getOrCreateCart(): Promise<string> {
  const existing = await getCartId();
  if (existing) {
    const check = await fetch(`${MEDUSA_URL}/store/carts/${existing}`, {
      headers: headers(),
    });
    if (check.ok) {
      const data = await check.json().catch(() => ({}));
      const cart = (data as { cart?: { completed_at?: string | null } }).cart;
      if (cart?.completed_at) {
        await clearCartId();
      } else {
        return existing;
      }
    }
  }

  const regionId = await getRegionId();
  if (!regionId) throw new Error("No Denmark region found");

  const res = await fetch(`${MEDUSA_URL}/store/carts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ region_id: regionId }),
  });
  if (!res.ok) throw new Error("Failed to create cart");

  const { cart } = await res.json();
  await setCartId(cart.id);
  return cart.id;
}

export async function addToCart(variantId: string, quantity: number = 1) {
  const cartId = await getOrCreateCart();

  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Failed to add item to cart");
  }
  return (data as { cart: unknown }).cart;
}

export async function updateLineItem(lineItemId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart");

  const res = await fetch(
    `${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ quantity }),
    }
  );
  if (!res.ok) throw new Error("Failed to update item");
  const { cart } = await res.json();
  return cart;
}

export async function removeLineItem(lineItemId: string) {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart");

  const res = await fetch(
    `${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
    { method: "DELETE", headers: headers() }
  );
  if (!res.ok) throw new Error("Failed to remove item");
  const { cart } = await res.json();
  return cart;
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
