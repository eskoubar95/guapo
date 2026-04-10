import { isSubscriptionLineMetadata } from "../../../lib/subscription-cycle-metadata";
import type { GuapoCartLine, PaymentMethodChoice } from "./guapo-stripe.types";

const CHOICE_TO_TYPES: Record<PaymentMethodChoice, string[]> = {
  card: ["card"],
  mobilepay: ["mobilepay"],
  klarna: ["klarna"],
};

export function lineHasSubscription(item: GuapoCartLine): boolean {
  return isSubscriptionLineMetadata(
    item.metadata as Record<string, unknown> | null | undefined
  );
}

export function parsePaymentMethodChoice(raw: unknown): PaymentMethodChoice {
  const s = String(raw ?? "card").toLowerCase();
  if (s === "mobilepay" || s === "klarna" || s === "card") return s;
  return "card";
}

export function resolveStripePaymentMethodTypes(
  hasSubscriptionLines: boolean,
  choice: PaymentMethodChoice,
): string[] {
  if (hasSubscriptionLines) return ["card"];
  return [...(CHOICE_TO_TYPES[choice] ?? ["card"])];
}
