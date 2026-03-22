import Stripe from "stripe";

import type SubscriptionModuleService from "../../modules/subscription/service";

export type ChargeRenewalStripeResult =
  | { ok: true; stripePaymentIntentId: string }
  | { ok: false; error: string; retryCount: number };

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
  const stripe = new Stripe(apiKey);

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
    const msg = err instanceof Error ? err.message : String(err);
    const nextRetry = subRetryCount + 1;
    await subscriptionService.setRetryState(
      subscriptionId,
      nextRetry,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    if (subRetryCount >= 2) {
      await subscriptionService.setOnHold(subscriptionId);
    }
    return { ok: false, error: msg, retryCount: nextRetry };
  }
}
