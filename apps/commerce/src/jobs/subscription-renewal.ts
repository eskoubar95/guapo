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
  const list: Awaited<ReturnType<SubscriptionModuleService["listSubscriptions"]>> = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const page = await subscriptionService.listSubscriptions(
      { status: "active" },
      { take: pageSize, skip: offset, order: { next_renewal_at: "ASC" } }
    );
    if (!page?.length) break;
    for (const sub of page) {
      if (sub.next_renewal_at && new Date(sub.next_renewal_at) <= now) {
        list.push(sub);
      }
    }
    if (page.length < pageSize) break;
  }
  if (list.length === 0) {
    logger?.info?.("[subscription-renewal] No subscriptions due for renewal");
    return;
  }

  logger?.info?.(
    `[subscription-renewal] Processing ${list.length} subscription(s)`
  );

  const queue = list.filter(
    (sub) => !(sub.next_retry_at && new Date(sub.next_retry_at) > now)
  );

  const concurrency = 5;
  for (let i = 0; i < queue.length; i += concurrency) {
    const batch = queue.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const { result } = await renewSubscriptionWorkflow(container).run({
          input: { subscriptionId: sub.id },
        });
        return { subId: sub.id, result };
      })
    );
    for (const result of results) {
      if (result.status === "rejected") {
        logger?.error?.(
          `[subscription-renewal] Error in batch: ${
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason)
          }`
        );
        continue;
      }
      const { subId, result: renewalResult } = result.value;
      if (renewalResult?.renewed) {
        logger?.info?.(
          `[subscription-renewal] Renewed subscription ${subId} -> order ${renewalResult.orderId}`
        );
      } else if (renewalResult?.skipped) {
        logger?.info?.(`[subscription-renewal] Skipped subscription ${subId}`);
      } else if (renewalResult?.error) {
        logger?.error?.(
          `[subscription-renewal] Failed ${subId}: ${renewalResult.error}`
        );
      }
    }
  }
}

export const config = {
  name: "subscription-renewal",
  schedule: "0 8 * * *",
};
