import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { applySubscriptionLineDiscountsForCart } from "../../../../../../lib/apply-subscription-line-discounts";

/**
 * POST /store/carts/:id/subscription-discount/sync
 *
 * Applies SUBSCRIPTION-5PCT line adjustments immediately on the API process.
 * Call after updating line-item metadata (subscribe toggle) so storefront does not rely on
 * async cart.updated + Redis worker before the next cart fetch — fixes missing discount in cart UI on staging.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params?.id as string | undefined;
  if (!cartId || typeof cartId !== "string") {
    return res.status(400).json({
      message: "cart id is required",
      code: "MISSING_CART_ID",
    });
  }

  try {
    await applySubscriptionLineDiscountsForCart(req.scope, cartId);
    return res.status(204).send();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync subscription discounts";
    return res.status(500).json({
      message,
      code: "SUBSCRIPTION_DISCOUNT_SYNC_ERROR",
    });
  }
};
