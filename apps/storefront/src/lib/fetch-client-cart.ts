import type { StoreCart, StoreCartItem } from "@/lib/cart-data";

/**
 * Same cart payload as header dropdown / cart page (`GET /api/cart`).
 * Use after `addToCart` so modal totals match Medusa’s fully hydrated cart (tax, discounts).
 */
export async function fetchClientStoreCart(): Promise<StoreCart | null> {
  try {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as StoreCart;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Prefer the line from `GET /api/cart` (hydrated), matched by id from the POST `addToCart` response.
 */
export function resolveAddedLineItem(
  hydratedCart: StoreCart | null | undefined,
  addResponseCart: StoreCart | null | undefined,
  fallbackVariantId?: string
): StoreCartItem | undefined {
  const items = hydratedCart?.items;
  if (!items?.length) return undefined;
  const addedId = addResponseCart?.items?.at(-1)?.id;
  if (addedId) {
    const byId = items.find((i) => i.id === addedId);
    if (byId) return byId;
  }
  if (fallbackVariantId) {
    const byVariant = [...items].reverse().find((i) => i.variant_id === fallbackVariantId);
    if (byVariant) return byVariant;
  }
  return items[items.length - 1];
}
