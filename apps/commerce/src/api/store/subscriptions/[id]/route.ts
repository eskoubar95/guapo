import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../modules/subscription/service";

/**
 * GET /store/subscriptions/:id
 * Retrieve one subscription. Requires auth and ownership.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at se abonnementet.",
      code: "UNAUTHORIZED",
    });
  }

  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService
    .retrieveSubscription(id)
    .catch(() => null);

  if (!subscription) {
    return res.status(404).json({
      message: "Abonnement ikke fundet.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  }

  if (subscription.customer_id !== authContext.actor_id) {
    return res.status(403).json({
      message: "Du har ikke adgang til dette abonnement.",
      code: "FORBIDDEN",
    });
  }

  res.json({
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cycle_weeks: subscription.cycle_weeks,
      next_renewal_at: subscription.next_renewal_at,
      last_renewal_at: subscription.last_renewal_at,
      delivery_count: subscription.delivery_count,
      discount_percent: subscription.discount_percent,
      variant_id: subscription.variant_id,
      quantity: subscription.quantity,
      skip_next: subscription.skip_next,
      shipping_address: subscription.shipping_address,
      billing_address: subscription.billing_address,
      metadata: subscription.metadata,
    },
  });
};
