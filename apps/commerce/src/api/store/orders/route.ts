import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows";
import { toAmountMajor } from "../../../lib/store-order-money";

/**
 * GET /store/orders
 * Uses getOrdersListWorkflow (same as core Medusa store list) for consistent totals + sort.
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

  try {
    const workflow = getOrdersListWorkflow(req.scope);
    const { result } = await workflow.run({
      input: {
        fields: [
          "id",
          "display_id",
          "status",
          "created_at",
          "summary",
          "total",
          "raw_total",
          "currency_code",
          "metadata",
          "items.id",
        ],
        variables: {
          filters: {
            customer_id: authContext.actor_id,
            is_draft_order: false,
          },
          skip: offset,
          take: limit,
          order: {
            created_at: "DESC",
          },
        },
      },
    });

    const payload = result as
      | { rows?: Record<string, unknown>[]; metadata?: { count?: number } }
      | Record<string, unknown>[];
    const rows = Array.isArray(payload) ? payload : payload.rows ?? [];
    const count =
      !Array.isArray(payload) && typeof payload.metadata?.count === "number"
        ? payload.metadata.count
        : rows.length;

    const list = rows.map((o) => {
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      const documents = (meta.documents ?? {}) as Record<string, unknown>;
      const hasOrderConfirmationPdf = typeof documents.order_confirmation_pdf_base64 === "string";
      const hasInvoicePdf = typeof documents.invoice_pdf_base64 === "string";
      const items = o.items as { id?: string }[] | undefined;
      return {
        id: String(o.id),
        display_id: o.display_id as number | undefined,
        status: o.status as string | undefined,
        created_at: o.created_at as string | undefined,
        total: toAmountMajor((o as { raw_total?: unknown }).raw_total ?? o.total),
        currency_code: o.currency_code as string | undefined,
        item_count: Array.isArray(items) ? items.length : 0,
        tracking_url: null as string | null,
        is_renewal: meta.renewal === true,
        has_order_confirmation_pdf: hasOrderConfirmationPdf,
        has_invoice_pdf: hasInvoicePdf,
        order_confirmation_pdf_url: hasOrderConfirmationPdf
          ? `/store/orders/${encodeURIComponent(String(o.id))}/documents/order-confirmation`
          : null,
        invoice_pdf_url: hasInvoicePdf
          ? `/store/orders/${encodeURIComponent(String(o.id))}/documents/invoice`
          : null,
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
