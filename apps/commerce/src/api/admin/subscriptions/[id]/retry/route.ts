import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";
import { renewSubscriptionWorkflow } from "../../../../../workflows/renew-subscription";

/** POST /admin/subscriptions/:id/retry */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService.retrieveSubscription(id).catch(() => null);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  await subscriptionService.setRetryState(id, 0, new Date());
  if (subscription.status === "on_hold") {
    await subscriptionService.resume(id);
  }

  const { result } = await renewSubscriptionWorkflow(req.scope).run({
    input: { subscriptionId: id },
  });

  res.json({ result });
};
