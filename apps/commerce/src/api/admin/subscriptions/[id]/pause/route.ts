import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendSubscriptionLifecycleMail } from "../../../../../lib/transactional-email/send-subscription-lifecycle-mail";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";
import { notifySubscriptionLifecycleSlack } from "../../../../../lib/slack-notify/notify-subscription-lifecycle";

/** POST /admin/subscriptions/:id/pause */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService.retrieveSubscription(id).catch(() => null);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const updated = await subscriptionService.pause(id);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  sendSubscriptionLifecycleMail({
    container: req.scope,
    customerId: updated.customer_id,
    subscriptionId: updated.id,
    template: "subscription_paused",
    logger: logger as { info?: (m: string) => void; warn?: (m: string) => void },
  });
  void notifySubscriptionLifecycleSlack(req.scope, {
    subscriptionId: updated.id,
    action: "paused",
    status: updated.status,
  });
  res.json({ subscription: updated });
};
