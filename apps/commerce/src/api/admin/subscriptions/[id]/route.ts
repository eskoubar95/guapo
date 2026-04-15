import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../modules/subscription/service";

/**
 * GET /admin/subscriptions/:id
 * Returns the subscription enriched with:
 * - customer_name, customer_email
 * - product_title, variant_title, product_thumbnail
 * - linked_orders[] (all orders where metadata.subscription_id = id OR initial order from metadata.order_id)
 * - group_members[] (other subscriptions sharing the same group_id)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService
    .retrieveSubscription(id)
    .catch(() => null);

  if (!subscription) {
    return res.status(404).json({
      message: "Subscription not found",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>;
  };

  // Enrich: customer
  let customer_name = "";
  let customer_email = "";
  if (subscription.customer_id) {
    try {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "first_name", "last_name", "email"],
        filters: { id: subscription.customer_id },
      });
      const c = customers?.[0] as { first_name?: string; last_name?: string; email?: string } | undefined;
      if (c) {
        customer_name = [c.first_name, c.last_name].filter(Boolean).join(" ");
        customer_email = c.email ?? "";
      }
    } catch { /* enrichment is best-effort */ }
  }

  // Enrich: product variant
  let product_title = "";
  let variant_title = "";
  let product_thumbnail: string | null = null;
  if (subscription.variant_id) {
    try {
      const productModule = req.scope.resolve(Modules.PRODUCT) as {
        listProductVariants: (filters: Record<string, unknown>, config?: { relations?: string[] }) => Promise<Array<{
          id: string;
          title?: string;
          product?: { id: string; title?: string; thumbnail?: string | null };
        }>>;
      };
      const variants = await productModule.listProductVariants(
        { id: subscription.variant_id },
        { relations: ["product"] }
      );
      const v = variants?.[0];
      if (v) {
        variant_title = v.title ?? "";
        product_title = v.product?.title ?? "";
        product_thumbnail = v.product?.thumbnail ?? null;
      }
    } catch { /* enrichment is best-effort */ }
  }

  // Enrich: linked orders from module link + initial order fallback
  type OrderSummary = { id: string; status?: string; payment_status?: string; total?: number; created_at?: string; metadata?: Record<string, unknown> };
  const linkedOrdersMap = new Map<string, OrderSummary>();
  try {
    const { data: linkedData } = await query.graph({
      entity: "subscription",
      fields: [
        "id",
        "orders.id",
        "orders.status",
        "orders.payment_status",
        "orders.total",
        "orders.created_at",
        "orders.metadata",
      ],
      filters: { id },
    }) as { data: Array<{ id: string; orders?: OrderSummary[] }> };
    const linked = linkedData?.[0]?.orders ?? [];
    for (const order of linked) {
      linkedOrdersMap.set(order.id, order);
    }
    const initialOrderId = (subscription.metadata as Record<string, unknown> | null)?.order_id as string | undefined;
    if (initialOrderId && !linkedOrdersMap.has(initialOrderId)) {
      const { data: initialOrderData } = await query.graph({
        entity: "order",
        fields: ["id", "status", "payment_status", "total", "created_at", "metadata"],
        filters: { id: initialOrderId },
      }) as { data: OrderSummary[] };
      if (initialOrderData?.[0]) {
        linkedOrdersMap.set(initialOrderData[0].id, initialOrderData[0]);
      }
    }
  } catch { /* enrichment is best-effort */ }
  const linkedOrders = [...linkedOrdersMap.values()].sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Enrich: group members (other subscriptions sharing group_id)
  type GroupMember = { id: string; status: string; cycle_weeks: number; delivery_count: number; variant_id: string };
  const groupMembers: GroupMember[] = [];
  const groupId = (subscription as unknown as Record<string, unknown>).group_id as string | null | undefined;
  if (groupId) {
    try {
      const all = await subscriptionService.listSubscriptions({}, { take: 200 });
      for (const s of all ?? []) {
        const sGroupId = (s as unknown as Record<string, unknown>).group_id as string | null | undefined;
        if (sGroupId === groupId && s.id !== id) {
          groupMembers.push({
            id: s.id,
            status: s.status,
            cycle_weeks: s.cycle_weeks,
            delivery_count: s.delivery_count,
            variant_id: s.variant_id,
          });
        }
      }
    } catch { /* enrichment is best-effort */ }
  }

  res.json({
    subscription: {
      ...subscription,
      customer_name,
      customer_email,
      product_title,
      variant_title,
      product_thumbnail,
      linked_orders: linkedOrders,
      group_members: groupMembers,
    },
  });
};
