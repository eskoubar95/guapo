import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

/** POST /admin/subscriptions/:id/cancel */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService.retrieveSubscription(id).catch(() => null);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const updated = await subscriptionService.cancel(id);
  res.json({ subscription: updated });
};
