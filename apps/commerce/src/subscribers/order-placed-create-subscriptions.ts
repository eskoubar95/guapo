import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { createSubscriptionsForPlacedOrder } from "../lib/create-subscriptions-from-placed-order";

/**
 * Async path: same logic as invoked from order-placed-transactional-documents (idempotent).
 */
export default async function orderPlacedCreateSubscriptions({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;
  await createSubscriptionsForPlacedOrder(container, orderId);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
