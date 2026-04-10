import type { LinkDefinition, MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { resolveQuery } from "./container-types";
import { resolveStripeCustomerAndPaymentMethodFromOrder } from "./stripe-helpers";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { getSubscriptionDiscountPercentWithProductOverride } from "./subscription-discount";
import { extractDeliveryDataFromShippingMethodData } from "./subscription-delivery-data";
import { getSubscriptionCycleWeeksFromMetadata } from "./subscription-cycle-metadata";

const ALLOWED_CYCLE_WEEKS = [4, 8, 12] as const;
const LOG_PREFIX = "[create-subscriptions-from-placed-order]";

function isAtomicIdempotencyConflict(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === "23505" &&
    (message.includes("idx_subscription_idempotency_key_unique") ||
      message.includes("subscription_idempotency_key"))
  );
}

type OrderWithItems = {
  id: string;
  customer_id: string | null;
  shipping_address?: Record<string, unknown> | null;
  billing_address?: Record<string, unknown> | null;
  items?: Array<{
    id: string;
    variant_id: string;
    quantity: number;
    metadata?: Record<string, unknown> | null;
    variant?: {
      product?: {
        id: string;
        metadata?: Record<string, unknown> | null;
      } | null;
    } | null;
  }> | null;
  shipping_methods?: Array<{
    shipping_option_id?: string;
    data?: Record<string, unknown> | null;
  }> | null;
};

/**
 * Creates Subscription rows + order links for subscription line items on a placed order.
 * Idempotent. Used by order.placed subscribers and must run in the same process as transactional
 * emails when possible (see order-placed-transactional-documents).
 */
