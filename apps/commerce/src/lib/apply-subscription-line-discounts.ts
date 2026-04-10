import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  computeSubscriptionLineAdjustmentAmount,
  getSubscriptionDiscountPercent,
  SUBSCRIPTION_PROMO_CODE,
} from "./subscription-discount";
import { getSubscriptionCycleWeeksFromMetadata } from "./subscription-cycle-metadata";

type CartLineItem = {
  id: string;
  unit_price: number;
  quantity: number;
  is_tax_inclusive?: boolean | null;
  metadata?: Record<string, unknown> | null;
  adjustments?: Array<{ id: string; code?: string | null; amount?: number }> | null;
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

/**
 * Ensures SUBSCRIPTION-5PCT line adjustments match subscription line items.
 * Used by cart.updated subscriber and the synchronous store sync route (staging-safe).
 */
export async function applySubscriptionLineDiscountsForCart(
  container: MedusaContainer,
  cartId: string
): Promise<void> {
  const cartModule = container.resolve(Modules.CART) as unknown as CartModuleService;

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
    const cycle = getSubscriptionCycleWeeksFromMetadata(
      item.metadata as Record<string, unknown> | null | undefined
    );
    const isSubscription = cycle > 0;

    const existing = (item.adjustments ?? []).filter(
      (adj) => adj.code === SUBSCRIPTION_PROMO_CODE
    );

    if (isSubscription) {
      const amount = computeSubscriptionLineAdjustmentAmount(item, discountPct);
      if (amount <= 0) {
        adjustmentIdsToRemove.push(...existing.map((a) => a.id));
        continue;
      }

      const alreadyCorrect =
        existing.length === 1 &&
        Math.abs((existing[0].amount ?? 0) - amount) < 0.01;

      if (alreadyCorrect) continue;

      adjustmentIdsToRemove.push(...existing.map((a) => a.id));
      adjustmentsToAdd.push({
        item_id: item.id,
        code: SUBSCRIPTION_PROMO_CODE,
        amount,
        description: `Abonnementsrabat ${discountPct}%`,
      });
    } else {
      adjustmentIdsToRemove.push(...existing.map((a) => a.id));
    }
  }

  if (adjustmentIdsToRemove.length > 0) {
    await cartModule.deleteLineItemAdjustments(adjustmentIdsToRemove);
  }
  if (adjustmentsToAdd.length > 0) {
    await cartModule.addLineItemAdjustments(adjustmentsToAdd);
  }
}
