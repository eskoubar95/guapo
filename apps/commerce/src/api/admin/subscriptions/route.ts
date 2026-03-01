import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription";
import type SubscriptionModuleService from "../../../modules/subscription/service";

/**
 * GET /admin/subscriptions
 * List all subscriptions with optional filters.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const status = req.query.status as string | undefined;
  const customerId = req.query.customer_id as string | undefined;
  const take = Math.min(parseInt(String(req.query.limit ?? 50), 10), 100);
  const skip = parseInt(String(req.query.offset ?? 0), 10);

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (customerId) filters.customer_id = customerId;

  const [subscriptions, count] = await subscriptionService.listAndCountSubscriptions(
    Object.keys(filters).length ? filters : {},
    { take, skip }
  );

  res.json({
    subscriptions: subscriptions ?? [],
    count,
    limit: take,
    offset: skip,
  });
};
