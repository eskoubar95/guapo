/**
 * Read-only: why an order may not have created Subscription rows.
 *
 *   ORDER_ID=order_xxx pnpm -C apps/commerce medusa exec ./src/scripts/inspect-order-subscription.ts
 *
 * Uses DATABASE_URL from apps/commerce/.env — point it at staging DB locally to inspect staging orders.
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveQuery } from "../lib/container-types";
import { resolveStripeCustomerAndPaymentMethodFromOrder } from "../lib/stripe-helpers";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";

export default async function inspectOrderSubscription({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    error?: (m: string) => void;
  };
  const log = (m: string) => logger?.info?.(m) ?? console.log(m);

  const orderId = process.env.ORDER_ID?.trim();
  if (!orderId) {
    logger?.error?.("Set ORDER_ID=order_xxx");
    process.exitCode = 1;
    return;
  }

  const query = resolveQuery(container);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "items.id",
      "items.metadata",
      "items.variant_id",
    ],
    filters: { id: orderId },
  });

  const order = orders?.[0] as
    | {
        id: string;
        customer_id?: string | null;
        items?: Array<{ id?: string; metadata?: Record<string, unknown> | null }>;
      }
    | undefined;

  if (!order) {
    log(`Order not found in this database: ${orderId}`);
    log("(Tip: copy staging DATABASE_URL into apps/commerce/.env or run from a machine that uses staging DB.)");
    process.exitCode = 2;
    return;
  }

  log(`--- inspect-order-subscription: ${order.id} ---`);
  log(`customer_id: ${order.customer_id ?? "(null/empty)"}`);

  const items = order.items ?? [];
  if (items.length === 0) {
    log("No line items.");
    process.exitCode = 3;
    return;
  }

  for (const item of items) {
    const raw = item.metadata?.subscription_cycle;
    const typeofRaw = typeof raw;
    const passesSubscriberFilter = typeofRaw === "number";
    log(
      `line ${item.id}: subscription_cycle=${JSON.stringify(raw)} typeof=${typeofRaw} ` +
        `subscriber_would_count_as_subscription=${passesSubscriberFilter}`
    );
  }

  const stripe = await resolveStripeCustomerAndPaymentMethodFromOrder(
    container,
    orderId,
    50
  );
  log(
    `Stripe: customer_id=${stripe.customerId ?? "(null)"} payment_method_id=${stripe.paymentMethodId ?? "(null)"} ` +
      `payment_collection_ids=[${stripe.payColIds.join(", ")}]`
  );

  const hasStripe = !!(stripe.customerId && stripe.paymentMethodId);
  const hasCustomer = !!(order.customer_id && String(order.customer_id).trim());
  const subLinesPassFilter = items.some(
    (i) => typeof i.metadata?.subscription_cycle === "number"
  );

  log(
    `Summary: would_create_subscriptions=${hasCustomer && hasStripe && subLinesPassFilter} ` +
      `(needs customer_id + stripe ids + at least one line with subscription_cycle typeof number)`
  );

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const allSubs = await subscriptionService.listSubscriptions({}, { take: 2000 });
  const forOrder = (allSubs ?? []).filter(
    (s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId
  );
  log(
    `Subscriptions in DB with metadata.order_id=${orderId}: count=${forOrder.length}` +
      (forOrder.length
        ? ` ids=${forOrder.map((s) => s.id).join(", ")}`
        : " (empty — order.placed subscriber likely did not run successfully on the environment that created this order)")
  );
}
