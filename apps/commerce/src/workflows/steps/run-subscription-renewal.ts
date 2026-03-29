import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import {
  createOrderPaymentCollectionWorkflow,
  markPaymentCollectionAsPaid,
} from "@medusajs/medusa/core-flows";
import type { Logger } from "@medusajs/framework/types";
import { resolveLink, resolveOrderModule, resolveQuery } from "../../lib/container-types";
import { resolveDiscountPercentForRenewal } from "../../lib/subscription-discount";
import { buildRenewalOrderCreateInput } from "../../lib/subscription-renewal/build-renewal-order";
import { resolveRenewalAddressesFromCustomer } from "../../lib/subscription-renewal/resolve-renewal-customer-addresses";
import { chargeStripeSubscriptionRenewal } from "../../lib/subscription-renewal/charge-stripe-renewal";
import { resolveRenewalPricingFromInitialOrder } from "../../lib/subscription-renewal/resolve-renewal-price";
import { resolveRenewalShipping } from "../../lib/subscription-renewal/resolve-renewal-shipping";
import { getStripeClient } from "../../lib/stripe-client";
import { GUAPO_FREE_SHIPPING_MODULE } from "../../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../../modules/guapo-free-shipping/service";
import {
  notifyAfterRenewalPaymentFailure,
  notifySubscriptionPaymentRecovered,
} from "../../lib/transactional-email/subscription-renewal-notifications";
import { SUBSCRIPTION_MODULE } from "../../modules/subscription";
import type SubscriptionModuleService from "../../modules/subscription/service";

export type RunSubscriptionRenewalInput = { subscriptionId: string };

export type RunSubscriptionRenewalOutput = {
  renewed: boolean;
  orderId?: string;
  error?: string;
  retryCount?: number;
  skipped?: boolean;
  refunded?: boolean;
};

const STRIPE_DKK_MINIMUM_ORE = 250;

