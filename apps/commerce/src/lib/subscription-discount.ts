import { Modules } from "@medusajs/framework/utils";
import type { MedusaContainerLike } from "./container-types";

export const SUBSCRIPTION_PROMO_CODE = "SUBSCRIPTION-5PCT";
export const DEFAULT_SUBSCRIPTION_DISCOUNT_PERCENT = 5;

let cachedPromotionValue: number | null = null;

type PromotionModuleLike = {
  listPromotions: (
    filters: { code?: string[] },
    config?: { take?: number; relations?: string[] }
  ) => Promise<Array<{ application_method?: { value?: number } | null }>>;
};

async function fetchPromotionSubscriptionPercentFromDb(
  container: MedusaContainerLike
): Promise<number | null> {
  try {
    const promoModule = container.resolve(Modules.PROMOTION) as PromotionModuleLike;
    const promos = await promoModule.listPromotions(
      { code: [SUBSCRIPTION_PROMO_CODE] },
      { take: 1, relations: ["application_method"] }
    );
    const value = promos?.[0]?.application_method?.value;
    if (typeof value === "number" && value > 0) {
      if (cachedPromotionValue === null) {
        cachedPromotionValue = value;
      }
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Reads discount percent from SUBSCRIPTION-5PCT promotion; caches in-process after first successful read.
 */
export async function getSubscriptionDiscountPercent(
  container: MedusaContainerLike
): Promise<number> {
  if (cachedPromotionValue !== null) return cachedPromotionValue;
  const fromDb = await fetchPromotionSubscriptionPercentFromDb(container);
  if (fromDb != null) return fromDb;
  return DEFAULT_SUBSCRIPTION_DISCOUNT_PERCENT;
}

/**
 * Renewal flow: start from stored subscription.discount_percent (or default), then promotion overrides when present.
 */
export async function resolveDiscountPercentForRenewal(
  container: MedusaContainerLike,
  subscriptionStoredPercent: number | null | undefined
): Promise<number> {
  let discountPercent =
    subscriptionStoredPercent ?? DEFAULT_SUBSCRIPTION_DISCOUNT_PERCENT;
  const promoValue = await fetchPromotionSubscriptionPercentFromDb(container);
  if (promoValue != null) {
    discountPercent = promoValue;
  }
  return discountPercent;
}

/**
 * Promo-based discount, optionally overridden by product metadata `subscription_discount_percent`.
 */
export async function getSubscriptionDiscountPercentWithProductOverride(
  container: MedusaContainerLike,
  productMetadata: Record<string, unknown> | null | undefined
): Promise<number> {
  let discountPercent = await getSubscriptionDiscountPercent(container);
  if (productMetadata) {
    const pct = productMetadata.subscription_discount_percent;
    if (typeof pct === "number") discountPercent = pct;
  }
  return discountPercent;
}

export type SubscriptionDiscountLineInput = {
  unit_price?: number | null;
  quantity?: number | null;
  is_tax_inclusive?: boolean | null;
};

/**
 * Adjustment amount for a subscription discount on a cart line item.
 *
 * Medusa adjustments reduce the **ex-VAT subtotal**. Medusa then recomputes
 * tax on the reduced subtotal automatically, so the customer-facing discount
 * is the adjustment amount PLUS its tax effect.
 *
 * Example (DK 25% moms, 5% subscription discount):
 *   unit_price = 100 DKK (ex-VAT, is_tax_inclusive=false)
 *   → adjustment = 100 × 5% = 5 DKK
 *   → Medusa: subtotal 95, tax 23.75, total 118.75 (= 125 − 6.25 inkl. moms)
 *
 *   unit_price = 150 DKK (inkl. moms, is_tax_inclusive=true)
 *   → ex-VAT base = 150 / 1.25 = 120
 *   → adjustment = 120 × 5% = 6 DKK
 *   → Medusa: subtotal 114, tax 28.50, total 142.50 (= 150 − 7.50 inkl. moms)
 */
export function computeSubscriptionLineAdjustmentAmount(
  item: SubscriptionDiscountLineInput,
  discountPct: number
): number {
  const qty = item.quantity ?? 1;
  const unitPrice = item.unit_price ?? 0;
  const gross = unitPrice * qty;
  const exVatBase = item.is_tax_inclusive ? gross / 1.25 : gross;
  return Math.round(exVatBase * (discountPct / 100) * 100) / 100;
}
