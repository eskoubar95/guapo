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
