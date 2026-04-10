import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { applySubscriptionLineDiscountsForCart } from "../lib/apply-subscription-line-discounts";

export default async function applySubscriptionDiscount({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = event?.data?.id;
  if (!cartId) return;
  await applySubscriptionLineDiscountsForCart(container, cartId);
}

export const config: SubscriberConfig = {
  event: ["cart.updated"],
};
