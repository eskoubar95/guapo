import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { LinkDefinition } from "@medusajs/framework/types";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";

const DEFAULT_DISCOUNT_PERCENT = 5
const ALLOWED_CYCLE_WEEKS = [4, 8, 12] as const

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
  const orderId = event?.data?.id
  if (!orderId) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as { info?: (m: string) => void; warn?: (m: string) => void; error?: (m: string) => void } | undefined
  const log = (msg: string) => logger?.info?.(msg) ?? console.log(`[order-placed-create-subscriptions] ${msg}`)
  const logWarn = (msg: string) => logger?.warn?.(msg) ?? console.warn(`[order-placed-create-subscriptions] ${msg}`)
  const logErr = (msg: string) => logger?.error?.(msg) ?? console.error(`[order-placed-create-subscriptions] ${msg}`)

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

  const order = orders?.[0] as OrderWithItems | undefined
  if (!order?.items?.length) return

  const subscriptionItems = order.items.filter(
    (item) =>
      item?.metadata &&
      typeof (item.metadata as Record<string, unknown>).subscription_cycle === "number"
  )
  if (subscriptionItems.length === 0) return

  log(`Order ${orderId}: ${subscriptionItems.length} subscription line item(s) found`)

  if (!order.customer_id || String(order.customer_id).trim() === "") {
    logWarn("Order has subscription items but no customer_id. Subscriptions require auth. Skipping subscription creation.")
    return
  }

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const existingForOrder = await subscriptionService.listSubscriptions({}, { take: 200 }).then((list) =>
    (list ?? []).filter((s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId)
  );
  if (existingForOrder.length > 0) {
    log(`Order ${orderId} already has ${existingForOrder.length} subscription(s) linked. Skipping (idempotent).`);
    return;
  }

  // Get Stripe payment_method and customer from payment data.
  // The order↔payment_collection link lives in medusa.order_payment_collection.
  // query.graph on order with "payment_collections.*" resolves the link correctly.
  let stripeCustomerId: string | null = null;
  let stripePaymentMethodId: string | null = null;

  try {
    // 1) Fetch payment_collection ids via the linked field (plural: payment_collections).
    const { data: ordersWithPay } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.id"],
      filters: { id: orderId },
    });
    type OrderWithPayCols = { id: string; payment_collections?: Array<{ id: string }> };
    const payColIds = (ordersWithPay as OrderWithPayCols[])?.[0]?.payment_collections?.map((pc) => pc.id) ?? [];
    log(`Payment collections for order: [${payColIds.join(", ")}]`)
    if (payColIds.length === 0) {
      logWarn("No payment_collections linked to order.")
      throw new Error("No payment_collection")
    }

    // 2) Load payments via Payment module (avoids provider strategy resolution issues).
    type PaymentModuleType = {
      listPayments: (filters: Record<string, unknown>, config?: { take?: number }) => Promise<Array<{ id: string; data?: Record<string, unknown>; provider_id?: string }>>;
    };
    const paymentModule = container.resolve(Modules.PAYMENT) as PaymentModuleType;
    const payments = await paymentModule.listPayments(
      { payment_collection_id: payColIds },
      { take: 50 },
    );
    log(`Found ${payments?.length ?? 0} payment(s) across ${payColIds.length} collection(s)`)
    const stripePayment = payments?.find(
      (p) => p.provider_id === "pp_stripe_stripe" || String(p?.provider_id ?? "").includes("stripe")
    );

    if (stripePayment?.data) {
      const d = stripePayment.data as Record<string, unknown>;
      stripePaymentMethodId = (d.payment_method as string) ?? (d.payment_method_id as string) ?? null;
      stripeCustomerId = (d.customer as string) ?? (d.customer_id as string) ?? null;
      log(`Stripe payment found: customer=${stripeCustomerId}, pm=${stripePaymentMethodId}`)

      if (!stripePaymentMethodId) {
        const piId = (d.id as string) ?? (d.payment_intent as string);
        if (piId && process.env.STRIPE_API_KEY) {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_API_KEY);
          const pi = await stripe.paymentIntents.retrieve(piId);
          stripePaymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id ?? null;
          stripeCustomerId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null;
          log(`Fetched from Stripe API: customer=${stripeCustomerId}, pm=${stripePaymentMethodId}`)
        }
      }
    } else {
      logWarn("No Stripe payment found in payment collections.")
    }
  } catch (err) {
    logWarn(`Could not get Stripe payment info: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!stripeCustomerId || !stripePaymentMethodId) {
    logWarn("Missing stripe_customer_id or stripe_payment_method_id. Subscription creation skipped. Ensure STRIPE_API_KEY is set and payment used Stripe.")
    return
  }

  const shippingOptionId = order.shipping_methods?.[0]?.shipping_option_id ?? "";

  const now = new Date();
  for (const item of subscriptionItems) {
    try {
      const cycleWeeks = (item.metadata as Record<string, unknown>)?.subscription_cycle as number
      if (typeof cycleWeeks !== "number" || !Number.isInteger(cycleWeeks) || cycleWeeks <= 0) {
        logWarn(`Invalid cycle_weeks (${cycleWeeks}) for item ${item.id}, skipping.`)
        continue
      }
      if (!(ALLOWED_CYCLE_WEEKS as readonly number[]).includes(cycleWeeks)) {
        logWarn(`Cycle ${cycleWeeks} not in allowed [4,8,12] for item ${item.id}, skipping.`)
        continue
      }

      const variantId = item.variant_id;
      const quantity = item.quantity ?? 1;

      // Read discount from SUBSCRIPTION-5PCT promotion, fall back to product metadata or default
      let discountPercent = DEFAULT_DISCOUNT_PERCENT;
      try {
        const promoModule = container.resolve(Modules.PROMOTION) as {
          listPromotions: (f: { code?: string[] }, c?: { take?: number; relations?: string[] }) => Promise<Array<{ application_method?: { value?: number } | null }>>;
        };
        const promos = await promoModule.listPromotions(
          { code: ["SUBSCRIPTION-5PCT"] },
          { take: 1, relations: ["application_method"] }
        );
        const promoValue = promos?.[0]?.application_method?.value;
        if (typeof promoValue === "number" && promoValue > 0) {
          discountPercent = promoValue;
        }
      } catch {
        /* use default */
      }
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
          shipping_option_id: shippingOptionId,
          metadata: { order_id: orderId, line_item_id: item.id },
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
        log(`Created subscription ${created.id} for order ${orderId} line item ${item.id} (cycle ${cycleWeeks} weeks)`)
      }
    } catch (err) {
      logErr(`Failed to create subscription for line item ${item.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
