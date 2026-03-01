import { model } from "@medusajs/framework/utils";

export const SUBSCRIPTION_STATUS = [
  "active",
  "paused",
  "on_hold",
  "cancelled",
  "expired",
];
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "on_hold"
  | "cancelled"
  | "expired";

export const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  status: model.enum(["active", "paused", "on_hold", "cancelled", "expired"]).default("active"),
  cycle_weeks: model.number(), // 4, 8, or 12
  next_renewal_at: model.dateTime(),
  last_renewal_at: model.dateTime().nullable(),
  delivery_count: model.number().default(0),
  stripe_customer_id: model.text(),
  stripe_payment_method_id: model.text(),
  discount_percent: model.number().default(5),
  variant_id: model.text(),
  quantity: model.number().default(1),
  shipping_address: model.json(), // Address object
  billing_address: model.json(), // Address object
  shipping_option_id: model.text(),
  metadata: model.json().nullable(),
  // Retry/recovery
  retry_count: model.number().default(0),
  next_retry_at: model.dateTime().nullable(),
  skip_next: model.boolean().default(false),
  on_hold_at: model.dateTime().nullable(),
}).indexes([
  { on: ["customer_id"] },
  { on: ["status"] },
  { on: ["next_renewal_at"] },
  { on: ["status", "next_renewal_at"] },
]);
