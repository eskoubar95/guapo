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
    const regionModule = container.resolve(Modules.REGION) as {
      listRegions: (f: { currency_code?: string }) => Promise<Array<{ id: string; currency_code: string }>>;
    };
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL) as {
      listSalesChannels: (f?: object) => Promise<Array<{ id: string }>>;
    };
    const productModule = container.resolve(Modules.PRODUCT) as {
      listProductVariants: (f: Record<string, unknown>) => Promise<Array<{
        id: string;
        calculated_price?: { calculated_amount: number };
        product?: { id: string; title?: string };
      }>>;
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

    const variants = await productModule.listProductVariants({
      id: sub.variant_id,
    });
    const variant = variants?.[0];
    if (!variant) throw new Error("Variant not found");

    const rawPrice = variant.calculated_price?.calculated_amount ?? 0;
    const discount = (sub.discount_percent ?? 5) / 100;
    const unitPrice = Math.round(rawPrice * (1 - discount));
    const totalAmount = unitPrice * (sub.quantity ?? 1);

    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) throw new Error("STRIPE_API_KEY not set");

    const stripe = new Stripe(apiKey);
    let chargeSuccess = false;
    try {
      await stripe.paymentIntents.create({
        amount: Math.round(totalAmount / 100) * 100,
        currency: "dkk",
        customer: sub.stripe_customer_id,
        payment_method: sub.stripe_payment_method_id,
        confirm: true,
        off_session: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
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

    const createOrderInput = {
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      customer_id: sub.customer_id,
      currency_code: region.currency_code ?? "dkk",
      email:
        (shippingAddr.email as string) ||
        `customer-${sub.customer_id}@subscription.local`,
      shipping_address: {
        first_name: (shippingAddr.first_name as string) || "Customer",
        last_name: (shippingAddr.last_name as string) || ".",
        address_1: (shippingAddr.address_1 as string) || "",
        city: (shippingAddr.city as string) || "",
        postal_code: (shippingAddr.postal_code as string) || "",
        country_code: (shippingAddr.country_code as string) || "dk",
        phone: shippingAddr.phone as string,
      },
      billing_address: {
        first_name: (billingAddr.first_name as string) || "Customer",
        last_name: (billingAddr.last_name as string) || ".",
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
          unit_price: unitPrice,
          title:
            (variant.product?.title as string) || "Subscription renewal",
        },
      ],
      shipping_methods: sub.shipping_option_id
        ? [
            {
              shipping_option_id: sub.shipping_option_id,
              name: "Standard",
              amount: 0,
            },
          ]
        : [],
      metadata: { subscription_id: subscriptionId, renewal: true },
    };

    const orderModule = container.resolve(Modules.ORDER) as {
      createOrders: (data: unknown[]) => Promise<Array<{ id: string }>>;
    };
    const [order] = await orderModule.createOrders([
      {
        ...createOrderInput,
        status: "pending",
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
