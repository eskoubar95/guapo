import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveQuery } from "../lib/container-types";
import { sendFulfillmentTrackingEmailIfReady } from "../lib/transactional-email/send-fulfillment-tracking-email";

type ShipmentCreatedPayload = {
  id: string;
  no_notification?: boolean;
};

/**
 * Retry tracking email when a shipment is created — labels/tracking often appear here (e.g. after carrier booking).
 */
export default async function orderShipmentTrackingEmail({
  event,
  container,
}: SubscriberArgs<ShipmentCreatedPayload>) {
  const data = event?.data;
  if (!data?.id || data.no_notification) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    warn?: (m: string) => void;
  };

  const query = resolveQuery(container);

  try {
    /** Linked order on fulfillment — `order.*` per Medusa module-links query docs. */
    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "order.*"],
      filters: { id: data.id },
    });
    const row = fulfillments?.[0] as { id?: string; order?: { id?: string } } | undefined;
    const orderId = row?.order?.id;

    if (!orderId) {
      logger?.warn?.(`[shipment-tracking-email] No order for fulfillment ${data.id}`);
      return;
    }

    await sendFulfillmentTrackingEmailIfReady(container, logger, {
      orderId,
      fulfillmentId: data.id,
    });
  } catch (e) {
    logger?.warn?.(
      `[shipment-tracking-email] shipment.created: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
};
