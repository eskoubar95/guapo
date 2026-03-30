import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows";
import { orderDetailUrlForLocale, resolveOrderRecipientContext } from "./customer-context";
import { sendTransactionalEmail } from "./service";

type LoggerLike = {
  info?: (m: string) => void;
  warn?: (m: string) => void;
};

function firstTrackingFromFulfillment(fulfillment: {
  labels?: Array<{ tracking_number?: string | null; tracking_url?: string | null }> | null;
  data?: Record<string, unknown> | null;
}): { trackingUrl: string; trackingNumber: string } | null {
  const labels = fulfillment.labels;
  if (Array.isArray(labels)) {
    for (const l of labels) {
      const url = typeof l?.tracking_url === "string" ? l.tracking_url.trim() : "";
      const num = typeof l?.tracking_number === "string" ? l.tracking_number.trim() : "";
      if (url || num) {
        return { trackingUrl: url || "#", trackingNumber: num || "—" };
      }
    }
  }
  const data = fulfillment.data ?? {};
  const url = typeof data.tracking_url === "string" ? data.tracking_url.trim() : "";
  if (url) {
    const num =
      typeof data.pkg_no === "string"
        ? data.pkg_no.trim()
        : typeof data.shipment_id === "number"
          ? String(data.shipment_id)
          : "—";
    return { trackingUrl: url, trackingNumber: num };
  }
  return null;
}

/**
 * Sends `shipment_tracking_available` when the fulfillment has a usable tracking URL.
 * Idempotent per order via `metadata.guapo_tracking_email_fulfillment_id`.
 */
export async function sendFulfillmentTrackingEmailIfReady(
  container: MedusaContainer,
  logger: LoggerLike | undefined,
  input: { orderId: string; fulfillmentId: string }
): Promise<void> {
  const { orderId, fulfillmentId } = input;

  const query = container.resolve("query") as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  const fulfillmentModule = container.resolve(Modules.FULFILLMENT) as {
    listFulfillments: (
      filters: { id: string | string[] },
      config?: object
    ) => Promise<
      Array<{
        id: string;
        labels?: Array<{ tracking_number?: string | null; tracking_url?: string | null }> | null;
        data?: Record<string, unknown> | null;
      }>
    >;
  };

  const fulfillments = await fulfillmentModule.listFulfillments(
    { id: fulfillmentId },
    { relations: ["labels"] }
  );
  const fulfillment = fulfillments?.[0];
  if (!fulfillment) {
    logger?.warn?.(`[fulfillment-tracking-email] Fulfillment ${fulfillmentId} not found`);
    return;
  }

  const tracking = firstTrackingFromFulfillment(fulfillment);
  if (!tracking?.trackingUrl || tracking.trackingUrl === "#") {
    logger?.info?.(
      `[fulfillment-tracking-email] No tracking URL for fulfillment ${fulfillmentId}, skip email`
    );
    return;
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "customer_id", "metadata"],
    filters: { id: orderId },
  });
  const order = orders?.[0] as
    | {
        id: string;
        display_id?: number;
        email?: string | null;
        customer_id?: string | null;
        metadata?: Record<string, unknown> | null;
      }
    | undefined;
  if (!order) return;

  const meta = (order.metadata ?? {}) as Record<string, unknown>;
  if (meta.guapo_tracking_email_fulfillment_id === fulfillmentId) return;

  const recipient = await resolveOrderRecipientContext(container, {
    email: order.email ?? undefined,
    customer_id: order.customer_id,
  });
  if (!recipient) {
    logger?.warn?.(`[fulfillment-tracking-email] No recipient for order ${order.id}`);
    return;
  }

  const displayLabel =
    order.display_id != null ? `#${order.display_id}` : order.id.slice(-8);
  const orderUrl = orderDetailUrlForLocale(recipient.locale, order.id);

  const result = await sendTransactionalEmail(
    {
      template: "shipment_tracking_available",
      to: recipient.email,
      locale: recipient.locale,
      idempotencyKey: `shipment_tracking:${order.id}:${fulfillmentId}`,
      payload: {
        orderDetailUrl: orderUrl,
        displayLabel,
        trackingUrl: tracking.trackingUrl,
        trackingNumber: tracking.trackingNumber,
      },
    },
    logger
  );

  if (!result.success) return;

  const userId = order.customer_id ?? order.id;
  await updateOrderWorkflow(container).run({
    input: {
      id: order.id,
      user_id: userId,
      metadata: {
        ...meta,
        guapo_tracking_email_fulfillment_id: fulfillmentId,
      },
    },
  });

  logger?.info?.(
    `[fulfillment-tracking-email] Sent for order ${order.id} fulfillment ${fulfillmentId}`
  );
}
