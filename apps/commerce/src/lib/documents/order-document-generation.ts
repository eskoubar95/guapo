import { buildOrderPdf, type PdfLocale } from "./build-order-pdf";
import type { PdfSellerProfile } from "./pdf-seller-config";
import { formatPaymentMethodLabel } from "./pdf-payment-label";

/** Order shape from query.graph — shared by subscriber + admin regenerate. */
export type OrderShapeForDocuments = {
  id: string;
  display_id?: number;
  customer_id?: string | null;
  email?: string | null;
  created_at?: string;
  currency_code?: string;
  total?: number;
  shipping_total?: number;
  tax_total?: number;
  discount_total?: number;
  metadata?: Record<string, unknown> | null;
  shipping_address?: Record<string, unknown> | null;
  items?: Array<{
    id: string;
    title?: string;
    variant?: { title?: string | null } | null;
    quantity?: number;
    unit_price?: number;
    total?: number;
    metadata?: Record<string, unknown> | null;
  }> | null;
};

const GRAPH_FIELDS = [
  "id",
  "display_id",
  "customer_id",
  "email",
  "created_at",
  "currency_code",
  "total",
  "shipping_total",
  "tax_total",
  "discount_total",
  "metadata",
  "shipping_address",
  "items.id",
  "items.title",
  "items.variant.title",
  "items.quantity",
  "items.unit_price",
  "items.total",
  "items.metadata",
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
  const items = order.items ?? [];
  const subtotalMinor = items.reduce((sum, item) => {
    const qty = Math.max(1, item.quantity ?? 1);
    const lineMajor = item.total ?? (item.unit_price ?? 0) * qty;
    return sum + majorToMinor(Number(lineMajor));
  }, 0);
  const shippingMinor = majorToMinor(Number(order.shipping_total ?? 0));
  const totalMinor =
    order.total != null ? majorToMinor(Number(order.total)) : subtotalMinor + shippingMinor;
  const currencyCode = String(order.currency_code ?? "dkk");

  const lines = items.map((item) => {
    const quantity = Math.max(1, item.quantity ?? 1);
    const lineTotalMinor = majorToMinor(
      Number(item.total ?? (item.unit_price ?? 0) * quantity)
    );
    const unitPriceMinor = Math.round(
      item.total != null
        ? lineTotalMinor / quantity
        : majorToMinor(Number(item.unit_price ?? 0))
    );
    const variantTitle =
      typeof item.variant?.title === "string" && item.variant.title.trim()
        ? item.variant.title.trim()
        : "";
    const productTitle = typeof item.title === "string" && item.title.trim() ? item.title.trim() : "";
    const title =
      [variantTitle, productTitle].filter(Boolean).join(" — ") || item.id;
    return {
      title,
      quantity,
      unitPriceMinor,
      lineTotalMinor,
    };
  });

  const localePdf = computeLocalePdf(order);

  const taxTotalMinor =
    order.tax_total != null && Number.isFinite(Number(order.tax_total))
      ? majorToMinor(Number(order.tax_total))
      : undefined;
  const discountTotalMinor =
    order.discount_total != null &&
    Number.isFinite(Number(order.discount_total)) &&
    Number(order.discount_total) > 0
      ? majorToMinor(Number(order.discount_total))
      : undefined;
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
