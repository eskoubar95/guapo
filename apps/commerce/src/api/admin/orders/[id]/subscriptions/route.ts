import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

/**
 * GET /admin/orders/:id/subscriptions
 * List subscriptions linked to this order (initial or renewal).
 * Uses metadata.order_id fallback when link is not yet populated.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: orderId } = req.params;

  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  // List subscriptions and filter by metadata.order_id
  // (JSON filter may not be supported by all drivers)
  const all = await subscriptionService.listSubscriptions({}, { take: 500 });
  const linked = (all ?? []).filter((s) => {
    const meta = s.metadata as Record<string, unknown> | null | undefined;
    return meta?.order_id === orderId;
  });

  res.json({ subscriptions: linked });
};
