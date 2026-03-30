import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";

const ON_HOLD_EXPIRY_DAYS = 30;

/**
 * Daily job: find subscriptions on_hold for > 30 days and set status to expired.
 * Cron: 0 10 * * * (10 AM daily)
 */
export default async function subscriptionExpirationJob(
  container: MedusaContainer
) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER
  ) as { info?: (m: string) => void };

  const subscriptionService = container.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ON_HOLD_EXPIRY_DAYS);

  const list: Awaited<ReturnType<SubscriptionModuleService["listSubscriptions"]>> = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const page = await subscriptionService.listSubscriptions(
      { status: "on_hold" },
      { take: pageSize, skip: offset, order: { on_hold_at: "ASC" } }
    );
    if (!page?.length) break;
    list.push(...page);
    if (page.length < pageSize) break;
  }
  let expired = 0;
  for (const sub of list) {
    const onHoldAt = (sub as { on_hold_at?: string | Date }).on_hold_at;
    if (onHoldAt && new Date(onHoldAt) < cutoff) {
      await subscriptionService.updateStatus(sub.id, "expired");
      expired++;
    }
  }

  if (expired > 0) {
    logger?.info?.(`[subscription-expiration] Expired ${expired} subscription(s)`);
  }
}

export const config = {
  name: "subscription-expiration",
  schedule: "0 10 * * *",
};
