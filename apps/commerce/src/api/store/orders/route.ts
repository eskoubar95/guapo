import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type OrderRow = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * GET /store/orders
 * List orders for the authenticated customer. Sorted by created_at desc.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at se dine ordrer.",
      code: "UNAUTHORIZED",
    });
  }

  const limit = Math.min(Number(req.query?.limit) || 20, 50);
  const offset = Number(req.query?.offset) || 0;

  const query = req.scope.resolve("query") as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
      pagination?: { take: number; skip: number };
      order?: Record<string, string>;
    }) => Promise<{ data: OrderRow[]; metadata?: { count?: number } }>;
  };

  try {
    const { data: orders = [], metadata } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "created_at",
        "total",
        "currency_code",
        "metadata",
      ],
      filters: { customer_id: authContext.actor_id },
      pagination: { take: limit, skip: offset },
      order: { created_at: "DESC" },
    });

    const count = (metadata?.count ?? orders.length) as number;

    const list = (orders as OrderRow[]).map((o) => {
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      return {
        id: o.id,
        display_id: o.display_id,
        status: o.status,
        created_at: o.created_at,
        total: o.total,
        currency_code: o.currency_code,
        tracking_url: null as string | null,
        is_renewal: meta.renewal === true,
      };
    });

    res.json({
      orders: list,
      count,
      offset,
      limit,
    });
  } catch (err) {
    console.error("[store/orders] list failed:", err);
    return res.status(500).json({
      message: "Kunne ikke hente ordrer.",
      code: "INTERNAL_ERROR",
    });
  }
};
