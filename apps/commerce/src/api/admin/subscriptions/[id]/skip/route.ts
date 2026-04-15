import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

/** POST /admin/subscriptions/:id/skip */
export const POST = async (
  req: MedusaRequest<{ skip?: boolean }>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const body = req.validatedBody;
  const skip = body?.skip ?? true;

  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService.retrieveSubscription(id).catch(() => null);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const updated = await subscriptionService.setSkipNext(id, skip);
  res.json({ subscription: updated });
};
