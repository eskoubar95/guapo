import type { GuapoCartLine, PaymentMethodChoice } from "./guapo-stripe.types";

const CHOICE_TO_TYPES: Record<PaymentMethodChoice, string[]> = {
  card: ["card"],
  mobilepay: ["mobilepay"],
  klarna: ["klarna"],
};

export function lineHasSubscription(item: GuapoCartLine): boolean {
  const m = item.metadata;
  return (
    !!m &&
    typeof m.subscription_cycle === "number" &&
    (m.subscription_cycle as number) > 0
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
