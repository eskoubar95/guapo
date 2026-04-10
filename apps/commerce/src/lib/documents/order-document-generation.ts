import { buildOrderPdf, type PdfLocale } from "./build-order-pdf";
import type { PdfSellerProfile } from "./pdf-seller-config";
import { formatPaymentMethodLabel } from "./pdf-payment-label";
import { flattenOrderItemFromGraph, resolveLineTotalMajor } from "../store-order-graph-item";
import { toAmountMajor } from "../store-order-money";

/** Order shape from query.graph — shared by subscriber + admin regenerate. */
export type OrderShapeForDocuments = {
  id: string;
  display_id?: number;
  customer_id?: string | null;
  email?: string | null;
  created_at?: string;
  currency_code?: string;
  total?: unknown;
  raw_total?: unknown;
  shipping_total?: unknown;
  raw_shipping_total?: unknown;
  tax_total?: unknown;
  discount_total?: unknown;
  metadata?: Record<string, unknown> | null;
  shipping_address?: Record<string, unknown> | null;
  /** Graph returns OrderItem rows; use `flattenOrderItemFromGraph` before reading prices. */
  items?: Array<Record<string, unknown>> | null;
};

/**
 * Same join shape as GET /store/orders/:id — line amounts live on `items.item` + `items.detail`,
 * often only reliably via `raw_*` / BigNumber JSON.
 */
const GRAPH_FIELDS = [
  "id",
  "display_id",
  "customer_id",
  "email",
  "created_at",
  "currency_code",
  "total",
  "raw_total",
  "shipping_total",
  "raw_shipping_total",
  "tax_total",
  "discount_total",
  "metadata",
  "shipping_address",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.city",
  "shipping_address.postal_code",
  "shipping_address.country_code",
  "shipping_address.phone",
  "items.id",
  "items.title",
  "items.quantity",
  "items.unit_price",
  "items.raw_unit_price",
  "items.total",
  "items.raw_total",
  "items.metadata",
  "items.variant.title",
  "items.variant_id",
  "items.detail",
  "items.detail.quantity",
  "items.detail.unit_price",
  "items.detail.raw_unit_price",
  "items.item",
  "items.item.id",
  "items.item.title",
  "items.item.unit_price",
  "items.item.raw_unit_price",
  "items.item.total",
  "items.item.raw_total",
  "items.item.item_total",
  "items.item.metadata",
] as const;

export function getOrderDocumentGraphFields(): readonly string[] {
  return GRAPH_FIELDS;
}

/** Graph amounts are decimal DKK (major); buildOrderPdf expects integer øre. */
export function majorToMinorOre(m: number): number {
  return Math.round(m * 100);
}

export function computeLocalePdf(order: OrderShapeForDocuments): PdfLocale {
  return String(order.shipping_address?.country_code ?? "")
    .trim()
    .toLowerCase() === "dk"
    ? "da"
    : "en";
}

/**
 * Build both PDF buffers + generatedAt. Caller merges into order metadata.
 */
export async function buildOrderDocumentPdfBuffers(
  order: OrderShapeForDocuments,
  seller: PdfSellerProfile
): Promise<{
  orderConfirmationPdf: Buffer;
  invoicePdf: Buffer;
  generatedAt: string;
}> {
  const majorToMinor = majorToMinorOre;
  const rawRows = (order.items ?? []) as Record<string, unknown>[];

  const lines = rawRows.map((row) => {
    const flat = flattenOrderItemFromGraph(row) as Record<string, unknown>;
    const quantity = Math.max(1, typeof flat.quantity === "number" ? flat.quantity : 1);
    const unitPriceMajor = toAmountMajor(
      (flat as { raw_unit_price?: unknown }).raw_unit_price ?? flat.unit_price
    );
    const lineTotalMajor =
      resolveLineTotalMajor(flat, unitPriceMajor, quantity) ??
      (unitPriceMajor != null ? unitPriceMajor * quantity : 0);
    const lineTotalMinor = majorToMinor(lineTotalMajor);
    const unitPriceMinor = Math.round(lineTotalMinor / quantity);

    const variantFromRow = row.variant as { title?: string | null } | undefined;
    const variantFromFlat = flat.variant as { title?: string | null } | undefined;
    const variantTitle =
      (typeof variantFromFlat?.title === "string" && variantFromFlat.title.trim()
        ? variantFromFlat.title.trim()
        : "") ||
      (typeof variantFromRow?.title === "string" && variantFromRow.title.trim()
        ? variantFromRow.title.trim()
        : "");
    const productTitle =
      typeof flat.title === "string" && flat.title.trim() ? flat.title.trim() : "";
    const id = typeof flat.id === "string" ? flat.id : String(row.id ?? "");
    const title = [variantTitle, productTitle].filter(Boolean).join(" — ") || id;
    return {
      title,
      quantity,
      unitPriceMinor,
      lineTotalMinor,
    };
  });

  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);

  const orderRec = order as Record<string, unknown>;
  const shippingMajor =
    toAmountMajor(orderRec.raw_shipping_total ?? order.shipping_total) ?? 0;
  const totalMajor = toAmountMajor(orderRec.raw_total ?? order.total);
  const shippingMinor = majorToMinor(shippingMajor);
  const totalMinor =
    totalMajor != null && Number.isFinite(totalMajor)
      ? majorToMinor(totalMajor)
      : subtotalMinor + shippingMinor;
  const currencyCode = String(order.currency_code ?? "dkk");

  const localePdf = computeLocalePdf(order);

  const taxMajor = toAmountMajor(order.tax_total);
  const taxTotalMinor =
    taxMajor != null && taxMajor > 0 ? majorToMinor(taxMajor) : undefined;
  const discountMajor = toAmountMajor(order.discount_total);
  const discountTotalMinor =
    discountMajor != null && discountMajor > 0 ? majorToMinor(discountMajor) : undefined;
  const paymentMethodLabel = formatPaymentMethodLabel(order.metadata);

  const common = {
    locale: localePdf,
    orderId: order.id,
    displayId: order.display_id,
    createdAt: order.created_at,
    currencyCode,
    customerEmail: order.email ?? undefined,
    shippingAddress: (order.shipping_address ?? null) as Record<string, string> | null,
    lines,
    subtotalMinor,
    shippingMinor,
    totalMinor,
    taxTotalMinor,
    discountTotalMinor,
    paymentMethodLabel,
    sellerOverride: seller,
  };

  const orderConfirmationPdf = await buildOrderPdf({
    ...common,
    documentKind: "order_confirmation",
  });
  const invoicePdf = await buildOrderPdf({
    ...common,
    documentKind: "invoice",
  });

  return {
    orderConfirmationPdf,
    invoicePdf,
    generatedAt: new Date().toISOString(),
  };
}
