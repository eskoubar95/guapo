import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { getSubscriptionDiscountPercent, SUBSCRIPTION_PROMO_CODE } from "../lib/subscription-discount";

type CartLineItem = {
  id: string;
  unit_price: number;
  quantity: number;
  metadata?: Record<string, unknown> | null;
  adjustments?: Array<{ id: string; code?: string | null }> | null;
};

type CartModuleService = {
  retrieveCart: (
    id: string,
    config: { relations: string[] }
  ) => Promise<{ id: string; items: CartLineItem[] }>;
  addLineItemAdjustments: (
    data: Array<{
      item_id: string;
      code: string;
      amount: number;
      description?: string;
      promotion_id?: string;
    }>
  ) => Promise<unknown>;
  deleteLineItemAdjustments: (ids: string[]) => Promise<void>;
};

export default async function applySubscriptionDiscount({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = event?.data?.id;
  if (!cartId) return;

  const cartModule = container.resolve(
    Modules.CART
  ) as unknown as CartModuleService;

  let cart: { id: string; items: CartLineItem[] };
  try {
    cart = await cartModule.retrieveCart(cartId, {
      relations: ["items", "items.adjustments"],
    });
  } catch {
    return;
  }

  const discountPct = await getSubscriptionDiscountPercent(container);
  const adjustmentsToAdd: Array<{
    item_id: string;
    code: string;
    amount: number;
    description: string;
  }> = [];
  const adjustmentIdsToRemove: string[] = [];

  for (const item of cart.items ?? []) {
    const cycle =
      item.metadata &&
      typeof (item.metadata as Record<string, unknown>).subscription_cycle ===
        "number"
        ? ((item.metadata as Record<string, unknown>)
            .subscription_cycle as number)
        : 0;
    const isSubscription = cycle > 0;

    const existingAdj = (item.adjustments ?? []).find(
      (adj) => adj.code === SUBSCRIPTION_PROMO_CODE
    );

    if (isSubscription && !existingAdj) {
      const amount =
        (item.unit_price ?? 0) * (item.quantity ?? 1) * (discountPct / 100);
      if (amount > 0) {
        adjustmentsToAdd.push({
          item_id: item.id,
          code: SUBSCRIPTION_PROMO_CODE,
          amount,
          description: `Abonnementsrabat ${discountPct}%`,
        });
      }
    } else if (!isSubscription && existingAdj) {
      adjustmentIdsToRemove.push(existingAdj.id);
    }
  }

  if (adjustmentIdsToRemove.length > 0) {
    await cartModule.deleteLineItemAdjustments(adjustmentIdsToRemove);
  }
  if (adjustmentsToAdd.length > 0) {
    await cartModule.addLineItemAdjustments(adjustmentsToAdd);
  }
}

export const config: SubscriberConfig = {
  event: ["cart.updated"],
};
