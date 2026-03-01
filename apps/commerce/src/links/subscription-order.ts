import SubscriptionModule from "../modules/subscription";
import OrderModule from "@medusajs/medusa/order";
import { defineLink } from "@medusajs/framework/utils";

/**
 * Links Subscription to Order (one subscription -> many orders via renewals).
 * A subscription can have multiple orders (initial + renewals).
 * An order from a renewal is linked to exactly one subscription.
 */
export default defineLink(
  { linkable: SubscriptionModule.linkable.subscription },
  { linkable: OrderModule.linkable.order, isList: true }
);
