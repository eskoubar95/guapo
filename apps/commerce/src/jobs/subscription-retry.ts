import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { renewSubscriptionWorkflow } from "../workflows/renew-subscription";

/**
 * Daily job: find subscriptions with retry due (next_retry_at <= now)
 * and run the renewal workflow.
 * Cron: 0 9 * * * (9 AM daily, after main renewal job)
 */
export default async function subscriptionRetryJob(
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
      { take: pageSize, skip: offset, order: { next_retry_at: "ASC" } }
    );
    if (!page?.length) break;
    for (const sub of page) {
      if (sub.next_retry_at != null && new Date(sub.next_retry_at) <= now) {
        list.push(sub);
      }
    }
    if (page.length < pageSize) break;
  }
  if (list.length === 0) {
    return;
  }

  logger?.info?.(`[subscription-retry] Processing ${list.length} retry(s)`);

  for (const sub of list) {
    if (!sub.next_retry_at || new Date(sub.next_retry_at) > now) continue;
    try {
      const { result } = await renewSubscriptionWorkflow(container).run({
        input: { subscriptionId: sub.id },
      });
      if (result?.renewed) {
        logger?.info?.(
          `[subscription-retry] Recovered subscription ${sub.id} -> order ${result.orderId}`
        );
      } else if (result?.error) {
        logger?.error?.(
          `[subscription-retry] Retry failed ${sub.id}: ${result.error}`
        );
      }
    } catch (err) {
      logger?.error?.(
        `[subscription-retry] Error ${sub.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
}

export const config = {
  name: "subscription-retry",
  schedule: "0 9 * * *",
};
