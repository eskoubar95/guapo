import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { resolveLink, resolveOrderModule, resolveQuery } from "../../lib/container-types";
import { resolveDiscountPercentForRenewal } from "../../lib/subscription-discount";
import { buildRenewalOrderCreateInput } from "../../lib/subscription-renewal/build-renewal-order";
import { chargeStripeSubscriptionRenewal } from "../../lib/subscription-renewal/charge-stripe-renewal";
import { resolveRenewalPricingFromInitialOrder } from "../../lib/subscription-renewal/resolve-renewal-price";
import { SUBSCRIPTION_MODULE } from "../../modules/subscription";
import type SubscriptionModuleService from "../../modules/subscription/service";

export type RunSubscriptionRenewalInput = { subscriptionId: string };

export type RunSubscriptionRenewalOutput = {
  renewed: boolean;
  orderId?: string;
  error?: string;
  retryCount?: number;
  skipped?: boolean;
};

const FREE_SHIPPING_THRESHOLD_DKK = 499;
const SHIPPING_FLAT_DKK = 39;
const STRIPE_DKK_MINIMUM_ORE = 250;

export const runSubscriptionRenewalStep = createStep(
  "run-subscription-renewal",
  async (
    { subscriptionId }: RunSubscriptionRenewalInput,
    { container }
  ): Promise<StepResponse<RunSubscriptionRenewalOutput>> => {
    const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
    const link = resolveLink(container);
    const query = resolveQuery(container);

    const regionModule = container.resolve(Modules.REGION) as {
      listRegions: (f: { currency_code?: string }) => Promise<Array<{ id: string; currency_code: string }>>;
    };
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL) as {
      listSalesChannels: (f?: object) => Promise<Array<{ id: string }>>;
    };
    const productModule = container.resolve(Modules.PRODUCT) as {
      listProductVariants: (
        f: Record<string, unknown>,
        config?: { relations?: string[] }
      ) => Promise<
        Array<{
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
        }>
      >;
    };
    const customerModule = container.resolve(Modules.CUSTOMER) as {
      retrieveCustomer: (id: string) => Promise<{
        id: string;
        email: string;
        first_name?: string | null;
        last_name?: string | null;
      }>;
    };

    const sub = await subscriptionService.retrieveSubscription(subscriptionId);
    if (!sub) throw new Error("Subscription not found");

    if (sub.skip_next) {
      await subscriptionService.updateSubscriptions([{ id: subscriptionId, skip_next: false }]);
      await subscriptionService.advanceNextRenewal(subscriptionId);
      return new StepResponse({
        renewed: false,
        skipped: true,
      });
    }

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

    const initialOrderId = (sub.metadata as Record<string, unknown> | null)?.order_id as string | undefined;
    const { rawPriceDkk, origIsTaxInclusive, origTaxLines } =
      await resolveRenewalPricingFromInitialOrder(query, initialOrderId, sub.variant_id);

    if (rawPriceDkk === 0) {
      throw new Error(
        `Could not get unit price for subscription ${subscriptionId}. ` +
          `Initial order ${initialOrderId ?? "unknown"} may be missing or have no line item for variant ${sub.variant_id}.`
      );
    }

    const discountPercent = await resolveDiscountPercentForRenewal(container, sub.discount_percent);
    const discount = discountPercent / 100;
    const unitPriceDkk = rawPriceDkk * (1 - discount);
    const itemsTotalDkk = unitPriceDkk * (sub.quantity ?? 1);
    const shippingDkk =
      itemsTotalDkk > 0 && itemsTotalDkk < FREE_SHIPPING_THRESHOLD_DKK ? SHIPPING_FLAT_DKK : 0;
    const totalDkk = itemsTotalDkk + shippingDkk;
    const stripeAmountOre = Math.round(totalDkk * 100);

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

    const chargeResult = await chargeStripeSubscriptionRenewal({
      stripeAmountOre,
      stripeCustomerId: sub.stripe_customer_id,
      stripePaymentMethodId: sub.stripe_payment_method_id,
      subscriptionId,
      subRetryCount: sub.retry_count ?? 0,
      subscriptionService,
    });

    if (!chargeResult.ok) {
      return new StepResponse({
        renewed: false,
        error: chargeResult.error,
        retryCount: chargeResult.retryCount,
      });
    }

    const [region] = await regionModule.listRegions({ currency_code: "dkk" });
    const [salesChannel] = await salesChannelModule.listSalesChannels({});
    if (!region || !salesChannel) throw new Error("Region or sales channel not found");

    const shippingAddr = (sub.shipping_address ?? {}) as Record<string, unknown>;
    const billingAddr = (sub.billing_address ?? {}) as Record<string, unknown>;

    const resolvedEmail =
      customerEmail || (shippingAddr.email as string) || `customer-${sub.customer_id}@subscription.local`;
    const resolvedFirstName = customerFirstName || (shippingAddr.first_name as string) || "";
    const resolvedLastName = customerLastName || (shippingAddr.last_name as string) || "";

    const createOrderInput = buildRenewalOrderCreateInput({
      regionId: region.id,
      salesChannelId: salesChannel.id,
      customerId: sub.customer_id,
      currencyCode: region.currency_code ?? "dkk",
      email: resolvedEmail,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      shippingAddr,
      billingAddr,
      variantId: sub.variant_id,
      quantity: sub.quantity ?? 1,
      unitPriceDkk,
      rawPriceDkk,
      product: product ?? null,
      variant: variant ?? null,
      origIsTaxInclusive,
      origTaxLines,
      shippingOptionId: sub.shipping_option_id,
      shippingDkk,
      subscriptionId,
      cycleWeeks: sub.cycle_weeks,
      stripePaymentIntentId: chargeResult.stripePaymentIntentId,
      nextRenewalAt: sub.next_renewal_at,
    });

    const orderModule = resolveOrderModule(container);
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
