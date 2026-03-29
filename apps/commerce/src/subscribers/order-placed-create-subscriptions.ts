import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { LinkDefinition } from "@medusajs/framework/types";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";

const DEFAULT_DISCOUNT_PERCENT = 5;
const ALLOWED_CYCLE_WEEKS = [4, 8, 12] as const;

function isAtomicIdempotencyConflict(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === "23505" &&
    (message.includes("idx_subscription_idempotency_key_unique") ||
      message.includes("subscription_idempotency_key"))
  );
}

function extractDeliveryDataFromShippingMethodData(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const servicePointId = data.service_point_id;
  if (typeof servicePointId !== "string" || servicePointId.trim() === "") return null;

  return {
    service_point_id: data.service_point_id ?? null,
    service_point_name: data.service_point_name ?? null,
    service_point_address: data.service_point_address ?? null,
    service_point_zipcode: data.service_point_zipcode ?? null,
    service_point_city: data.service_point_city ?? null,
    carrier_code: data.carrier_code ?? null,
    service_code: data.service_code ?? null,
  };
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
 * When an order is placed with subscription line items, create Subscription records.
 * Requires: customer_id (subscriptions need auth), stripe payment_method and customer from payment.
 */
export default async function orderPlacedCreateSubscriptions({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

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
    ],
    filters: { id: orderId },
  });

  const order = orders?.[0] as OrderWithItems | undefined;
  if (!order?.items?.length) return;

  const subscriptionItems = order.items.filter(
    (item) =>
      item?.metadata &&
      typeof (item.metadata as Record<string, unknown>).subscription_cycle === "number"
  );
  if (subscriptionItems.length === 0) return;

  if (!order.customer_id) {
    console.warn(
      "[order-placed-create-subscriptions] Order has subscription items but no customer_id. Subscriptions require auth."
    );
    return;
  }

  // Get Stripe payment_method and customer from the order's payment
  let stripeCustomerId: string | null = null;
  let stripePaymentMethodId: string | null = null;

  try {
    const { data: orderWithPayment } = await query.graph({
      entity: "order",
      fields: ["payment_collection.payments.id", "payment_collection.payments.data", "payment_collection.payments.provider_id"],
      filters: { id: orderId },
    });

    const orderPayment = (orderWithPayment as Array<{ payment_collection?: { payments?: Array<{ id: string; data?: Record<string, unknown>; provider_id?: string }> } }>)?.[0];
    const payments = orderPayment?.payment_collection?.payments ?? [];
    const stripePayment = payments.find(
      (p) => p.provider_id === "pp_stripe_stripe" || String(p.provider_id).includes("stripe")
    );

    if (stripePayment?.data) {
      const d = stripePayment.data as Record<string, unknown>;
      stripePaymentMethodId = (d.payment_method as string) ?? (d.payment_method_id as string) ?? null;
      stripeCustomerId = (d.customer as string) ?? (d.customer_id as string) ?? null;

      if (!stripePaymentMethodId) {
        const piId = (d.payment_intent as string) ?? (d.payment_intent_id as string);
        if (piId && process.env.STRIPE_API_KEY) {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_API_KEY);
          const pi = await stripe.paymentIntents.retrieve(piId as string);
          stripePaymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id ?? null;
          stripeCustomerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null;
        }
      }
    }
  } catch (err) {
    console.warn(
      "[order-placed-create-subscriptions] Could not get Stripe payment info:",
      err instanceof Error ? err.message : String(err)
    );
  }

  if (!stripeCustomerId || !stripePaymentMethodId) {
    console.warn(
      "[order-placed-create-subscriptions] Missing stripe_customer_id or stripe_payment_method_id. Subscription creation skipped."
    );
    return;
  }

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const existingForOrder = await subscriptionService.listSubscriptions({}, { take: 2000 }).then((list) =>
    (list ?? []).filter((s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId)
  );
  const existingLineItemIds = new Set(
    existingForOrder
      .map((s) => (s.metadata as Record<string, unknown> | null)?.line_item_id)
      .filter((lineItemId): lineItemId is string => typeof lineItemId === "string" && lineItemId.length > 0)
  );
  const shippingOptionId = order.shipping_methods?.[0]?.shipping_option_id ?? "";
  const deliveryData = extractDeliveryDataFromShippingMethodData(
    order.shipping_methods?.[0]?.data ?? undefined
  );

  const now = new Date();
  for (const item of subscriptionItems) {
    try {
      if (!item.id || existingLineItemIds.has(item.id)) {
        continue;
      }
      const idempotencyKey = `${orderId}:${item.id}`;
      const existingForKey = await subscriptionService.retrieveByIdempotencyKey(idempotencyKey);
      if (existingForKey?.id) {
        existingLineItemIds.add(item.id);
        continue;
      }

      const cycleWeeks = (item.metadata as Record<string, unknown>)?.subscription_cycle as number;
      if (
        typeof cycleWeeks !== "number" ||
        !Number.isInteger(cycleWeeks) ||
        cycleWeeks <= 0
      ) {
        console.warn(
          `[order-placed-create-subscriptions] Invalid cycle_weeks (${cycleWeeks}) for item ${item.id}, skipping.`
        );
        continue;
      }
      if (!(ALLOWED_CYCLE_WEEKS as readonly number[]).includes(cycleWeeks)) {
        continue;
      }

      const variantId = item.variant_id;
      const quantity = item.quantity ?? 1;

      let discountPercent = DEFAULT_DISCOUNT_PERCENT;
      const product = item.variant?.product;
      if (product?.metadata) {
        const pct = (product.metadata as Record<string, unknown>).subscription_discount_percent;
        if (typeof pct === "number") discountPercent = pct;
      }

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
      }
    } catch (err) {
      if (isAtomicIdempotencyConflict(err)) {
        const idempotencyKey = `${orderId}:${item.id}`;
        const existing = await subscriptionService.retrieveByIdempotencyKey(idempotencyKey);
        if (existing?.id) {
          existingLineItemIds.add(item.id);
          continue;
        }
      }
      console.error(
        `[order-placed-create-subscriptions] Failed to create subscription for line item ${item.id}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
