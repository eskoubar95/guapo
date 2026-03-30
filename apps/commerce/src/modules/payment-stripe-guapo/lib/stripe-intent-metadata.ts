import type { GuapoCartPayload } from "./guapo-stripe.types";

const META_MAX = 500;
const LINE_KEYS_MAX = 15;

export function buildStripeIntentMetadata(
  cart: GuapoCartPayload,
  currencyCode: string,
  paymentMethodTypes: string[],
): Record<string, string> {
  const meta: Record<string, string> = {
    medusa_cart_id: (cart.id ?? "").slice(0, META_MAX),
    currency: currencyCode,
    payment_method_types: paymentMethodTypes.join(","),
    item_count: String(cart.items?.length ?? 0),
    tax_total_minor: String(cart.tax_total ?? ""),
    cart_total_minor: String(cart.total ?? ""),
  };
  const items = cart.items ?? [];
  for (let i = 0; i < Math.min(items.length, LINE_KEYS_MAX); i++) {
    const it = items[i];
    const sku = it.variant?.sku ?? "";
    const name = (it.title ?? "Item").slice(0, 80);
    const q = it.quantity ?? 1;
    const tot = it.total ?? 0;
    meta[`line_${i}`] = `${name}|x${q}|${tot}${sku ? `|${sku.slice(0, 20)}` : ""}`.slice(
      0,
      META_MAX,
    );
  }
  return meta;
}