export async function createSubscriptionsForPlacedOrder(
  container: MedusaContainer,
  orderId: string
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as
    | { info?: (m: string) => void; warn?: (m: string) => void; error?: (m: string) => void }
    | undefined;
  const log = (msg: string) =>
    logger?.info?.(`${LOG_PREFIX} ${msg}`) ?? console.log(`${LOG_PREFIX} ${msg}`);
  const logWarn = (msg: string) =>
    logger?.warn?.(`${LOG_PREFIX} ${msg}`) ?? console.warn(`${LOG_PREFIX} ${msg}`);
  const logErr = (msg: string) =>
    logger?.error?.(`${LOG_PREFIX} ${msg}`) ?? console.error(`${LOG_PREFIX} ${msg}`);

  const query = resolveQuery(container);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "shipping_address",
      "billing_address",
      "items.id",
      "items.variant_id",
      "items.quantity",
      "items.metadata",
      "items.variant.product.id",
      "items.variant.product.metadata",
      "shipping_methods.shipping_option_id",
      "shipping_methods.data",
    ],
    filters: { id: orderId },
  });

  const order = orders?.[0] as OrderWithItems | undefined;
  if (!order?.items?.length) return;

  const subscriptionItems = order.items.filter(
    (item) =>
      getSubscriptionCycleWeeksFromMetadata(
        item.metadata as Record<string, unknown> | null | undefined
      ) > 0
  );
  if (subscriptionItems.length === 0) return;

  log(`Order ${orderId}: ${subscriptionItems.length} subscription line item(s) found`);

  if (!order.customer_id || String(order.customer_id).trim() === "") {
    logWarn(
      "Order has subscription items but no customer_id. Subscriptions require auth. Skipping subscription creation."
    );
    return;
  }

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const existingForOrder = await subscriptionService
    .listSubscriptions({}, { take: 2000 })
    .then((list) =>
      (list ?? []).filter((s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId)
    );
  const existingLineItemIds = new Set(
    existingForOrder
      .map((s) => (s.metadata as Record<string, unknown> | null)?.line_item_id)
      .filter((lineItemId): lineItemId is string => typeof lineItemId === "string" && lineItemId.length > 0)
  );
  if (existingForOrder.length > 0) {
    log(
      `Order ${orderId} already has ${existingForOrder.length} subscription(s). ` +
        `Will only create missing line items (idempotent).`
    );
  }

  let stripeCustomerId: string | null = null;
  let stripePaymentMethodId: string | null = null;

  try {
    const resolved = await resolveStripeCustomerAndPaymentMethodFromOrder(container, orderId, 50);
    stripeCustomerId = resolved.customerId;
    stripePaymentMethodId = resolved.paymentMethodId;
    log(`Payment collections for order: [${resolved.payColIds.join(", ")}]`);
    if (resolved.payColIds.length === 0) {
      logWarn("No payment_collections linked to order.");
    } else {
      log(`Found Stripe resolution: customer=${stripeCustomerId}, pm=${stripePaymentMethodId}`);
    }
    if (resolved.payColIds.length > 0 && !stripePaymentMethodId) {
      logWarn("No Stripe payment found in payment collections.");
    }
  } catch (err) {
    logWarn(
      `Could not get Stripe payment info: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!stripeCustomerId || !stripePaymentMethodId) {
    logWarn(
      "Missing stripe_customer_id or stripe_payment_method_id. Subscription creation skipped. Ensure STRIPE_API_KEY is set and payment used Stripe."
    );
    return;
  }

  const firstMethod = order.shipping_methods?.[0];
  const shippingOptionId = firstMethod?.shipping_option_id ?? "";
  const deliveryData = extractDeliveryDataFromShippingMethodData(firstMethod?.data ?? undefined);

  const now = new Date();
  for (const item of subscriptionItems) {
    try {
      if (!item.id || existingLineItemIds.has(item.id)) {
        log(`Skipping already-processed subscription line item ${item.id} on order ${orderId}`);
        continue;
      }
      const idempotencyKey = `${orderId}:${item.id}`;

      const existingForKey = await subscriptionService.retrieveByIdempotencyKey(idempotencyKey);
      if (existingForKey?.id) {
        existingLineItemIds.add(item.id);
        log(
          `Subscription already exists for idempotency_key=${idempotencyKey} ` +
            `(subscription ${existingForKey.id}). Skipping create.`
        );
        continue;
      }

      const cycleWeeks = getSubscriptionCycleWeeksFromMetadata(
        item.metadata as Record<string, unknown> | null | undefined
      );
      if (!Number.isInteger(cycleWeeks) || cycleWeeks <= 0) {
        throw new Error(`Invalid cycle_weeks (${cycleWeeks}) for item ${item.id}.`);
      }
      if (!(ALLOWED_CYCLE_WEEKS as readonly number[]).includes(cycleWeeks)) {
        throw new Error(`Cycle ${cycleWeeks} not in allowed [4,8,12] for item ${item.id}.`);
      }

      const variantId = item.variant_id;
      const quantity = item.quantity ?? 1;

      const product = item.variant?.product;
      const discountPercent = await getSubscriptionDiscountPercentWithProductOverride(
        container,
        product?.metadata as Record<string, unknown> | null | undefined
      );

      const nextRenewal = new Date(now);
      nextRenewal.setDate(nextRenewal.getDate() + cycleWeeks * 7);

      const [created] = await subscriptionService.createSubscriptions([
        {
          customer_id: order.customer_id,
          status: "active",
          cycle_weeks: cycleWeeks,
          next_renewal_at: nextRenewal,
          last_renewal_at: null,
          delivery_count: 1,
          stripe_customer_id: stripeCustomerId,
          stripe_payment_method_id: stripePaymentMethodId,
          discount_percent: discountPercent,
          variant_id: variantId,
          quantity,
          shipping_address: order.shipping_address ?? {},
          billing_address: order.billing_address ?? {},
          delivery_data: deliveryData,
          shipping_option_id: shippingOptionId,
          idempotency_key: idempotencyKey,
          last_renewal_order_id: orderId,
          metadata: { order_id: orderId, line_item_id: item.id, idempotency_key: idempotencyKey },
        },
      ]);

      if (created?.id) {
        const link = container.resolve<{
          create: (links: LinkDefinition[]) => Promise<unknown>;
        }>(ContainerRegistrationKeys.LINK);
        await link.create([
          {
            [SUBSCRIPTION_MODULE]: { subscription_id: created.id },
            [Modules.ORDER]: { order_id: orderId },
          },
        ]);
        existingLineItemIds.add(item.id);
        log(
          `Created subscription ${created.id} for order ${orderId} line item ${item.id} (cycle ${cycleWeeks} weeks)`
        );
      }
    } catch (err) {
      if (isAtomicIdempotencyConflict(err)) {
        const idempotencyKey = `${orderId}:${item.id}`;
        const existing = await subscriptionService.retrieveByIdempotencyKey(idempotencyKey);
        if (existing?.id) {
          existingLineItemIds.add(item.id);
          log(
            `Atomic idempotency conflict for ${idempotencyKey}; using existing subscription ${existing.id}.`
          );
          continue;
        }
      }
      logErr(
        `Failed to create subscription for line item ${item.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

/**
 * Returns subscriptions whose metadata.order_id matches (for gating emails).
 */
export async function listSubscriptionsForOrder(
  container: MedusaContainer,
  orderId: string
): Promise<Array<{ id: string }>> {
  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const list = await subscriptionService.listSubscriptions({}, { take: 2000 });
  return (list ?? []).filter(
    (s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId
  );
}
