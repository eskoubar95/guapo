import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription";
import type SubscriptionModuleService from "../../../modules/subscription/service";

/**
 * GET /admin/subscriptions
 * List all subscriptions with optional filters.
 * Supports ?enrich=true to include customer_email and product_title.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const status = req.query.status as string | undefined;
  const customerId = req.query.customer_id as string | undefined;
  const groupId = req.query.group_id as string | undefined;
  const enrich = req.query.enrich === "true";
  const take = Math.min(parseInt(String(req.query.limit ?? 50), 10), 100);
  const skip = parseInt(String(req.query.offset ?? 0), 10);

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;
  if (customerId) filters.customer_id = customerId;
  if (groupId) filters.group_id = groupId;

  const [subscriptions, count] = await subscriptionService.listAndCountSubscriptions(
    Object.keys(filters).length ? filters : {},
    { take, skip }
  );

  if (!enrich || !subscriptions?.length) {
    return res.json({
      subscriptions: subscriptions ?? [],
      count,
      limit: take,
      offset: skip,
    });
  }

  // Enrich: batch-fetch unique customers and variants
  const customerIds = [...new Set(subscriptions.map((s) => s.customer_id).filter(Boolean))];
  const variantIds = [...new Set(subscriptions.map((s) => s.variant_id).filter(Boolean))];

  const customerMap: Record<string, { email?: string; first_name?: string; last_name?: string }> = {};
  const variantMap: Record<string, { title?: string; product?: { title?: string; thumbnail?: string | null } }> = {};

  try {
    if (customerIds.length) {
      const customerModule = req.scope.resolve(Modules.CUSTOMER) as {
        listCustomers: (f: { id: string[] }) => Promise<Array<{ id: string; email?: string; first_name?: string; last_name?: string }>>;
      };
      const customers = await customerModule.listCustomers({ id: customerIds });
      for (const c of customers ?? []) customerMap[c.id] = c;
    }
  } catch { /* best-effort */ }

  try {
    if (variantIds.length) {
      const productModule = req.scope.resolve(Modules.PRODUCT) as {
        listProductVariants: (f: { id: string[] }, config?: { relations?: string[] }) => Promise<Array<{ id: string; title?: string; product?: { title?: string; thumbnail?: string | null } }>>;
      };
      const variants = await productModule.listProductVariants({ id: variantIds }, { relations: ["product"] });
      for (const v of variants ?? []) variantMap[v.id] = v;
    }
  } catch { /* best-effort */ }

  const enriched = subscriptions.map((s) => {
    const c = customerMap[s.customer_id] ?? {};
    const v = variantMap[s.variant_id] ?? {};
    return {
      ...s,
      customer_email: c.email ?? "",
      customer_name: [c.first_name, c.last_name].filter(Boolean).join(" "),
      product_title: v.product?.title ?? "",
      variant_title: v.title ?? "",
    };
  });

  res.json({
    subscriptions: enriched,
    count,
    limit: take,
    offset: skip,
  });
};
