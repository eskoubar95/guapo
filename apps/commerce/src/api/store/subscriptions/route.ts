import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription";
import type SubscriptionModuleService from "../../../modules/subscription/service";

/**
 * GET /store/subscriptions
 * List authenticated customer's subscriptions.
 * Requires: session or bearer auth.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at se dine abonnementer.",
      code: "UNAUTHORIZED",
    });
  }

  const customerId = authContext.actor_id;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscriptions = await subscriptionService.listSubscriptions(
    { customer_id: customerId },
    { order: { next_renewal_at: "ASC" } }
  );

  res.json({
    subscriptions: (subscriptions ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      cycle_weeks: s.cycle_weeks,
      next_renewal_at: s.next_renewal_at,
      delivery_count: s.delivery_count,
      discount_percent: s.discount_percent,
      variant_id: s.variant_id,
      quantity: s.quantity,
      skip_next: s.skip_next,
    })),
  });
};
