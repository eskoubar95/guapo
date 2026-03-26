import { MedusaError } from "@medusajs/framework/utils";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeBase = require("@medusajs/payment-stripe/dist/core/stripe-base").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PaymentProviderKeys } = require("@medusajs/payment-stripe/dist/types");

import { buildGuapoStripeInitiateData } from "../lib/build-initiate-payment-payload";
import { resolveCartForPaymentCollection } from "../lib/resolve-cart-for-payment";

/**
 * Guapo Stripe provider: extends official Stripe PaymentIntent flow with
 * payment-method choice, subscription rules, and richer Stripe payloads.
 *
 * Amount/currency for the PaymentIntent come from Medusa (`input.amount`), i.e.
 * the payment collection row kept in sync with the cart via core flows
 * (`refreshPaymentCollectionForCartWorkflow` when cart totals change).
 *
 * @see https://docs.medusajs.com/resources/references/payment/provider#how-to-create-a-payment-module-provider
 */
export default class GuapoStripeProviderService extends StripeBase {
  static identifier = PaymentProviderKeys.STRIPE;

  get paymentIntentOptions(): Record<string, unknown> {
    return {};
  }

  async initiatePayment(input: {
    currency_code: string;
    amount: number;
    data?: Record<string, unknown>;
    context?: Record<string, unknown>;
  }) {
    const { currency_code, amount, data = {}, context } = input;
    const sessionId = data.session_id as string | undefined;
    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing payment session_id for Stripe initiate",
      );
    }

    const cart = await resolveCartForPaymentCollection(data.cart_id, {
      currency_code,
    });
    if (!cart?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Could not load cart for payment. Ensure cart_id is sent and currency matches.",
      );
    }

    const nextData = buildGuapoStripeInitiateData({
      cart,
      currency_code,
      clientData: data,
    });

    /**
     * In practice, Medusa's create-payment-sessions workflow can read a stale
     * payment_collection amount via remote query while cart totals are already
     * updated (e.g. free-shipping adjustment just applied).
     * Use cart total when available so the PaymentIntent amount matches cart.
     */
    const cartTotalNumber =
      typeof cart.total === "number" ? cart.total : Number(cart.total);
    const amountForStripe =
      Number.isFinite(cartTotalNumber) && cartTotalNumber >= 0
        ? cartTotalNumber
        : amount;

    return super.initiatePayment({
      currency_code,
      amount: amountForStripe,
      data: nextData,
      context,
    });
  }
}
