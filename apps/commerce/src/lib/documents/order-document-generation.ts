import { buildOrderPdf, type OrderDocumentLine, type PdfLocale } from "./build-order-pdf";
import type { PdfSellerProfile } from "./pdf-seller-config";
import { formatPaymentMethodLabel } from "./pdf-payment-label";
import { resolveCatalogMediaUrl } from "../resolve-catalog-media-url";
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
  "items.item.variant",
  "items.item.variant.title",
  "items.item.variant.product",
  "items.item.variant.product.title",
  "items.item.variant.product.brand",
  "items.item.variant.product.brand.name",
  "items.item.variant.product.thumbnail",
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

function readNestedString(obj: unknown, path: string[]): string {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur.trim() : "";
}

/** Brand + produkt som primær linje; variant som undertitel når den adskiller sig fra produktnavnet. */
function linePresentationFromGraphRow(
  row: Record<string, unknown>,
  flat: Record<string, unknown>,
  fallbackId: string
): { title: string; subtitle?: string } {
  const item = row.item as Record<string, unknown> | undefined;
  const variant =
    (flat.variant as Record<string, unknown> | undefined) ??
    (item?.variant as Record<string, unknown> | undefined) ??
    (row.variant as Record<string, unknown> | undefined);
  const product =
    (variant?.product as Record<string, unknown> | undefined) ??
    (item?.product as Record<string, unknown> | undefined);

  const brandName = readNestedString(product, ["brand", "name"]);
  const productTitle =
    (typeof product?.title === "string" ? product.title.trim() : "") ||
    (typeof flat.title === "string" ? flat.title.trim() : "");
  const variantTitle =
    (typeof variant?.title === "string" ? variant.title.trim() : "") ||
    readNestedString(row, ["variant", "title"]);

  const mainParts = [brandName, productTitle].filter((s) => s.length > 0);
  const primaryLine =
    mainParts.length > 0
      ? mainParts.join(" — ")
      : productTitle || variantTitle || (typeof flat.title === "string" ? flat.title.trim() : "") || fallbackId;

  const subtitle =
    variantTitle && primaryLine !== variantTitle ? variantTitle : undefined;

  return { title: primaryLine, subtitle };
}

function productThumbnailFromGraphRow(
  row: Record<string, unknown>,
  flat: Record<string, unknown>
): string | undefined {
  const item = row.item as Record<string, unknown> | undefined;
  const variant =
    (flat.variant as Record<string, unknown> | undefined) ??
    (item?.variant as Record<string, unknown> | undefined) ??
    (row.variant as Record<string, unknown> | undefined);
  const product =
    (variant?.product as Record<string, unknown> | undefined) ??
    (item?.product as Record<string, unknown> | undefined);
  const thumb = product?.thumbnail;
  return resolveCatalogMediaUrl(typeof thumb === "string" ? thumb : null);
}

/** Major-currency line rows for transactional order confirmation email (same math as PDF). */
export type OrderEmailLineRow = {
  title: string;
  subtitle?: string;
  quantity: number;
  unitPriceMajor: number;
  lineTotalMajor: number;
  /** Absolute URL for product image when available */
  thumbnailUrl?: string;
};

export type OrderEmailMoneySummary = {
  lines: OrderEmailLineRow[];
  subtotalMajor: number;
  shippingMajor: number;
  taxMajor?: number;
  discountMajor?: number;
  totalMajor: number;
  currencyCode: string;
};

type PdfLineFromOrder = OrderDocumentLine;

function computeOrderPdfLinesAndEmailLines(
  order: OrderShapeForDocuments,
  majorToMinor: (m: number) => number
): { pdfLines: PdfLineFromOrder[]; emailLines: OrderEmailLineRow[]; subtotalMinor: number } {
  const rawRows = (order.items ?? []) as Record<string, unknown>[];

  const pdfLines: PdfLineFromOrder[] = [];
  const emailLines: OrderEmailLineRow[] = [];

  for (const row of rawRows) {
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

    const id = typeof flat.id === "string" ? flat.id : String(row.id ?? "");
    const { title, subtitle } = linePresentationFromGraphRow(row, flat, id);
    const thumbnailUrl = productThumbnailFromGraphRow(row, flat);
    pdfLines.push({
      title,
      subtitle,
      quantity,
      unitPriceMinor,
      lineTotalMinor,
    });
    const resolvedUnit =
      unitPriceMajor != null && Number.isFinite(unitPriceMajor)
        ? unitPriceMajor
        : lineTotalMajor / Math.max(1, quantity);
    emailLines.push({
      title,
      subtitle,
      quantity,
      unitPriceMajor: resolvedUnit,
      lineTotalMajor,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    });
  }

  const subtotalMinor = pdfLines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return { pdfLines, emailLines, subtotalMinor };
}

/**
 * Money + line breakdown for HTML order confirmation (aligned with PDF / store order totals).
 */
export function buildOrderEmailMoneySummary(order: OrderShapeForDocuments): OrderEmailMoneySummary {
  const majorToMinor = majorToMinorOre;
  const { emailLines, subtotalMinor } = computeOrderPdfLinesAndEmailLines(order, majorToMinor);
  const subtotalMajor = subtotalMinor / 100;

  const orderRec = order as Record<string, unknown>;
  const shippingMajor = toAmountMajor(orderRec.raw_shipping_total ?? order.shipping_total) ?? 0;
  const totalMajor = toAmountMajor(orderRec.raw_total ?? order.total);
  const taxMajor = toAmountMajor(order.tax_total);
  const discountMajor = toAmountMajor(order.discount_total);
  const totalMajorResolved =
    totalMajor != null && Number.isFinite(totalMajor) ? totalMajor : subtotalMajor + shippingMajor;

  return {
    lines: emailLines,
    subtotalMajor,
    shippingMajor,
    taxMajor: taxMajor != null && taxMajor > 0 ? taxMajor : undefined,
    discountMajor: discountMajor != null && discountMajor > 0 ? discountMajor : undefined,
    totalMajor: totalMajorResolved,
    currencyCode: String(order.currency_code ?? "dkk"),
  };
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
  const { pdfLines: lines, subtotalMinor } = computeOrderPdfLinesAndEmailLines(order, majorToMinor);

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
