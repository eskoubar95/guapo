import type { OrigTaxLine } from "./resolve-renewal-price";

type ProductSummary = {
  id: string;
  title?: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string | null;
  handle?: string;
} | null;

type VariantSummary = {
  title?: string;
  sku?: string;
  barcode?: string;
} | null;

/**
 * Input payload for Medusa Order module createOrders (renewal order).
 */
export function buildRenewalOrderCreateInput(input: {
  regionId: string;
  salesChannelId: string;
  customerId: string;
  currencyCode: string;
  email: string;
  firstName: string;
  lastName: string;
  shippingAddr: Record<string, unknown>;
  billingAddr: Record<string, unknown>;
  variantId: string;
  quantity: number;
  unitPriceDkk: number;
  rawPriceDkk: number;
  product: ProductSummary;
  variant: VariantSummary;
  origIsTaxInclusive: boolean;
  origTaxLines: OrigTaxLine[];
  shippingOptionId: string;
  shippingDkk: number;
  subscriptionId: string;
  cycleWeeks: number;
  stripePaymentIntentId: string | null;
  nextRenewalAt: Date | string | null | undefined;
}): Record<string, unknown> {
  const {
    regionId,
    salesChannelId,
    customerId,
    currencyCode,
    email,
    firstName,
    lastName,
    shippingAddr,
    billingAddr,
    variantId,
    quantity,
    unitPriceDkk,
    rawPriceDkk,
    product,
    variant,
    origIsTaxInclusive,
    origTaxLines,
    shippingOptionId,
    shippingDkk,
    subscriptionId,
    cycleWeeks,
    stripePaymentIntentId,
    nextRenewalAt,
  } = input;

  return {
    region_id: regionId,
    sales_channel_id: salesChannelId,
    customer_id: customerId,
    currency_code: currencyCode,
    email,
    shipping_address: {
      first_name: firstName || "Customer",
      last_name: lastName || ".",
      address_1: (shippingAddr.address_1 as string) || "",
      city: (shippingAddr.city as string) || "",
      postal_code: (shippingAddr.postal_code as string) || "",
      country_code: (shippingAddr.country_code as string) || "dk",
      phone: shippingAddr.phone as string,
    },
    billing_address: {
      first_name: firstName || "Customer",
      last_name: lastName || ".",
      address_1: (billingAddr.address_1 as string) || "",
      city: (billingAddr.city as string) || "",
      postal_code: (billingAddr.postal_code as string) || "",
      country_code: (billingAddr.country_code as string) || "dk",
      phone: billingAddr.phone as string,
    },
    items: [
      {
        variant_id: variantId,
        quantity,
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
          subscription_cycle: cycleWeeks,
        },
      },
    ],
    shipping_methods: shippingOptionId
      ? [
          {
            shipping_option_id: shippingOptionId,
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
      subscription_cycle: cycleWeeks,
      stripe_payment_intent_id: stripePaymentIntentId,
      requested_fulfillment_at: nextRenewalAt
        ? new Date(nextRenewalAt).toISOString()
        : new Date().toISOString(),
    },
  };
}
