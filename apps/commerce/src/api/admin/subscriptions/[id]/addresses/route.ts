import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

type UpdateAddressBody = {
  shipping_address?: Record<string, unknown>;
  billing_address?: Record<string, unknown>;
  delivery_data?: Record<string, unknown> | null;
};

/** POST /admin/subscriptions/:id/addresses */
export const POST = async (
  req: MedusaRequest<UpdateAddressBody>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const body = req.validatedBody;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService.retrieveSubscription(id).catch(() => null);
  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  const [updated] = await subscriptionService.updateSubscriptions([
    {
      id,
      ...(body.shipping_address ? { shipping_address: body.shipping_address } : {}),
      ...(body.billing_address ? { billing_address: body.billing_address } : {}),
      ...(Object.prototype.hasOwnProperty.call(body, "delivery_data")
        ? { delivery_data: body.delivery_data ?? null }
        : {}),
    },
  ]);

  res.json({ subscription: updated });
};
