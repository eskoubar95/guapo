import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { renewSubscriptionWorkflow } from "../workflows/renew-subscription";

/**
 * Daily job: find subscriptions due for renewal (status=active, next_renewal_at <= now)
 * and run the renewal workflow for each.
 * Cron: 0 8 * * * (8 AM daily)
 */
export default async function subscriptionRenewalJob(
  container: MedusaContainer
) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  ) as { info?: (m: string) => void; error?: (m: string) => void };

  const subscriptionService = container.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const now = new Date();
  const active = await subscriptionService.listSubscriptions(
    { status: "active" },
    { take: 500 }
  );
  const list = (active ?? []).filter(
    (s) => s.next_renewal_at && new Date(s.next_renewal_at) <= now
  );
  if (list.length === 0) {
    logger?.info?.("[subscription-renewal] No subscriptions due for renewal");
    return;
  }

  logger?.info?.(
    `[subscription-renewal] Processing ${list.length} subscription(s)`
  );

  for (const sub of list) {
    if (sub.next_retry_at && new Date(sub.next_retry_at) > now) {
      continue;
    }
    try {
      const { result } = await renewSubscriptionWorkflow(container).run({
        input: { subscriptionId: sub.id },
      });
      if (result?.renewed) {
        logger?.info?.(
          `[subscription-renewal] Renewed subscription ${sub.id} -> order ${result.orderId}`
        );
      } else if (result?.skipped) {
        logger?.info?.(`[subscription-renewal] Skipped subscription ${sub.id}`);
      } else if (result?.error) {
        logger?.error?.(
          `[subscription-renewal] Failed ${sub.id}: ${result.error}`
        );
      }
    } catch (err) {
      logger?.error?.(
        `[subscription-renewal] Error processing ${sub.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
}

export const config = {
  name: "subscription-renewal",
  schedule: "0 8 * * *",
};
