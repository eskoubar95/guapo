/**
 * Simulate subscription renewal for testing.
 * Usage: pnpm exec medusa exec ./src/scripts/simulate-renewal.ts [subscription_id]
 *
 * If subscription_id is omitted, creates a test subscription and runs renewal.
 * For staging: use an existing subscription ID from a completed subscription order.
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { renewSubscriptionWorkflow } from "../workflows/renew-subscription";

export default async function simulateRenewal({ container }: ExecArgs) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  ) as { info?: (m: string) => void; error?: (m: string) => void };

  const subscriptionId =
    process.env.SUBSCRIPTION_ID ?? process.argv.slice(2)[0];

  if (!subscriptionId) {
    logger?.info?.(
      "Usage: pnpm exec medusa exec ./src/scripts/simulate-renewal.ts <subscription_id>"
    );
    logger?.info?.(
      "Get a subscription ID from Medusa Admin (Subscriptions) or from a completed subscription order."
    );
    process.exit(1);
  }

  const subscriptionService = container.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const sub = await subscriptionService
    .retrieveSubscription(subscriptionId)
    .catch(() => null);

  if (!sub) {
    logger?.error?.(`Subscription ${subscriptionId} not found`);
    process.exit(1);
  }

  logger?.info?.(
    `Simulating renewal for subscription ${subscriptionId} (status=${sub.status}, next_renewal=${sub.next_renewal_at})`
  );

  try {
    const { result } = await renewSubscriptionWorkflow(container).run({
      input: { subscriptionId },
    });

    if (result?.renewed) {
      logger?.info?.(`✅ Renewal success. Order created: ${result.orderId}`);
    } else if (result?.skipped) {
      logger?.info?.("✅ Subscription was skipped (skip_next=true)");
    } else if (result?.error) {
      logger?.error?.(`❌ Renewal failed: ${result.error}`);
      if (result.retryCount != null) {
        logger?.info?.(`Retry count: ${result.retryCount}`);
      }
      process.exit(1);
    } else {
      logger?.info?.("Renewal completed (no order created)");
    }
  } catch (err) {
    logger?.error?.(
      `Renewal error: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}
