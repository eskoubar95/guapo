import type { GuapoCartPayload } from "./guapo-stripe.types";

export type StripeAmountDetailsLoose = {
  line_items: Array<{
    product_name: string;
    quantity: number;
    unit_cost: number;
    tax?: { total_tax_amount: number };
  }>;
  shipping?: { amount: number };
  enforce_arithmetic_validation: boolean;
};

/**
 * Line items + shipping for Stripe Dashboard. Validation relaxed so checkout is not blocked.
 */
export function buildStripeAmountDetailsLoose(
  cart: GuapoCartPayload,
): StripeAmountDetailsLoose | null {
  if (!cart.items?.length) return null;
  const line_items = cart.items.map((it) => {
    const qty = Math.max(1, it.quantity ?? 1);
    const lineTotal = Math.max(0, it.total ?? 0);
    const taxTotal = Math.max(0, it.tax_total ?? 0);
    const net = Math.max(0, lineTotal - taxTotal);
    const unit_cost = Math.max(0, Math.round(net / qty));
    const entry: StripeAmountDetailsLoose["line_items"][0] = {
      product_name: (it.title ?? "Product").slice(0, 1024),
      quantity: qty,
      unit_cost,
    };
    if (taxTotal > 0) {
      entry.tax = { total_tax_amount: taxTotal };
    }
    return entry;
  });
  const ship = Math.max(0, cart.shipping_total ?? 0);
  return {
    line_items,
    ...(ship > 0 ? { shipping: { amount: ship } } : {}),
    enforce_arithmetic_validation: false,
  };
}
