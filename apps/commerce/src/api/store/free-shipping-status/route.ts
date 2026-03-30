import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { computeCartTotalForFreeShippingThreshold } from "../../../lib/free-shipping-cart-total";
import type { CartLike } from "../../../lib/free-shipping-cart-total";
import { GUAPO_FREE_SHIPPING_MODULE } from "../../../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../../../modules/guapo-free-shipping/service";

type CartModuleLike = {
  retrieveCart: (
    id: string,
    config: { relations?: string[]; select?: string[] }
  ) => Promise<CartLike>;
};

/**
 * GET /store/free-shipping-status?cart_id=...
 * Returns threshold and whether the cart qualifies (same basis as subscriber + storefront progress bar).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.query?.cart_id as string | undefined;
  if (!cartId || typeof cartId !== "string") {
    return res.status(400).json({
      message: "cart_id query parameter is required",
      code: "MISSING_CART_ID",
    });
  }

  try {
    const settingsService = req.scope.resolve(
      GUAPO_FREE_SHIPPING_MODULE
    ) as GuapoFreeShippingModuleService;
    const settings = await settingsService.getSettingsOrDefaults();

    const cartModule = req.scope.resolve(Modules.CART) as unknown as CartModuleLike;
    const cart = await cartModule.retrieveCart(cartId, {
      select: [
        "id",
        "item_total",
        "original_item_total",
        "discount_total",
        "items",
      ],
      relations: ["items", "items.adjustments"],
    });

    const cart_total = computeCartTotalForFreeShippingThreshold(cart);
    const threshold = settings.threshold_amount;
    const remaining = Math.max(0, threshold - cart_total);
    const qualifies = settings.enabled && cart_total >= threshold;

    return res.json({
      threshold,
      cart_total,
      remaining,
      qualifies,
      enabled: settings.enabled,
      promotion_code: settings.promotion_code,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load free shipping status";
    return res.status(500).json({ message, code: "FREE_SHIPPING_STATUS_ERROR" });
  }
};
