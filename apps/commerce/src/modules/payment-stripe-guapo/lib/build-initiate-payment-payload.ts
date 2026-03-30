import type { GuapoCartPayload } from "./guapo-stripe.types";
import { buildStripeAmountDetailsLoose } from "./stripe-amount-details";
import { buildStripeIntentMetadata } from "./stripe-intent-metadata";
import {
  lineHasSubscription,
  parsePaymentMethodChoice,
  resolveStripePaymentMethodTypes,
} from "./payment-method-resolution";

const META_VALUE_MAX = 500;

export function buildGuapoStripeInitiateData(input: {
  cart: GuapoCartPayload;
  currency_code: string;
  clientData: Record<string, unknown>;
}): Record<string, unknown> {
  const { cart, currency_code, clientData } = input;
  const hasSub = (cart.items ?? []).some(lineHasSubscription);
  const choice = parsePaymentMethodChoice(clientData.payment_method_choice);
  const paymentMethodTypes = resolveStripePaymentMethodTypes(hasSub, choice);

  const baseMeta = buildStripeIntentMetadata(cart, currency_code, paymentMethodTypes);
  const clientMeta = (clientData.metadata as Record<string, string>) ?? {};
  const mergedMeta: Record<string, string> = {
    ...baseMeta,
    ...Object.fromEntries(
      Object.entries(clientMeta).map(([k, v]) => [k, String(v).slice(0, META_VALUE_MAX)]),
    ),
  };

  const amountDetails = buildStripeAmountDetailsLoose(cart);

  const nextData: Record<string, unknown> = {
    ...clientData,
    payment_method_types: paymentMethodTypes,
    setup_future_usage: hasSub ? "off_session" : clientData.setup_future_usage,
    metadata: mergedMeta,
  };

  if (amountDetails) {
    nextData.amount_details = amountDetails;
  }

  delete nextData.payment_method_choice;
  delete nextData.automatic_payment_methods;
  delete nextData.payment_collection_id;

  return nextData;
}
