import type { MedusaContainer } from "@medusajs/framework/types";
import { resolveCustomerEmailAndLocale, subscriptionsUrlForLocale } from "./customer-context";
import { sendTransactionalEmail } from "./service";
import type { TransactionalTemplate } from "./types";

type LoggerLike = {
  info?: (m: string) => void;
  warn?: (m: string) => void;
};

/**
 * Fire-and-forget confirmation after pause / resume / cancel (store or admin).
 */
export function sendSubscriptionLifecycleMail(input: {
  container: MedusaContainer;
  customerId: string;
  subscriptionId: string;
  template: Extract<
    TransactionalTemplate,
    "subscription_paused" | "subscription_resumed" | "subscription_cancelled"
  >;
  logger?: LoggerLike;
}): void {
  const { container, customerId, subscriptionId, template, logger } = input;
  void (async () => {
    try {
      const ctx = await resolveCustomerEmailAndLocale(container, customerId);
      if (!ctx) {
        logger?.warn?.(`[subscription-lifecycle-email] No email for ${template} ${subscriptionId}`);
        return;
      }
      await sendTransactionalEmail(
        {
          template,
          to: ctx.email,
          locale: ctx.locale,
          idempotencyKey: `${template}:${subscriptionId}`,
          payload: {
            storefrontSubscriptionsUrl: subscriptionsUrlForLocale(ctx.locale),
          },
        },
        logger
      );
    } catch (e) {
      logger?.warn?.(
        `[subscription-lifecycle-email] ${template} failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  })();
}
