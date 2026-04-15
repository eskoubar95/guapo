import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendSubscriptionLifecycleMail } from "../../../../../lib/transactional-email/send-subscription-lifecycle-mail";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

/** POST /store/subscriptions/:id/cancel */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at administrere abonnementet.",
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

  const MINIMUM_COMMITMENT_DELIVERIES = 2;
  const deliveryCount = subscription.delivery_count ?? 0;
  if (deliveryCount < MINIMUM_COMMITMENT_DELIVERIES) {
    return res.status(400).json({
      message:
        "Du skal modtage mindst to leveringer, før du kan afslutte abonnementet.",
      code: "MINIMUM_COMMITMENT_NOT_MET",
      delivery_count: deliveryCount,
      minimum_required: MINIMUM_COMMITMENT_DELIVERIES,
    });
  }

  const updated = await subscriptionService.cancel(id);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  sendSubscriptionLifecycleMail({
    container: req.scope,
    customerId: updated.customer_id,
    subscriptionId: updated.id,
    template: "subscription_cancelled",
    logger: logger as { info?: (m: string) => void; warn?: (m: string) => void },
  });
  res.json({ subscription: updated });
};
