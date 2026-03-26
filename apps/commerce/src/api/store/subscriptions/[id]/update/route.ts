import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

type UpdateSubscriptionBody = {
  shipping_address?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
};

/** POST /store/subscriptions/:id/update */
export const POST = async (
  req: MedusaRequest<UpdateSubscriptionBody>,
  res: MedusaResponse
) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at administrere abonnementet.",
      code: "UNAUTHORIZED",
    });
  }

  const { id } = req.params;
  const body = req.validatedBody ?? req.body;
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

  const [updated] = await subscriptionService.updateSubscriptions([
    {
      id,
      ...(body.shipping_address ? { shipping_address: body.shipping_address } : {}),
      ...(body.billing_address ? { billing_address: body.billing_address } : {}),
    },
  ]);

  res.json({ subscription: updated });
};
