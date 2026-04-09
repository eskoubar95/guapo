import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";
import { buildOrderPdf, type PdfLocale } from "../lib/documents/build-order-pdf";
import { formatPaymentMethodLabel } from "../lib/documents/pdf-payment-label";
import {
  readOrderMetadata,
  writeDocumentPayloads,
  writeTransactionalMarker,
} from "../lib/documents/document-storage";
import {
  resolveTransactionalLocale,
  sendTransactionalEmail,
} from "../lib/transactional-email/service";

type OrderShape = {
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

export default async function orderPlacedTransactionalDocuments({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    error?: (msg: string) => void;
  };
  const query = container.resolve("query") as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  const { data } = await query.graph({
    entity: "order",
    fields: [
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
    ],
    filters: { id: orderId },
  });
  const order = data?.[0] as OrderShape | undefined;
  if (!order) return;

  const metadata = readOrderMetadata(order.metadata);
  if (metadata.documents?.order_confirmation_pdf_base64 && metadata.documents?.invoice_pdf_base64) {
    logger?.info?.(`[order-placed-transactional-documents] PDFs already exist for order ${orderId}, skipping`);
    return;
  }

  /** Graph amounts are decimal DKK (major); buildOrderPdf expects integer øre. */
  const majorToMinorOre = (m: number) => Math.round(m * 100);

  const items = order.items ?? [];
  const subtotalMinor = items.reduce((sum, item) => {
    const qty = Math.max(1, item.quantity ?? 1);
    const lineMajor = item.total ?? (item.unit_price ?? 0) * qty;
    return sum + majorToMinorOre(Number(lineMajor));
  }, 0);
  const shippingMinor = majorToMinorOre(Number(order.shipping_total ?? 0));
  const totalMinor =
    order.total != null ? majorToMinorOre(Number(order.total)) : subtotalMinor + shippingMinor;
  const currencyCode = String(order.currency_code ?? "dkk");

  const lines = items.map((item) => {
    const quantity = Math.max(1, item.quantity ?? 1);
    const lineTotalMinor = majorToMinorOre(
      Number(item.total ?? (item.unit_price ?? 0) * quantity)
    );
    const unitPriceMinor = Math.round(
      item.total != null
        ? lineTotalMinor / quantity
        : majorToMinorOre(Number(item.unit_price ?? 0))
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

  const localePdf: PdfLocale =
    String(order.shipping_address?.country_code ?? "")
      .trim()
      .toLowerCase() === "dk"
      ? "da"
      : "en";

  const taxTotalMinor =
    order.tax_total != null && Number.isFinite(Number(order.tax_total))
      ? majorToMinorOre(Number(order.tax_total))
      : undefined;
  const discountTotalMinor =
    order.discount_total != null &&
    Number.isFinite(Number(order.discount_total)) &&
    Number(order.discount_total) > 0
      ? majorToMinorOre(Number(order.discount_total))
      : undefined;
  const paymentMethodLabel = formatPaymentMethodLabel(order.metadata);

  const orderConfirmationPdf = await buildOrderPdf({
    documentKind: "order_confirmation",
    locale: localePdf,
    orderId,
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
  });
  const invoicePdf = await buildOrderPdf({
    documentKind: "invoice",
    locale: localePdf,
    orderId,
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
  });

  const generatedAt = new Date().toISOString();
  let mergedMetadata = writeDocumentPayloads(order.metadata, {
    orderConfirmationPdfBase64: orderConfirmationPdf.toString("base64"),
    invoicePdfBase64: invoicePdf.toString("base64"),
    generatedAt,
  });

  const locale =
    resolveTransactionalLocale(
      (mergedMetadata.transactional?.locale as string | undefined) ??
        (mergedMetadata.locale as string | undefined) ??
        ((order.shipping_address?.country_code as string | undefined)?.toLowerCase() === "dk" ? "da" : "en")
    ) ?? "da";

  const storefrontUrl = (process.env.STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const storefrontOrderUrl = `${storefrontUrl}/${locale}/account/orders/${encodeURIComponent(orderId)}`;
  const storefrontSubscriptionsUrl = `${storefrontUrl}/${locale}/account/subscriptions`;

  const invoiceLabel =
    order.display_id != null ? String(order.display_id) : orderId.replace(/[^a-zA-Z0-9_-]/g, "").slice(-12) || "order";

  if (!metadata.transactional?.order_confirmation_sent_at && order.email) {
    const emailResult = await sendTransactionalEmail(
      {
        template: "order_confirmation",
        to: order.email,
        locale,
        idempotencyKey: `order_confirmation:${orderId}`,
        payload: {
          orderId,
          displayId: order.display_id,
          storefrontOrderUrl,
        },
        attachments: [
          {
            filename: `faktura-${invoiceLabel}.pdf`,
            contentBase64: invoicePdf.toString("base64"),
            contentType: "application/pdf",
          },
        ],
      },
      logger
    );
    if (emailResult.success) {
      mergedMetadata = writeTransactionalMarker(mergedMetadata, {
        order_confirmation_sent_at: new Date().toISOString(),
        locale,
      });
    }
  }

  const hasSubscriptionLine = items.some((item) => typeof item.metadata?.subscription_cycle === "number");
  if (hasSubscriptionLine && !metadata.transactional?.subscription_created_sent_at && order.email) {
    const emailResult = await sendTransactionalEmail(
      {
        template: "subscription_created",
        to: order.email,
        locale,
        idempotencyKey: `subscription_created:${orderId}`,
        payload: {
          orderId,
          storefrontSubscriptionsUrl,
        },
      },
      logger
    );
    if (emailResult.success) {
      mergedMetadata = writeTransactionalMarker(mergedMetadata, {
        subscription_created_sent_at: new Date().toISOString(),
        locale,
      });
    }
  }

  await updateOrderWorkflow(container).run({
    input: {
      id: orderId,
      user_id: order.customer_id ?? orderId,
      metadata: mergedMetadata,
    },
  });

  logger?.info?.(`[order-placed-transactional-documents] Generated PDFs and processed emails for order ${orderId}`);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
