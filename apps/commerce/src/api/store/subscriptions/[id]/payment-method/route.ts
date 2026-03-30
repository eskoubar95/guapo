import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getStripeClient } from "../../../../../lib/stripe-client";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";

type PaymentMethodBody =
  | { action: "create_setup_intent" }
  | {
      action: "confirm_setup_intent";
      setup_intent_id: string;
    };

/** POST /store/subscriptions/:id/payment-method */
export const POST = async (
  req: MedusaRequest<PaymentMethodBody>,
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

  const stripe = getStripeClient();

  if (body.action === "create_setup_intent") {
    const si = await stripe.setupIntents.create({
      customer: subscription.stripe_customer_id,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: {
        subscription_id: subscription.id,
      },
    });
    return res.json({
      setup_intent_id: si.id,
      client_secret: si.client_secret,
    });
  }

  const setupIntent = await stripe.setupIntents.retrieve(body.setup_intent_id);
  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    return res.status(400).json({
      message: "SetupIntent mangler payment method",
      code: "INVALID_SETUP_INTENT",
    });
  }

  const [updated] = await subscriptionService.updateSubscriptions([
    {
      id: subscription.id,
      stripe_payment_method_id: paymentMethodId,
      retry_count: 0,
      next_retry_at: null,
      last_failure_reason: null,
    },
  ]);

  if (subscription.status === "on_hold") {
    await subscriptionService.resume(subscription.id);
  }

  return res.json({
    subscription: updated,
    payment_method_id: paymentMethodId,
  });
};
