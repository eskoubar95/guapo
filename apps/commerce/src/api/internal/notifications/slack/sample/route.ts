import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";
import { listSubscriptionsForOrder } from "../../../../../lib/create-subscriptions-from-placed-order";
import { toAmountMajor } from "../../../../../lib/store-order-money";
import type { SlackNotifyEnvelope } from "../../../../../lib/slack-notify/types";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";

/**
 * GET /internal/notifications/slack/sample?kind=order|subscription
 * Auth: Bearer NOTIFY_SHARED_SECRET — used by slack-notify replay (production-safe dry run).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const auth = req.headers.authorization;
  const secret = process.env.NOTIFY_SHARED_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const kind = String(req.query?.kind ?? "order");

  if (kind === "subscription") {
    const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
      SUBSCRIPTION_MODULE
    );
    const [rows] = await subscriptionService.listAndCountSubscriptions(
      {},
      { take: 1, order: { created_at: "DESC" } }
    );
    const sub = rows?.[0];
    if (!sub?.id) {
      return res.status(404).json({ message: "No subscription found" });
    }
    const orderId = (sub.metadata as Record<string, unknown> | null)?.order_id;
    const envelope: SlackNotifyEnvelope = {
      type: "subscription.updated",
      payload: {
        subscriptionId: sub.id,
        action: "sample",
        status: sub.status,
        cycleWeeks: sub.cycle_weeks,
        orderId: typeof orderId === "string" ? orderId : undefined,
      },
    };
    return res.json(envelope);
  }

  if (kind !== "order") {
    return res.status(400).json({ message: "Invalid kind" });
  }

  const workflow = getOrdersListWorkflow(req.scope);
  const { result } = await workflow.run({
    input: {
      fields: [
        "id",
        "display_id",
        "status",
        "created_at",
        "currency_code",
        "total",
        "raw_total",
      ],
      variables: {
        filters: { is_draft_order: false },
        skip: 0,
        take: 1,
        order: { created_at: "DESC" },
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
      }
    | undefined;

  if (!order?.id) {
    return res.status(404).json({ message: "No order found" });
  }

  const total = toAmountMajor(order.raw_total ?? order.total);
  const subs = await listSubscriptionsForOrder(req.scope, order.id);
  const subscriptionIds = subs.map((s) => s.id);

  const envelope: SlackNotifyEnvelope = {
    type: "order.placed",
    payload: {
      orderId: order.id,
      displayId: order.display_id,
      currencyCode: order.currency_code ?? "dkk",
      total: total ?? "—",
      subscriptionIds,
      note: "sample",
    },
  };
  return res.json(envelope);
};
