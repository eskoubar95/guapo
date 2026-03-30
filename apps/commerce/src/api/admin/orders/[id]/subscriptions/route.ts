import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

/**
 * GET /admin/orders/:id/subscriptions
 * List subscriptions linked to this order (initial order via metadata.order_id,
 * latest renewal via last_renewal_order_id, or both).
 *
 * Note: Does not query `query.graph` on `order` with `subscriptions.*` — that relation
 * is not exposed on the Order entity (link is subscription → orders).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: orderId } = req.params;

  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const all = await subscriptionService.listSubscriptions({}, { take: 1000 });
  const matching = (all ?? []).filter((s) => {
    const meta = s.metadata as Record<string, unknown> | null | undefined;
    return meta?.order_id === orderId || s.last_renewal_order_id === orderId;
  });

  res.json({ subscriptions: matching });
};
