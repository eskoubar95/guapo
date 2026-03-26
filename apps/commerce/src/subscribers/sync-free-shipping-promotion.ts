import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules, PromotionActions } from "@medusajs/framework/utils";
import {
  refreshPaymentCollectionForCartWorkflow,
  updateCartPromotionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { computeCartTotalForFreeShippingThreshold } from "../lib/free-shipping-cart-total";
import type { CartLike } from "../lib/free-shipping-cart-total";
import { GUAPO_FREE_SHIPPING_MODULE } from "../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../modules/guapo-free-shipping/service";

/**
 * Direct shipping adjustments (avoids updateCartPromotionsWorkflow re-applying all promos).
 *
 * Important: Medusa `PromotionModule.computeActions` removes every adjustment whose `code` is a
 * non-empty string, then re-applies only real promotions. A string `code` here would be wiped on
 * every `refreshCartItemsWorkflow`. We identify our rows via `metadata` and keep `code` null.
 */
const FREE_SHIPPING_LEGACY_ADJ_CODE = "GUAPO_FREE_SHIPPING";
const FREE_SHIPPING_META_KEY = "guapo_free_shipping" as const;
const FREE_SHIPPING_DESC_MARKER = "Fri fragt (Guapo)";
const SHIPPING_METHOD_RETRY_ATTEMPTS = 8;
const SHIPPING_METHOD_RETRY_DELAY_MS = 200;

let didEnsureNotAutomatic = false;

type PromotionModule = {
  listPromotions: (
    filters: { code?: string[] },
    config?: { take?: number }
  ) => Promise<Array<{ id: string; code: string; is_automatic?: boolean }>>;
  updatePromotions: (
    data: Array<{ id: string; is_automatic?: boolean }>
  ) => Promise<unknown>;
};

/**
 * On first invocation, ensure the free-shipping promotion (from settings)
 * is NOT automatic so Medusa's promotion engine won't re-apply it during
 * cart.complete. The threshold is enforced via custom adjustments instead.
 */
async function ensureNotAutomatic(
  container: { resolve: (k: string) => unknown },
  promoCode: string
) {
  if (didEnsureNotAutomatic) return;
  didEnsureNotAutomatic = true;
  try {
    const promoModule = container.resolve(Modules.PROMOTION) as PromotionModule;
    const codes = [promoCode.trim().toUpperCase()];
    if (!codes.includes("FREESHIPPING")) codes.push("FREESHIPPING");
    const matches = await promoModule.listPromotions(
      { code: codes },
      { take: 10 }
    );
    for (const p of matches) {
      if (p.is_automatic !== false) {
        await promoModule.updatePromotions([{ id: p.id, is_automatic: false }]);
      }
    }
  } catch {
    /* best-effort */
  }
}

type CartPromotion = { code?: string | null };
type QueryService = {
  graph: (opts: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: unknown[] }>;
};

type ShippingMethodRow = {
  id: string;
  amount?: number | string | null;
  adjustments?: Array<{
    id: string;
    description?: string | null;
    code?: string | null;
    amount?: number | null;
    metadata?: Record<string, unknown> | null;
  }> | null;
};

type CartShape = CartLike & {
  id: string;
  promotions?: CartPromotion[] | null;
  shipping_methods?: ShippingMethodRow[] | null;
};

type CartModuleService = {
  addShippingMethodAdjustments: (
    cartId: string,
    data: Array<{
      shipping_method_id: string;
      code?: string | null;
      amount: number;
      description?: string;
      metadata?: Record<string, unknown> | null;
    }>
  ) => Promise<unknown>;
  deleteShippingMethodAdjustments: (ids: string[]) => Promise<void>;
};

function promotionCodesMatch(cart: CartShape, code: string): boolean {
  const want = code.trim().toUpperCase();
  return (cart.promotions ?? []).some(
    (p) => (p.code ?? "").trim().toUpperCase() === want
  );
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isLegacyFreeShippingCode(code: string | undefined | null, promoCode: string): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return false;
  if (c === FREE_SHIPPING_LEGACY_ADJ_CODE) return false;
  return c === "FREESHIPPING" || c === promoCode.trim().toUpperCase();
}

function isGuapoFreeShippingAdjustment(a: {
  description?: string | null;
  code?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (a.metadata?.[FREE_SHIPPING_META_KEY] === true) return true;
  if ((a.description ?? "").trim() === FREE_SHIPPING_DESC_MARKER) return true;
  return (a.code ?? "").trim().toUpperCase() === FREE_SHIPPING_LEGACY_ADJ_CODE;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Applies or removes free shipping via shipping-method adjustments (ex-VAT base matches Shipmondo pricing).
 * Legacy Medusa FREESHIPPING promotion links are removed once; adjustments replace promotion engine.
 */
export default async function syncFreeShippingPromotion({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = event?.data?.id;
  if (!cartId) return;

  const settingsService = container.resolve(
    GUAPO_FREE_SHIPPING_MODULE
  ) as GuapoFreeShippingModuleService;

  const debug = process.env.GUAPO_FREE_SHIPPING_DEBUG === "true";
  const logger = debug
    ? (container.resolve(ContainerRegistrationKeys.LOGGER) as {
        info?: (m: string) => void;
        warn?: (m: string) => void;
        error?: (m: string) => void;
      })
    : null;

  let settings: Awaited<ReturnType<GuapoFreeShippingModuleService["getSettingsOrDefaults"]>>;
  try {
    settings = await settingsService.getSettingsOrDefaults();
  } catch {
    return;
  }

  await ensureNotAutomatic(container, settings.promotion_code);

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryService;
  const cartModule = container.resolve(Modules.CART) as unknown as CartModuleService;

  const retrieveCartForThreshold = async (): Promise<CartLike | null> => {
    try {
      const { data } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "item_total",
          "original_item_total",
          "discount_total",
          "items.*",
          "items.adjustments.*",
        ],
        filters: { id: cartId },
      });
      return (data?.[0] as CartLike | undefined) ?? null;
    } catch {
      return null;
    }
  };

  const retrieveCartForShipping = async (): Promise<CartShape | null> => {
    try {
      const { data } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "promotions.code",
          "shipping_methods.*",
          "shipping_methods.adjustments.*",
        ],
        filters: { id: cartId },
      });
      return (data?.[0] as CartShape | undefined) ?? null;
    } catch {
      return null;
    }
  };

  let thresholdCart = await retrieveCartForThreshold();
  let cart = await retrieveCartForShipping();
  if (!thresholdCart || !cart) return;

  let total = computeCartTotalForFreeShippingThreshold(thresholdCart);
  const promoCode = settings.promotion_code.trim();
  let hasPromo = promotionCodesMatch(cart, promoCode);
  let qualifies = settings.enabled && total >= settings.threshold_amount;

  const removeLegacyPromotion = async () => {
    await updateCartPromotionsWorkflow(container).run({
      input: {
        cart_id: cartId,
        promo_codes: [promoCode],
        action: PromotionActions.REMOVE,
        force_refresh_payment_collection: true,
      },
    });
  };

  if (hasPromo) {
    await removeLegacyPromotion();
    thresholdCart = await retrieveCartForThreshold();
    cart = await retrieveCartForShipping();
    if (!thresholdCart || !cart) return;
    total = computeCartTotalForFreeShippingThreshold(thresholdCart);
    qualifies = settings.enabled && total >= settings.threshold_amount;
    hasPromo = promotionCodesMatch(cart, promoCode);
  }

  /**
   * Race guard: right after adding shipping method, some carts can be emitted with
   * missing/zero shipping method amounts for a short window. If we decide too early,
   * free-shipping adjustments are skipped and payment collection stays stale.
   */
  if (qualifies) {
    let attempts = 0;
    let methodsNow = cart.shipping_methods ?? [];
    let hasPositiveAmount = methodsNow.some((sm) => num(sm.amount) > 0);
    while (
      attempts < SHIPPING_METHOD_RETRY_ATTEMPTS &&
      (methodsNow.length === 0 || !hasPositiveAmount)
    ) {
      await sleep(SHIPPING_METHOD_RETRY_DELAY_MS);
      const refreshed = await retrieveCartForShipping();
      if (!refreshed) break;
      cart = refreshed;
      methodsNow = cart.shipping_methods ?? [];
      hasPositiveAmount = methodsNow.some((sm) => num(sm.amount) > 0);
      attempts += 1;
    }
  }

  const methods = cart.shipping_methods ?? [];
  if (logger) {
    logger.info?.(
      `[free-shipping-debug] cart=${cartId} threshold=${settings.threshold_amount} enabled=${settings.enabled} promoCode=${promoCode} total=${total} qualifies=${qualifies} methods=${methods.length}`
    );
  }

  const adjustmentIdsToRemove: string[] = [];
  const adjustmentsToAdd: Array<{
    shipping_method_id: string;
    code: string;
    amount: number;
    description: string;
  }> = [];

  for (const sm of methods) {
    const baseAmount = num(sm.amount);
    const legacy = (sm.adjustments ?? []).filter((a) =>
      isLegacyFreeShippingCode(a.code, promoCode)
    );
    const ours = (sm.adjustments ?? []).filter(isGuapoFreeShippingAdjustment);
    if (logger) {
      logger.info?.(
        `[free-shipping-debug] sm=${sm.id} amount=${String(
          sm.amount
        )} base=${baseAmount} legacyAdjustments=${legacy
          .map((a) => `${a.code}:${String(a.amount)}`)
          .join(",")} oursAdjustments=${ours
          .map((a) => `${a.code}:${String(a.amount)}`)
          .join(",")}`
      );
    }

    if (!qualifies) {
      adjustmentIdsToRemove.push(
        ...legacy.map((a) => a.id),
        ...ours.map((a) => a.id)
      );
      continue;
    }

    if (baseAmount <= 0) {
      adjustmentIdsToRemove.push(
        ...legacy.map((a) => a.id),
        ...ours.map((a) => a.id)
      );
      continue;
    }

    adjustmentIdsToRemove.push(...legacy.map((a) => a.id));

    const existingOurs = ours[0];
    const alreadyCorrect =
      existingOurs &&
      Math.abs(num(existingOurs.amount) - baseAmount) < 0.005;

    if (alreadyCorrect) continue;

    adjustmentIdsToRemove.push(...ours.map((a) => a.id));
    adjustmentsToAdd.push({
      shipping_method_id: sm.id,
      code: promoCode || "FREESHIPPING",
      amount: baseAmount,
      description: FREE_SHIPPING_DESC_MARKER,
    });
  }

  if (adjustmentIdsToRemove.length > 0) {
    await cartModule.deleteShippingMethodAdjustments([...new Set(adjustmentIdsToRemove)]);
  }
  if (adjustmentsToAdd.length > 0) {
    await cartModule.addShippingMethodAdjustments(cartId, adjustmentsToAdd);
  }

  if (logger) {
    logger.info?.(
      `[free-shipping-debug] cart=${cartId} addedAdjustments=${adjustmentsToAdd.length} removedAdjustments=${adjustmentIdsToRemove.length}`
    );
  }

  /**
   * Cart totals in API responses are decorated from line items + shipping adjustments, but the
   * payment collection `amount` is persisted separately. Without this, Stripe/Klarna still
   * authorize the pre-adjustment total even when `shipping_total` looks correct on the cart.
   */
  if (adjustmentIdsToRemove.length > 0 || adjustmentsToAdd.length > 0) {
    try {
      await refreshPaymentCollectionForCartWorkflow(container).run({
        input: { cart_id: cartId },
      });
    } catch {
      /* best-effort */
    }
  }
}

export const config: SubscriberConfig = {
  event: ["cart.updated"],
};
