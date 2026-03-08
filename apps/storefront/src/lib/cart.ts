"use server";

import { cookies } from "next/headers";
import { getCart } from "@/lib/cart-data";

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
export async function clearCartId() {
  const cookieStore = await cookies();
  cookieStore.delete("cart_id");
}

/** Re-export for consumers that still import from cart (e.g. cart-utils) */
export type { StoreCart } from "@/lib/cart-data";

/** Remove all line items from the current cart (empties the cart). */
export async function clearCart(): Promise<void> {
  const cart = await getCart();
  const ids = (cart?.items ?? []).map((item) => item.id).filter((id): id is string => Boolean(id));
  for (const lineItemId of ids) {
    await removeLineItem(lineItemId);
  }
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

export interface AddToCartOptions {
  /** Subscription cycle in weeks (4, 8, or 12). When set, item is a subscription. */
  subscription_cycle?: number;
}

export async function addToCart(
  variantId: string,
  quantity: number = 1,
  options?: AddToCartOptions
) {
  const cartId = await getOrCreateCart();

  const body: Record<string, unknown> = {
    variant_id: variantId,
    quantity,
  };
  if (options?.subscription_cycle) {
    body.metadata = { subscription_cycle: options.subscription_cycle };
  }

  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Failed to add item to cart");
  }
  return (data as { cart: unknown }).cart;
}

export async function updateLineItem(
  lineItemId: string,
  quantity: number,
  metadata?: Record<string, unknown>
) {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart");

  const quantityInt = Math.max(1, Math.floor(Number(quantity)));
  const body: { quantity: number; metadata?: Record<string, unknown> } = {
    quantity: quantityInt,
  };
  if (metadata != null && typeof metadata === "object") {
    body.metadata = metadata;
  }

  const res = await fetch(
    `${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message;
    throw new Error(msg && typeof msg === "string" ? msg : "Failed to update item");
  }
  const { cart } = data as { cart?: unknown };
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

/** Set subscription on a line item: removes it and re-adds with or without subscription_cycle metadata. */
export async function setLineItemSubscription(
  lineItemId: string,
  variantId: string,
  quantity: number,
  subscriptionCycleWeeks: number | null
) {
  await removeLineItem(lineItemId);
  try {
    await addToCart(variantId, quantity, subscriptionCycleWeeks ? { subscription_cycle: subscriptionCycleWeeks } : undefined);
  } catch (error) {
    try {
      await addToCart(variantId, quantity);
    } catch {
      // Rollback failed; original error is rethrown
    }
    throw error;
  }
}

