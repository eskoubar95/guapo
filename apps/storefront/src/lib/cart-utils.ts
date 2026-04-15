import type { StoreCart } from "./cart";
import { cartItemHasSubscription } from "./subscription-cycle";

/** Returns true if cart has any line item with subscription_cycle in metadata */
export function cartHasSubscriptionItems(cart: StoreCart | null): boolean {
  if (!cart?.items || !Array.isArray(cart.items)) return false;
  return cart.items.some(
    (item) =>
      item?.metadata &&
      typeof item.metadata === "object" &&
      cartItemHasSubscription(item.metadata as Record<string, unknown>)
  );
}
