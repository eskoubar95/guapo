import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { ChargeRenewalStripeResult } from "../subscription-renewal/charge-stripe-renewal";
import { SUBSCRIPTION_MODULE } from "../../modules/subscription";
import type SubscriptionModuleService from "../../modules/subscription/service";
import { resolveCustomerEmailAndLocale, subscriptionsUrlForLocale } from "./customer-context";
import { sendTransactionalEmail } from "./service";
import { sendSlackNotify } from "../slack-notify/send-slack-notify";

type LoggerLike = {
  info?: (m: string) => void;
  warn?: (m: string) => void;
  error?: (m: string) => void;
};

/**
 * After a failed renewal charge: notify customer (retry vs on hold vs 3DS).
 */
export async function notifyAfterRenewalPaymentFailure(input: {
  container: MedusaContainer;
  subscriptionId: string;
  chargeResult: Extract<ChargeRenewalStripeResult, { ok: false }>;
  logger?: LoggerLike;
}): Promise<void> {
  const { container, subscriptionId, chargeResult, logger } = input;
  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const updated = await subscriptionService.retrieveSubscription(subscriptionId);
  const ctx = await resolveCustomerEmailAndLocale(container, updated.customer_id);
  if (!ctx) {
    logger?.warn?.(`[subscription-renewal-email] No customer email for subscription ${subscriptionId}`);
    return;
  }
  const url = subscriptionsUrlForLocale(ctx.locale);

  if (chargeResult.requiresAction) {
    await sendTransactionalEmail(
      {
        template: "payment_failed_final_on_hold",
        to: ctx.email,
        locale: ctx.locale,
        idempotencyKey: `payment_auth:${subscriptionId}:${String(updated.on_hold_at ?? "na")}`,
        payload: {
          storefrontSubscriptionsUrl: url,
          reason: "authentication_required",
        },
      },
      logger
    );
    void sendSlackNotify(container, {
      type: "subscription.alert",
      channel: "alerts",
      payload: {
        subscriptionId,
        reason: "authentication_required",
        detail:
          typeof chargeResult.error === "string"
            ? chargeResult.error
            : String(chargeResult.error ?? ""),
      },
    });
    return;
  }

  if (updated.status === "on_hold") {
    await sendTransactionalEmail(
      {
        template: "payment_failed_final_on_hold",
        to: ctx.email,
        locale: ctx.locale,
        idempotencyKey: `payment_on_hold:${subscriptionId}:${String(updated.on_hold_at ?? "na")}`,
        payload: {
          storefrontSubscriptionsUrl: url,
          reason: "payment_exhausted",
        },
      },
      logger
    );
    void sendSlackNotify(container, {
      type: "subscription.alert",
      channel: "alerts",
      payload: {
        subscriptionId,
        reason: "payment_exhausted",
        detail: String(updated.last_failure_reason ?? ""),
      },
    });
    return;
  }

  const attempt: 1 | 2 = chargeResult.retryCount === 1 ? 1 : 2;
  await sendTransactionalEmail(
    {
      template: "payment_failed_retry_1",
      to: ctx.email,
      locale: ctx.locale,
      idempotencyKey: `payment_retry:${subscriptionId}:${chargeResult.retryCount}`,
      payload: {
        storefrontSubscriptionsUrl: url,
        failureAttempt: attempt,
      },
    },
    logger
  );
}

/**
 * After a successful renewal following previous failures (retry_count was &gt; 0).
 */
export async function notifySubscriptionPaymentRecovered(input: {
  container: MedusaContainer;
  subscriptionId: string;
  customerId: string;
  renewalOrderId: string;
  logger?: LoggerLike;
}): Promise<void> {
  const ctx = await resolveCustomerEmailAndLocale(input.container, input.customerId);
  if (!ctx) {
    input.logger?.warn?.(
      `[subscription-renewal-email] No customer email for payment_recovered ${input.subscriptionId}`
    );
    return;
  }
  await sendTransactionalEmail(
    {
      template: "payment_recovered",
      to: ctx.email,
      locale: ctx.locale,
      idempotencyKey: `payment_recovered:${input.subscriptionId}:${input.renewalOrderId}`,
      payload: {
        storefrontSubscriptionsUrl: subscriptionsUrlForLocale(ctx.locale),
      },
    },
    input.logger
  );
}
