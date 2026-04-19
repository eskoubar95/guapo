import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { sendSlackNotify } from "../lib/slack-notify/send-slack-notify";
import { toAmountMajor } from "../lib/store-order-money";

export default async function slackNotifyOrderPlaced({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id;
  if (!orderId) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as
    | { warn?: (m: string) => void }
    | undefined;

  try {
    const workflow = getOrdersListWorkflow(container);
    const { result } = await workflow.run({
      input: {
        fields: [
          "id",
          "display_id",
          "currency_code",
          "total",
          "raw_total",
          "metadata",
        ],
        variables: {
          filters: { id: orderId },
          skip: 0,
          take: 1,
        },
      },
    });

    const payload = result as
      | { rows?: Record<string, unknown>[] }
      | Record<string, unknown>[]
      | undefined;
    const rows = Array.isArray(payload) ? payload : payload?.rows ?? [];
    const order = rows[0] as
      | {
          id?: string;
          display_id?: number;
          currency_code?: string;
          total?: unknown;
          raw_total?: unknown;
          metadata?: Record<string, unknown> | null;
        }
      | undefined;

    if (!order?.id) {
      logger?.warn?.(`[slack-notify-order-placed] Order not found: ${orderId}`);
      return;
    }

    if (order.metadata?.renewal === true) {
      return;
    }

    const total = toAmountMajor(order.raw_total ?? order.total);
    const subscriptionService = container.resolve<SubscriptionModuleService>(
      SUBSCRIPTION_MODULE
    );
    const subscriptionIds = await subscriptionService.listSubscriptionIdsByOrderId(order.id);

    await sendSlackNotify(container, {
      type: "order.placed",
      payload: {
        orderId: order.id,
        displayId: order.display_id,
        currencyCode: order.currency_code ?? "dkk",
        total: total ?? "—",
        subscriptionIds,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(`[slack-notify-order-placed] ${msg}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
