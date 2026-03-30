import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendFulfillmentTrackingEmailIfReady } from "../lib/transactional-email/send-fulfillment-tracking-email";

type FulfillmentCreatedPayload = {
  order_id: string;
  fulfillment_id: string;
  no_notification?: boolean;
};

/**
 * Customer email when a fulfillment is created with tracking (labels may exist immediately or only after shipment).
 */
export default async function orderFulfillmentTrackingEmail({
  event,
  container,
}: SubscriberArgs<FulfillmentCreatedPayload>) {
  const data = event?.data;
  if (!data?.order_id || !data?.fulfillment_id || data.no_notification) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    warn?: (m: string) => void;
  };

  try {
    await sendFulfillmentTrackingEmailIfReady(container, logger, {
      orderId: data.order_id,
      fulfillmentId: data.fulfillment_id,
    });
  } catch (e) {
    logger?.warn?.(
      `[fulfillment-tracking-email] order.fulfillment_created: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};
