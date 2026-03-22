import Stripe from "stripe";

import {
  type MedusaContainerLike,
  resolvePaymentModule,
  resolveQuery,
} from "./container-types";

export type { MedusaContainerLike } from "./container-types";

export type StripeCustomerPaymentMethodResult = {
  customerId: string | null;
  paymentMethodId: string | null;
  payColIds: string[];
};

export function isStripePaymentProvider(providerId: string | undefined): boolean {
  return providerId === "pp_stripe_stripe" || String(providerId ?? "").includes("stripe");
}

/**
 * From Medusa payment `data`, read customer + payment method IDs.
 * If payment method is missing but a PaymentIntent id exists, fetches PI from Stripe (requires STRIPE_API_KEY).
 */
export async function enrichStripeIdsFromPaymentData(
  data: Record<string, unknown>
): Promise<{ customerId: string | null; paymentMethodId: string | null }> {
  let paymentMethodId: string | null =
    (data.payment_method as string) ?? (data.payment_method_id as string) ?? null;
  let customerId: string | null =
    (data.customer as string) ?? (data.customer_id as string) ?? null;

  if (paymentMethodId) {
    return { customerId, paymentMethodId };
  }

  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) {
    return { customerId, paymentMethodId: null };
  }

  const piId = (data.id as string) ?? (data.payment_intent as string);
  if (!piId) {
    return { customerId, paymentMethodId: null };
  }

  const stripe = new Stripe(apiKey);
  const pi = await stripe.paymentIntents.retrieve(piId);
  paymentMethodId =
    typeof pi.payment_method === "string"
      ? pi.payment_method
      : pi.payment_method?.id ?? null;
  customerId =
    typeof pi.customer === "string"
      ? pi.customer
      : pi.customer?.id ?? customerId;

  return { customerId, paymentMethodId };
}

/**
 * Resolves Stripe customer + payment method for an order via payment collections and Payment module.
 */
export async function resolveStripeCustomerAndPaymentMethodFromOrder(
  container: MedusaContainerLike,
  orderId: string,
  listPaymentsTake = 50
): Promise<StripeCustomerPaymentMethodResult> {
  const query = resolveQuery(container);

  const { data: ordersWithPay } = await query.graph({
    entity: "order",
    fields: ["id", "payment_collections.id"],
    filters: { id: orderId },
  });

  type OrderWithPayCols = { id: string; payment_collections?: Array<{ id: string }> };
  const payColIds =
    (ordersWithPay as OrderWithPayCols[])?.[0]?.payment_collections?.map((pc) => pc.id) ?? [];

  if (payColIds.length === 0) {
    return { customerId: null, paymentMethodId: null, payColIds: [] };
  }

  const paymentModule = resolvePaymentModule(container);

  const payments = await paymentModule.listPayments(
    { payment_collection_id: payColIds },
    { take: listPaymentsTake }
  );

  const stripePayment = payments?.find((p) => isStripePaymentProvider(p.provider_id));
  if (!stripePayment?.data) {
    return { customerId: null, paymentMethodId: null, payColIds };
  }

  const enriched = await enrichStripeIdsFromPaymentData(
    stripePayment.data as Record<string, unknown>
  );

  return {
    customerId: enriched.customerId,
    paymentMethodId: enriched.paymentMethodId,
    payColIds,
  };
}

/**
 * Fetches card last4 and brand for storefront / order metadata (requires STRIPE_API_KEY).
 */
export async function retrieveStripePaymentMethodCardDetails(
  paymentMethodId: string
): Promise<{ last4: string; brand: string } | null> {
  const apiKey = process.env.STRIPE_API_KEY;
  if (!apiKey) return null;

  const stripe = new Stripe(apiKey);
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  const card = pm.card;
  if (!card?.last4) return null;

  const brand =
    typeof card.brand === "string"
      ? card.brand
      : (card as { brand?: string }).brand ?? "";

  return { last4: card.last4, brand };
}
