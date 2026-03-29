import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_API_KEY not set");
  }

  stripeClient = new Stripe(apiKey, {
    timeout: 80_000,
    maxNetworkRetries: 2,
  });
  return stripeClient;
}
