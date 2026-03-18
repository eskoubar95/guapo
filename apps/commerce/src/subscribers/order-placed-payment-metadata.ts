import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";

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

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  let stripePaymentMethodId: string | null = null;

  try {
    const { data: ordersWithPay } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "metadata", "payment_collections.id"],
      filters: { id: orderId },
    });
    const orderRow = (ordersWithPay as { id: string; customer_id?: string | null; metadata?: Record<string, unknown>; payment_collections?: Array<{ id: string }> }[])?.[0];
    if (!orderRow?.payment_collections?.length) return;
    const userId = orderRow.customer_id ?? orderId;

    const payColIds = orderRow.payment_collections.map((pc) => pc.id);
    const paymentModule = container.resolve(Modules.PAYMENT) as {
      listPayments: (
        f: Record<string, unknown>,
        c?: { take?: number }
      ) => Promise<Array<{ data?: Record<string, unknown>; provider_id?: string }>>;
    };
    const payments = await paymentModule.listPayments(
      { payment_collection_id: payColIds },
      { take: 20 }
    );
    const stripePayment = payments?.find(
      (p) =>
        p.provider_id === "pp_stripe_stripe" ||
        String(p?.provider_id ?? "").includes("stripe")
    );
    if (!stripePayment?.data) return;

    const d = stripePayment.data as Record<string, unknown>;
    stripePaymentMethodId = (d.payment_method as string) ?? (d.payment_method_id as string) ?? null;
    if (!stripePaymentMethodId) {
      const piId = (d.id as string) ?? (d.payment_intent as string);
      if (piId) {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_API_KEY!);
        const pi = await stripe.paymentIntents.retrieve(piId);
        stripePaymentMethodId =
          typeof pi.payment_method === "string"
            ? pi.payment_method
            : (pi.payment_method as { id?: string })?.id ?? null;
      }
    }
    if (!stripePaymentMethodId) return;

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_API_KEY!);
    const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
    const card = pm.card;
    if (!card?.last4) return;

    const payment_last4 = card.last4;
    const payment_brand =
      typeof card.brand === "string" ? card.brand : (card as { brand?: string }).brand ?? "";

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
    log(`[order-placed-payment-metadata] Order ${orderId}: set payment_last4=${payment_last4}, payment_brand=${payment_brand}`);
  } catch (err) {
    logWarn?.(
      `[order-placed-payment-metadata] Order ${orderId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
