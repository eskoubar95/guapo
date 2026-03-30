import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { resolveCustomerEmailAndLocale, subscriptionsUrlForLocale } from "../lib/transactional-email/customer-context";
import { sendTransactionalEmail } from "../lib/transactional-email/service";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";

const MS_DAY = 24 * 60 * 60 * 1000;

/**
 * Daily: email customers ~3 days before next_renewal_at (2–4 day window).
 * Cron: 7:30 AM — before renewal job at 8:00.
 */
export default async function subscriptionRenewalReminderJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    warn?: (m: string) => void;
  };

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const now = Date.now();
  const pageSize = 100;
  let sent = 0;

  for (let offset = 0; ; offset += pageSize) {
    const page = await subscriptionService.listSubscriptions(
      { status: "active" },
      { take: pageSize, skip: offset, order: { next_renewal_at: "ASC" } }
    );
    if (!page?.length) break;

    for (const sub of page) {
      if (sub.skip_next) continue;
      if (!sub.next_renewal_at) continue;
      const next = new Date(sub.next_renewal_at).getTime();
      const msUntil = next - now;
      if (msUntil < 2 * MS_DAY || msUntil > 4 * MS_DAY) continue;

      const renewalKey = new Date(sub.next_renewal_at).toISOString();
      const meta = (sub.metadata ?? {}) as Record<string, unknown>;
      if (meta.renewal_reminder_sent_for === renewalKey) continue;

      const ctx = await resolveCustomerEmailAndLocale(container, sub.customer_id);
      if (!ctx) {
        logger?.warn?.(`[subscription-renewal-reminder] No email for subscription ${sub.id}`);
        continue;
      }

      const result = await sendTransactionalEmail(
        {
          template: "renewal_reminder_3_days",
          to: ctx.email,
          locale: ctx.locale,
          idempotencyKey: `renewal_reminder:${sub.id}:${renewalKey}`,
          payload: {
            storefrontSubscriptionsUrl: subscriptionsUrlForLocale(ctx.locale),
            nextRenewalAtIso: renewalKey,
            cycleWeeks: sub.cycle_weeks ?? 8,
          },
        },
        logger
      );

      if (result.success) {
        await subscriptionService.updateSubscriptions([
          {
            id: sub.id,
            metadata: { ...meta, renewal_reminder_sent_for: renewalKey },
          },
        ]);
        sent += 1;
      }
    }

    if (page.length < pageSize) break;
  }

  if (sent > 0) {
    logger?.info?.(`[subscription-renewal-reminder] Sent ${sent} reminder(s)`);
  }
}

export const config = {
  name: "subscription-renewal-reminder",
  schedule: "30 7 * * *",
};