export const runSubscriptionRenewalStep = createStep(
  "run-subscription-renewal",
  async (
    { subscriptionId }: RunSubscriptionRenewalInput,
    { container }
  ): Promise<StepResponse<RunSubscriptionRenewalOutput>> => {
    const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
    const logger = container.resolve("logger") as {
      debug?: (message: string) => void;
      info?: (message: string) => void;
      warn?: (message: string) => void;
      error?: (message: string) => void;
    };
    const freeShippingSettings = container.resolve(
      GUAPO_FREE_SHIPPING_MODULE
    ) as GuapoFreeShippingModuleService;
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
    const claimed = await subscriptionService.claimForRenewal(subscriptionId);
    if (!claimed) {
      return new StepResponse({
        renewed: false,
        skipped: true,
      });
    }

    const sub = await subscriptionService.retrieveSubscription(subscriptionId);
    if (!sub) throw new Error("Subscription not found");

    const hadPaymentRetries = (sub.retry_count ?? 0) > 0;

    if (sub.skip_next) {
      await subscriptionService.updateSubscriptions([{ id: subscriptionId, skip_next: false }]);
      await subscriptionService.advanceNextRenewal(subscriptionId);
      return new StepResponse({
        renewed: false,
        skipped: true,
      });
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
    const primaryVatRatePercent = origTaxLines.find(
      (tl) => typeof tl.rate === "number" && tl.rate >= 0
    )?.rate;
    const vatRatePercent =
      typeof primaryVatRatePercent === "number" && Number.isFinite(primaryVatRatePercent)
        ? primaryVatRatePercent
        : 25;
    const vatMultiplier = origIsTaxInclusive ? 1 : 1 + vatRatePercent / 100;
    const itemsGrossDkk = Math.round(itemsTotalDkk * vatMultiplier * 100) / 100;
    let freeShippingThresholdDkk = Number.POSITIVE_INFINITY;
    try {
      const fs = await freeShippingSettings.getSettingsOrDefaults();
      if (
        fs.enabled &&
        typeof fs.threshold_amount === "number" &&
        fs.threshold_amount > 0
      ) {
        freeShippingThresholdDkk = fs.threshold_amount;
      }
    } catch {
      freeShippingThresholdDkk = 499;
    }
    const variants = await productModule.listProductVariants(
      { id: sub.variant_id },
      { relations: ["product"] }
    );
    const variant = variants?.[0];
    const product = variant?.product;
    const { shippingExVatDkk, shippingGrossDkk } = await resolveRenewalShipping({
      shippingOptionId: sub.shipping_option_id,
      itemTotalGrossDkk: itemsGrossDkk,
      freeShippingThresholdDkk,
      quantity: sub.quantity ?? 1,
      variantWeightGrams: (variant as { weight?: number | null } | undefined)?.weight ?? null,
      vatRatePercent: primaryVatRatePercent,
      logger: logger as unknown as Logger,
    });

    const totalDkk = itemsGrossDkk + shippingGrossDkk;
    const stripeAmountOre = Math.round(totalDkk * 100);

    if (stripeAmountOre < STRIPE_DKK_MINIMUM_ORE) {
      throw new Error(
        `Charge amount ${stripeAmountOre} øre (${totalDkk.toFixed(2)} DKK) is below Stripe's DKK minimum of 2.50 DKK.`
      );
    }

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
      await notifyAfterRenewalPaymentFailure({
        container,
        subscriptionId,
        chargeResult,
        logger: logger as { info?: (m: string) => void; warn?: (m: string) => void; error?: (m: string) => void },
      });
      return new StepResponse({
        renewed: false,
        error: chargeResult.error,
        retryCount: chargeResult.retryCount,
      });
    }

    const [region] = await regionModule.listRegions({ currency_code: "dkk" });
    const [salesChannel] = await salesChannelModule.listSalesChannels({});
    if (!region || !salesChannel) throw new Error("Region or sales channel not found");

    const fallbackShip = (sub.shipping_address ?? {}) as Record<string, unknown>;
    const fallbackBill = (sub.billing_address ?? {}) as Record<string, unknown>;
    const deliveryData = (sub as { delivery_data?: Record<string, unknown> | null }).delivery_data ?? null;

    const { shipping: shippingAddr, billing: billingAddr, email: customerEmail } =
      await resolveRenewalAddressesFromCustomer(
        container,
        sub.customer_id,
        fallbackShip,
        fallbackBill,
        deliveryData
      );

    const resolvedEmail =
      customerEmail ||
      (shippingAddr.email as string) ||
      `customer-${sub.customer_id}@subscription.local`;
    const resolvedFirstName = (shippingAddr.first_name as string) || "";
    const resolvedLastName = (shippingAddr.last_name as string) || "";

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
      shippingExVatDkk,
      subscriptionId,
      cycleWeeks: sub.cycle_weeks,
      stripePaymentIntentId: chargeResult.stripePaymentIntentId,
      nextRenewalAt: sub.next_renewal_at,
      shippingMethodData: deliveryData,
    });

    try {
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

      const { result: paymentCollections } = await createOrderPaymentCollectionWorkflow(container).run({
        input: {
          order_id: order.id,
          amount: totalDkk,
        },
      });
      const paymentCollection = Array.isArray(paymentCollections) ? paymentCollections[0] : paymentCollections;
      const paymentCollectionId = paymentCollection && typeof paymentCollection === "object" && "id" in paymentCollection
        ? (paymentCollection as { id: string }).id
        : undefined;
      if (!paymentCollectionId) {
        throw new Error("Payment collection creation did not return an id");
      }
      await markPaymentCollectionAsPaid(container).run({
        input: {
          order_id: order.id,
          payment_collection_id: paymentCollectionId,
        },
      });

      await subscriptionService.incrementDeliveryCount(subscriptionId);
      await subscriptionService.advanceNextRenewal(subscriptionId, order.id);
      await subscriptionService.clearRetryState(subscriptionId);
      await subscriptionService.updateSubscriptions([
        {
          id: subscriptionId,
          shipping_address: shippingAddr,
          billing_address: billingAddr,
        },
      ]);

      if (hadPaymentRetries) {
        await notifySubscriptionPaymentRecovered({
          container,
          subscriptionId,
          customerId: sub.customer_id,
          renewalOrderId: order.id,
          logger: logger as { info?: (m: string) => void; warn?: (m: string) => void; error?: (m: string) => void },
        });
      }

      return new StepResponse({
        renewed: true,
        orderId: order.id,
      });
    } catch (err) {
      const stripe = getStripeClient();
      try {
        await stripe.refunds.create({
          payment_intent: chargeResult.stripePaymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            subscription_id: subscriptionId,
            renewal_recovery: "order_creation_failed",
          },
        });
        await subscriptionService.setFailureContext(
          subscriptionId,
          "order_creation_failed_charge_refunded"
        );
        logger?.error?.(
          `[subscription-renewal] Refunded payment intent ${chargeResult.stripePaymentIntentId} after order creation failure for ${subscriptionId}`
        );
      } catch (refundErr) {
        logger?.error?.(
          `[subscription-renewal] Refund failed for payment intent ${chargeResult.stripePaymentIntentId}: ${
            refundErr instanceof Error ? refundErr.message : String(refundErr)
          }`
        );
      }

      return new StepResponse({
        renewed: false,
        error:
          err instanceof Error
            ? `Order creation failed, charge refunded: ${err.message}`
            : "Order creation failed, charge refunded",
        refunded: true,
      });
    }
  }
);
