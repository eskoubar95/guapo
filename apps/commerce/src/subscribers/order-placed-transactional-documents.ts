import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";
import {
  buildOrderDocumentPdfBuffers,
  getOrderDocumentGraphFields,
  type OrderShapeForDocuments,
} from "../lib/documents/order-document-generation";
import { flattenOrderItemFromGraph } from "../lib/store-order-graph-item";
import { resolvePdfSellerForOrder } from "../lib/documents/resolve-pdf-seller";
import {
  readOrderMetadata,
  writeDocumentPayloads,
  writeTransactionalMarker,
} from "../lib/documents/document-storage";
import {
  resolveTransactionalLocale,
  sendTransactionalEmail,
} from "../lib/transactional-email/service";
import { isSubscriptionLineMetadata } from "../lib/subscription-cycle-metadata";
import {
  createSubscriptionsForPlacedOrder,
  listSubscriptionsForOrder,
} from "../lib/create-subscriptions-from-placed-order";

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
    fields: [...getOrderDocumentGraphFields()],
    filters: { id: orderId },
  });
  const order = data?.[0] as OrderShapeForDocuments | undefined;
  if (!order) return;

  /**
   * Ensure Subscription rows exist in the same process as PDFs/emails (worker often handles this
   * subscriber while order-placed-create-subscriptions may not run or may run later on Redis).
   * Idempotent with the dedicated order.placed subscriber.
   */
  await createSubscriptionsForPlacedOrder(container, orderId);

  const metadata = readOrderMetadata(order.metadata);
  if (metadata.documents?.order_confirmation_pdf_base64 && metadata.documents?.invoice_pdf_base64) {
    logger?.info?.(`[order-placed-transactional-documents] PDFs already exist for order ${orderId}, skipping`);
    return;
  }

  const seller = await resolvePdfSellerForOrder(container, order.currency_code ?? "dkk");
  const { orderConfirmationPdf, invoicePdf, generatedAt } = await buildOrderDocumentPdfBuffers(
    order,
    seller
  );

  const rawItemRows = (order.items ?? []) as Record<string, unknown>[];
  const hasSubscriptionLine = rawItemRows.some((row) => {
    const flat = flattenOrderItemFromGraph(row);
    const meta = flat.metadata as Record<string, unknown> | null | undefined;
    return isSubscriptionLineMetadata(meta);
  });

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

  const subscriptionsForOrder =
    hasSubscriptionLine && order.email
      ? await listSubscriptionsForOrder(container, orderId)
      : [];
  if (
    hasSubscriptionLine &&
    subscriptionsForOrder.length === 0 &&
    !metadata.transactional?.subscription_created_sent_at &&
    order.email
  ) {
    logger?.warn?.(
      `[order-placed-transactional-documents] Skipping subscription_created email for ${orderId}: no Subscription rows (Stripe/customer/payment resolution failed).`
    );
  }
  if (
    hasSubscriptionLine &&
    subscriptionsForOrder.length > 0 &&
    !metadata.transactional?.subscription_created_sent_at &&
    order.email
  ) {
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
