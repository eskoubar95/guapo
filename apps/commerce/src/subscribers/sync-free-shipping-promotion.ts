import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules, PromotionActions } from "@medusajs/framework/utils";
import { updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows";
import { computeCartTotalForFreeShippingThreshold } from "../lib/free-shipping-cart-total";
import type { CartLike } from "../lib/free-shipping-cart-total";
import { GUAPO_FREE_SHIPPING_MODULE } from "../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../modules/guapo-free-shipping/service";

type CartPromotion = { code?: string | null };
type CartShape = CartLike & {
  id: string;
  promotions?: CartPromotion[] | null;
};

type CartModuleLike = {
  retrieveCart: (
    id: string,
    config: { relations: string[] }
  ) => Promise<CartShape>;
};

function promotionCodesMatch(cart: CartShape, code: string): boolean {
  const want = code.trim().toUpperCase();
  return (cart.promotions ?? []).some(
    (p) => (p.code ?? "").trim().toUpperCase() === want
  );
}

/**
 * Applies or removes the configured free-shipping promotion based on cart total vs threshold.
 * Shipmondo still calculates base shipping; promotion zeroes shipping when eligible.
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

  let settings: Awaited<ReturnType<GuapoFreeShippingModuleService["getSettingsOrDefaults"]>>;
  try {
    settings = await settingsService.getSettingsOrDefaults();
  } catch {
    return;
  }

  const cartModule = container.resolve(Modules.CART) as unknown as CartModuleLike;

  let cart: CartShape;
  try {
    cart = await cartModule.retrieveCart(cartId, {
      relations: ["promotions", "items", "items.adjustments"],
    });
  } catch {
    return;
  }

  const total = computeCartTotalForFreeShippingThreshold(cart);
  const promoCode = settings.promotion_code.trim();
  const hasPromo = promotionCodesMatch(cart, promoCode);
  const qualifies = settings.enabled && total >= settings.threshold_amount;

  if (qualifies && !hasPromo) {
    await updateCartPromotionsWorkflow(container).run({
      input: {
        cart_id: cartId,
        promo_codes: [promoCode],
        action: PromotionActions.ADD,
        force_refresh_payment_collection: true,
      },
    });
    return;
  }

  if (!qualifies && hasPromo) {
    await updateCartPromotionsWorkflow(container).run({
      input: {
        cart_id: cartId,
        promo_codes: [promoCode],
        action: PromotionActions.REMOVE,
        force_refresh_payment_collection: true,
      },
    });
  }
}

export const config: SubscriberConfig = {
  event: ["cart.updated"],
};
