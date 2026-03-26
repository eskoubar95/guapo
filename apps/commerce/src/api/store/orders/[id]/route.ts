import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type OrderDetail = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  shipping_total?: number;
  shipping_address?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  items?: Array<{
    id: string;
    title?: string;
    variant_id?: string;
    quantity?: number;
    unit_price?: number;
    total?: number;
    metadata?: Record<string, unknown>;
  }>;
  shipping_methods?: Array<{ data?: Record<string, unknown> }>;
};

/**
 * GET /store/orders/:id
 * Get one order. Requires auth and ownership (customer_id = actor_id).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at se ordren.",
      code: "UNAUTHORIZED",
    });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Order id required", code: "BAD_REQUEST" });
  }

  const query = req.scope.resolve("query") as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "customer_id",
        "status",
        "created_at",
        "total",
        "currency_code",
        "shipping_total",
        "shipping_address",
        "metadata",
        "items.id",
        "items.title",
        "items.variant_id",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.metadata",
        "shipping_methods.data",
      ],
      filters: { id },
    });

    const rawOrder = orders?.[0] as (OrderDetail & { customer_id?: string; createdAt?: string }) | undefined;
    if (!rawOrder) {
      return res.status(404).json({
        message: "Ordre ikke fundet.",
        code: "ORDER_NOT_FOUND",
      });
    }

    const customerId = rawOrder.customer_id ?? (rawOrder as unknown as { customerId?: string }).customerId;
    if (customerId !== authContext.actor_id) {
      return res.status(403).json({
        message: "Du har ikke adgang til denne ordre.",
        code: "FORBIDDEN",
      });
    }

    const createdAt = rawOrder.created_at ?? rawOrder.createdAt;
    const shippingTotal = rawOrder.shipping_total ?? (rawOrder as unknown as { shippingTotal?: number }).shippingTotal;
    const orderMeta = (rawOrder.metadata ?? {}) as Record<string, unknown>;
    const shippingMethods = rawOrder.shipping_methods;
    const shippingMethodData =
      shippingMethods?.[0]?.data && typeof shippingMethods[0].data === "object"
        ? shippingMethods[0].data
        : null;

    const documents = (orderMeta.documents ?? {}) as Record<string, unknown>;
    const hasOrderConfirmationPdf = typeof documents.order_confirmation_pdf_base64 === "string";
    const hasInvoicePdf = typeof documents.invoice_pdf_base64 === "string";

    res.json({
      order: {
        id: rawOrder.id,
        display_id: rawOrder.display_id,
        status: rawOrder.status,
        created_at: typeof createdAt === "string" ? createdAt : undefined,
        total: rawOrder.total,
        currency_code: rawOrder.currency_code,
        shipping_total: shippingTotal,
        shipping_address: rawOrder.shipping_address ?? {},
        shipping_method_data: shippingMethodData,
        is_renewal: orderMeta.renewal === true,
        items: (rawOrder.items ?? []).map((item: { id: string; title?: string; variant_id?: string; quantity?: number; unit_price?: number; total?: number; metadata?: Record<string, unknown> }) => {
          const itemMeta = (item.metadata ?? {}) as Record<string, unknown>;
          return {
            id: item.id,
            title: item.title,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            metadata: item.metadata ?? {},
            is_subscription_line: typeof itemMeta.subscription_cycle === "number",
          };
        }),
        tracking_url: null as string | null,
        tracking_number: null as string | null,
        metadata: orderMeta,
        has_order_confirmation_pdf: hasOrderConfirmationPdf,
        has_invoice_pdf: hasInvoicePdf,
        order_confirmation_pdf_url: hasOrderConfirmationPdf
          ? `/store/orders/${encodeURIComponent(rawOrder.id)}/documents/order-confirmation`
          : null,
        invoice_pdf_url: hasInvoicePdf
          ? `/store/orders/${encodeURIComponent(rawOrder.id)}/documents/invoice`
          : null,
      },
    });
  } catch (err) {
    console.error("[store/orders/:id] get failed:", err);
    return res.status(500).json({
      message: "Kunne ikke hente ordre.",
      code: "INTERNAL_ERROR",
    });
  }
};
