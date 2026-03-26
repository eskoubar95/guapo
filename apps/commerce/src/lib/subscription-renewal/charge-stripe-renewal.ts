import type SubscriptionModuleService from "../../modules/subscription/service";
import { getStripeClient } from "../stripe-client";

type StripeErrorWithRaw = Error & {
  code?: string;
  type?: string;
  raw?: {
    code?: string;
    payment_intent?: {
      id?: string;
      status?: string;
    };
  };
};

export type ChargeRenewalStripeResult =
  | { ok: true; stripePaymentIntentId: string }
  | {
      ok: false;
      error: string;
      retryCount: number;
      requiresAction?: boolean;
      stripePaymentIntentId?: string | null;
    };

/**
 * Off-session PaymentIntent charge for subscription renewal. Updates retry / on-hold on failure.
 * Requires STRIPE_API_KEY (caller should validate).
 */
export async function chargeStripeSubscriptionRenewal(input: {
  stripeAmountOre: number;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  subscriptionId: string;
  subRetryCount: number;
  subscriptionService: SubscriptionModuleService;
}): Promise<ChargeRenewalStripeResult> {
  const {
    stripeAmountOre,
    stripeCustomerId,
    stripePaymentMethodId,
    subscriptionId,
    subRetryCount,
    subscriptionService,
  } = input;

  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "STRIPE_API_KEY not set", retryCount: subRetryCount };
  }
  const stripe = getStripeClient();

  try {
    const pi = await stripe.paymentIntents.create({
      amount: stripeAmountOre,
      currency: "dkk",
      customer: stripeCustomerId,
      payment_method: stripePaymentMethodId,
      confirm: true,
      off_session: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });
    return { ok: true, stripePaymentIntentId: pi.id };
  } catch (err) {
    const e = err as StripeErrorWithRaw;
    const msg = e instanceof Error ? e.message : String(err);
    const stripeCode = e.code ?? e.raw?.code;
    const intentStatus = e.raw?.payment_intent?.status;
    const stripePaymentIntentId = e.raw?.payment_intent?.id ?? null;
    const requiresAction =
      stripeCode === "authentication_required" || intentStatus === "requires_action";

    if (requiresAction) {
      await subscriptionService.setFailureContext(subscriptionId, "authentication_required", {
        requires_customer_action: true,
        pending_payment_intent_id: stripePaymentIntentId,
      });
      await subscriptionService.setOnHold(
        subscriptionId,
        "authentication_required"
      );
      return {
        ok: false,
        error: msg,
        retryCount: subRetryCount,
        requiresAction: true,
        stripePaymentIntentId,
      };
    }

    const nextRetry = subRetryCount + 1;
    await subscriptionService.setRetryState(
      subscriptionId,
      nextRetry,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    await subscriptionService.setFailureContext(subscriptionId, stripeCode || "payment_failed");
    if (subRetryCount >= 2) {
      await subscriptionService.setOnHold(subscriptionId, stripeCode || "payment_failed");
    }
    return { ok: false, error: msg, retryCount: nextRetry };
  }
}
