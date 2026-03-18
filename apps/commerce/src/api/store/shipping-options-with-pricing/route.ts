import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listShippingOptionsForCartWithPricingWorkflow } from "@medusajs/medusa/core-flows";

/**
 * GET /store/shipping-options-with-pricing?cart_id=xxx
 * Returns shipping options with calculated prices (weight-based from Shipmondo provider).
 * Use this from the storefront instead of raw listCartOptions when you need dynamic prices.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.query?.cart_id as string | undefined;
  if (!cartId) {
    return res.status(400).json({
      message: "cart_id query parameter is required",
      code: "MISSING_CART_ID",
    });
  }

  try {
    const { result } = await listShippingOptionsForCartWithPricingWorkflow(req.scope).run({
      input: { cart_id: cartId },
    });

    const options = Array.isArray(result) ? result : [];
    const shipping_options = options.map((o: Record<string, unknown>) => {
      const amount =
        typeof o.amount === "number"
          ? o.amount
          : typeof (o.calculated_price as Record<string, unknown>)?.calculated_amount === "number"
            ? (o.calculated_price as Record<string, unknown>).calculated_amount as number
            : 0;
      return {
        id: o.id,
        name: o.name,
        amount,
        calculated_price: o.calculated_price,
      };
    });

    return res.json({ shipping_options });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list shipping options";
    return res.status(500).json({ message, code: "SHIPPING_OPTIONS_ERROR" });
  }
};
