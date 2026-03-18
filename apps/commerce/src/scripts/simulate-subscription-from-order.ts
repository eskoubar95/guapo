/**
 * Simulate subscription creation from an existing order (for testing).
 * Re-emits order.placed so the real subscriber runs: payment_collection → Stripe data → create subscription.
 *
 * Usage:
 *   ORDER_ID=order_xxx pnpm -C apps/commerce simulate-subscription-from-order
 *   pnpm -C apps/commerce simulate-subscription-from-order -- order_xxx
 *
 * Use an order that:
 * - Has at least one line item with metadata.subscription_cycle (e.g. 4, 8, 12)
 * - Was paid with Stripe (so payment has customer + payment_method for off-session)
 * - Has customer_id set (logged-in checkout)
 *
 * If the order already has subscriptions linked, the subscriber skips (idempotent).
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function simulateSubscriptionFromOrder({
  container,
}: ExecArgs) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  ) as { info?: (m: string) => void; error?: (m: string) => void };

  const orderId = process.env.ORDER_ID ?? process.argv.slice(2)[0];

  if (!orderId) {
    logger?.info?.(
      "Usage: ORDER_ID=order_xxx pnpm -C apps/commerce simulate-subscription-from-order"
    );
    logger?.info?.(
      "Or: pnpm -C apps/commerce simulate-subscription-from-order -- <order_id>"
    );
    logger?.info?.(
      "Order must have subscription line items and Stripe payment (customer_id + payment_method)."
    );
    process.exit(1);
  }

  const eventBus = container.resolve(Modules.EVENT_BUS) as {
    emit: (event: { name: string; data: Record<string, unknown> }) => Promise<void>;
  };

  logger?.info?.(`Simulating order.placed for order ${orderId}…`);

  try {
    await eventBus.emit({
      name: "order.placed",
      data: { id: orderId },
    });
    logger?.info?.(
      "Event emitted. Check logs above for subscription creation (payment_collections, Stripe customer/pm, created subscription IDs)."
    );
    logger?.info?.(
      "Then run: SUBSCRIPTION_ID=sub_xxx pnpm -C apps/commerce simulate-renewal"
    );
  } catch (err) {
    logger?.error?.(
      `Emit failed: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}
