import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import Stripe from "stripe";
import {
  SUBSCRIPTION_MODULE,
} from "../../modules/subscription";
import type SubscriptionModuleService from "../../modules/subscription/service";

export type RunSubscriptionRenewalInput = { subscriptionId: string };

export type RunSubscriptionRenewalOutput = {
  renewed: boolean;
  orderId?: string;
  error?: string;
  retryCount?: number;
  skipped?: boolean;
};

export const runSubscriptionRenewalStep = createStep(
  "run-subscription-renewal",
  async (
    { subscriptionId }: RunSubscriptionRenewalInput,
    { container }
  ): Promise<StepResponse<RunSubscriptionRenewalOutput>> => {
    const subscriptionService = container.resolve<SubscriptionModuleService>(
      SUBSCRIPTION_MODULE
    );
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (links: Array<Record<string, Record<string, string>>>) => Promise<unknown>;
    };
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
      graph: (opts: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>;
    };
    const regionModule = container.resolve(Modules.REGION) as {
      listRegions: (f: { currency_code?: string }) => Promise<Array<{ id: string; currency_code: string }>>;
    };
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL) as {
      listSalesChannels: (f?: object) => Promise<Array<{ id: string }>>;
    };
    const productModule = container.resolve(Modules.PRODUCT) as {
      listProductVariants: (f: Record<string, unknown>, config?: { relations?: string[] }) => Promise<Array<{
        id: string;
        title?: string;
        sku?: string;
        barcode?: string;
        product?: {
          id: string;
          title?: string;
          description?: string;
          subtitle?: string;
          thumbnail?: string | null;
          handle?: string;
          collection?: { title?: string } | null;
          type?: { value?: string } | null;
        };
      }>>;
    };
    const customerModule = container.resolve(Modules.CUSTOMER) as {
      retrieveCustomer: (id: string) => Promise<{
        id: string;
        email: string;
        first_name?: string | null;
        last_name?: string | null;
      }>;
    };
    const promotionModule = container.resolve(Modules.PROMOTION) as {
      listPromotions: (
        filters: { code?: string[] },
        config?: { take?: number; relations?: string[] }
      ) => Promise<
        Array<{ id: string; application_method?: { value?: number } | null }>
      >;
    };

    const sub = await subscriptionService.retrieveSubscription(subscriptionId);
    if (!sub) throw new Error("Subscription not found");

    if (sub.skip_next) {
      await subscriptionService.updateSubscriptions([
        { id: subscriptionId, skip_next: false },
      ]);
      await subscriptionService.advanceNextRenewal(subscriptionId);
      return new StepResponse({
        renewed: false,
        skipped: true,
      });
    }

    // Fetch customer details for proper email/name on the renewal order
    let customerEmail = "";
    let customerFirstName = "";
    let customerLastName = "";
    try {
      const customer = await customerModule.retrieveCustomer(sub.customer_id);
      customerEmail = customer.email ?? "";
      customerFirstName = customer.first_name ?? "";
      customerLastName = customer.last_name ?? "";
    } catch {
      /* fallback handled below */
    }

    // Medusa stores order_line_item.unit_price in major units (DKK) as a decimal value (e.g. 112.5).
    // We work in DKK throughout and only convert to øre (× 100) for Stripe.
    const initialOrderId = (sub.metadata as Record<string, unknown> | null)?.order_id as string | undefined;
    let rawPriceDkk = 0;
    let origIsTaxInclusive = false;
    let origTaxLines: Array<{ description: string; tax_rate_id: string | null; code: string; rate: number; provider_id: string }> = [];
    if (initialOrderId) {
      try {
        const { data: orders } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "items.variant_id",
            "items.unit_price",
            "items.is_tax_inclusive",
            "items.tax_lines.description",
            "items.tax_lines.tax_rate_id",
            "items.tax_lines.code",
            "items.tax_lines.rate",
            "items.tax_lines.provider_id",
          ],
          filters: { id: initialOrderId },
        });
        type OrigLineItem = {
          variant_id: string;
          unit_price: number | string;
          is_tax_inclusive?: boolean;
          tax_lines?: Array<{ description: string; tax_rate_id: string | null; code: string; rate: number | string; provider_id: string }>;
        };
        const order = orders?.[0] as { items?: OrigLineItem[] } | undefined;
        const line = order?.items?.find((i) => i.variant_id === sub.variant_id);
        if (line && line.unit_price !== undefined && line.unit_price !== null) {
          const p = typeof line.unit_price === "string" ? parseFloat(line.unit_price) : line.unit_price;
          if (!isNaN(p) && p > 0) {
            rawPriceDkk = p;
          }
          origIsTaxInclusive = line.is_tax_inclusive === true;
          if (line.tax_lines && line.tax_lines.length > 0) {
            origTaxLines = line.tax_lines.map((tl) => ({
              description: tl.description || "Moms",
              tax_rate_id: tl.tax_rate_id ?? null,
              code: tl.code || "",
              rate: typeof tl.rate === "string" ? parseFloat(tl.rate) : (tl.rate ?? 25),
              provider_id: tl.provider_id || "system",
            }));
          }
        }
      } catch {
        /* ignore */
      }
    }

    // Default 25% Moms tax line if original had none
    if (origTaxLines.length === 0) {
      origTaxLines = [{ description: "Moms", tax_rate_id: null, code: "", rate: 25, provider_id: "system" }];
    }

    if (rawPriceDkk === 0) {
      throw new Error(
        `Could not get unit price for subscription ${subscriptionId}. ` +
        `Initial order ${initialOrderId ?? "unknown"} may be missing or have no line item for variant ${sub.variant_id}.`
      );
    }

    // Read discount from SUBSCRIPTION-5PCT promotion; fall back to subscription record / default
    let discountPercent = sub.discount_percent ?? 5;
    try {
      const promos = await promotionModule.listPromotions(
        { code: ["SUBSCRIPTION-5PCT"] },
        { take: 1, relations: ["application_method"] }
      );
      const promoValue = promos?.[0]?.application_method?.value;
      if (typeof promoValue === "number" && promoValue > 0) {
        discountPercent = promoValue;
      }
    } catch {
      /* use fallback */
    }
    const discount = discountPercent / 100;
    const unitPriceDkk = rawPriceDkk * (1 - discount);
    const itemsTotalDkk = unitPriceDkk * (sub.quantity ?? 1);

    // Free shipping threshold: 499 DKK. Below that, flat rate 39 DKK.
    const FREE_SHIPPING_THRESHOLD_DKK = 499;
    const SHIPPING_FLAT_DKK = 39;
    const shippingDkk = itemsTotalDkk > 0 && itemsTotalDkk < FREE_SHIPPING_THRESHOLD_DKK
      ? SHIPPING_FLAT_DKK
      : 0;
    const totalDkk = itemsTotalDkk + shippingDkk;

    // Convert to øre for Stripe. Stripe DKK minimum is 2.50 DKK (250 øre).
    const stripeAmountOre = Math.round(totalDkk * 100);
    const STRIPE_DKK_MINIMUM_ORE = 250;
    if (stripeAmountOre < STRIPE_DKK_MINIMUM_ORE) {
      throw new Error(
        `Charge amount ${stripeAmountOre} øre (${totalDkk.toFixed(2)} DKK) is below Stripe's DKK minimum of 2.50 DKK.`
      );
    }

    const variants = await productModule.listProductVariants(
      { id: sub.variant_id },
      { relations: ["product"] }
    );
    const variant = variants?.[0];
    const product = variant?.product;

    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) throw new Error("STRIPE_API_KEY not set");

    const stripe = new Stripe(apiKey);
    let chargeSuccess = false;
    let stripePaymentIntentId: string | null = null;
    try {
      const pi = await stripe.paymentIntents.create({
        amount: stripeAmountOre,
        currency: "dkk",
        customer: sub.stripe_customer_id,
        payment_method: sub.stripe_payment_method_id,
        confirm: true,
        off_session: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      stripePaymentIntentId = pi.id;
      chargeSuccess = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await subscriptionService.setRetryState(
        subscriptionId,
        (sub.retry_count ?? 0) + 1,
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      if ((sub.retry_count ?? 0) >= 2) {
        await subscriptionService.setOnHold(subscriptionId);
      }
      return new StepResponse({
        renewed: false,
        error: msg,
        retryCount: (sub.retry_count ?? 0) + 1,
      });
    }

    if (!chargeSuccess) {
      return new StepResponse({ renewed: false });
    }

    const [region] = await regionModule.listRegions({ currency_code: "dkk" });
    const [salesChannel] = await salesChannelModule.listSalesChannels({});
    if (!region || !salesChannel)
      throw new Error("Region or sales channel not found");

    const shippingAddr = (sub.shipping_address ?? {}) as Record<string, unknown>;
    const billingAddr = (sub.billing_address ?? {}) as Record<string, unknown>;

    const resolvedEmail = customerEmail
      || (shippingAddr.email as string)
      || `customer-${sub.customer_id}@subscription.local`;

    const resolvedFirstName = customerFirstName
      || (shippingAddr.first_name as string)
      || "";
    const resolvedLastName = customerLastName
      || (shippingAddr.last_name as string)
      || "";

    const createOrderInput = {
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      customer_id: sub.customer_id,
      currency_code: region.currency_code ?? "dkk",
      email: resolvedEmail,
      shipping_address: {
        first_name: resolvedFirstName || "Customer",
        last_name: resolvedLastName || ".",
        address_1: (shippingAddr.address_1 as string) || "",
        city: (shippingAddr.city as string) || "",
        postal_code: (shippingAddr.postal_code as string) || "",
        country_code: (shippingAddr.country_code as string) || "dk",
        phone: shippingAddr.phone as string,
      },
      billing_address: {
        first_name: resolvedFirstName || "Customer",
        last_name: resolvedLastName || ".",
        address_1: (billingAddr.address_1 as string) || "",
        city: (billingAddr.city as string) || "",
        postal_code: (billingAddr.postal_code as string) || "",
        country_code: (billingAddr.country_code as string) || "dk",
        phone: billingAddr.phone as string,
      },
      items: [
        {
          variant_id: sub.variant_id,
          quantity: sub.quantity ?? 1,
          unit_price: unitPriceDkk,
          compare_at_unit_price: rawPriceDkk,
          title: product?.title || variant?.title || "Subscription renewal",
          thumbnail: product?.thumbnail || null,
          product_id: product?.id || null,
          product_title: product?.title || null,
          product_description: product?.description || null,
          product_subtitle: product?.subtitle || null,
          product_handle: product?.handle || null,
          variant_title: variant?.title || null,
          variant_sku: variant?.sku || null,
          variant_barcode: variant?.barcode || null,
          is_tax_inclusive: origIsTaxInclusive,
          is_discountable: true,
          requires_shipping: true,
          tax_lines: origTaxLines,
          metadata: {
            is_subscription_line: true,
            subscription_cycle: sub.cycle_weeks,
          },
        },
      ],
      shipping_methods: sub.shipping_option_id
        ? [
            {
              shipping_option_id: sub.shipping_option_id,
              name: "Standard",
              amount: shippingDkk,
              tax_lines: origTaxLines.map((tl) => ({
                ...tl,
                description: `Fragt ${tl.description}`,
              })),
            },
          ]
        : [],
      metadata: {
        subscription_id: subscriptionId,
        renewal: true,
        subscription_cycle: sub.cycle_weeks,
        stripe_payment_intent_id: stripePaymentIntentId,
        requested_fulfillment_at: sub.next_renewal_at
          ? new Date(sub.next_renewal_at).toISOString()
          : new Date().toISOString(),
      },
    };

    const orderModule = container.resolve(Modules.ORDER) as {
      createOrders: (data: unknown[]) => Promise<Array<{ id: string }>>;
    };
    const [order] = await orderModule.createOrders([
      {
        ...createOrderInput,
        status: "pending",
        payment_status: "captured",
      },
    ]);
    if (!order?.id) throw new Error("Order creation failed");

    await link.create([
      {
        [SUBSCRIPTION_MODULE]: { subscription_id: subscriptionId },
        [Modules.ORDER]: { order_id: order.id },
      },
    ]);

    await subscriptionService.incrementDeliveryCount(subscriptionId);
    await subscriptionService.advanceNextRenewal(subscriptionId);
    await subscriptionService.clearRetryState(subscriptionId);

    return new StepResponse({
      renewed: true,
      orderId: order.id,
    });
  }
);
