import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";
import { resolveQuery } from "../lib/container-types";
import {
  resolveStripeCustomerAndPaymentMethodFromOrder,
  retrieveStripePaymentMethodCardDetails,
} from "../lib/stripe-helpers";

/**
 * When an order is placed, fetch Stripe payment method details (last4, brand)
 * and store them in order.metadata so the storefront can show payment info on confirmation.
 */
export default async function orderPlacedPaymentMetadata({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    warn?: (m: string) => void;
  };
  const log = (msg: string) => logger?.info?.(msg);
  const logWarn = (msg: string) => logger?.warn?.(msg);

  if (!process.env.STRIPE_API_KEY) return;

  const query = resolveQuery(container);

  try {
    const { data: ordersWithPay } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "metadata", "payment_collections.id"],
      filters: { id: orderId },
    });
    const orderRow = (
      ordersWithPay as Array<{
        id: string;
        customer_id?: string | null;
        metadata?: Record<string, unknown>;
        payment_collections?: Array<{ id: string }>;
      }>
    )?.[0];
    if (!orderRow?.payment_collections?.length) return;
    const userId = orderRow.customer_id ?? orderId;

    const { paymentMethodId: stripePaymentMethodId } =
      await resolveStripeCustomerAndPaymentMethodFromOrder(container, orderId, 20);

    if (!stripePaymentMethodId) return;

    const cardDetails = await retrieveStripePaymentMethodCardDetails(stripePaymentMethodId);
    if (!cardDetails) return;

    const { last4: payment_last4, brand: payment_brand } = cardDetails;

    const existingMeta = (orderRow.metadata ?? {}) as Record<string, unknown>;
    await updateOrderWorkflow(container).run({
      input: {
        id: orderId,
        user_id: userId,
        metadata: {
          ...existingMeta,
          payment_last4,
          payment_brand,
        },
      },
    });
    log(
      `[order-placed-payment-metadata] Order ${orderId}: set payment_last4=${payment_last4}, payment_brand=${payment_brand}`
    );
  } catch (err) {
    logWarn?.(
      `[order-placed-payment-metadata] Order ${orderId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
