import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  flattenOrderItemFromGraph,
  resolveLineTotalMajor,
} from "../../../../lib/store-order-graph-item";
import { toAmountMajor } from "../../../../lib/store-order-money";
import { getSubscriptionCycleWeeksFromMetadata } from "../../../../lib/subscription-cycle-metadata";

/**
 * Explicit graph fields only — no `*items.variant.product`-style wildcards.
 * `query.graph` returns **OrderItem** rows: prices live on nested `item` (OrderLineItem), same as
 * `formatOrder` in `@medusajs/order` — we flatten below before mapping amounts.
 */
const ORDER_DETAIL_GRAPH_FIELDS = [
  "id",
  "customer_id",
  "display_id",
  "status",
  "created_at",
  "currency_code",
  "email",
  "summary",
  "total",
  "raw_total",
  "subtotal",
  "tax_total",
  "discount_total",
  "shipping_total",
  "raw_shipping_total",
  "metadata",
  "shipping_address",
  "shipping_methods",
  "shipping_methods.data",
  "items.id",
  "items.quantity",
  "items.unit_price",
  "items.raw_unit_price",
  "items.total",
  "items.raw_total",
  "items.title",
  "items.variant_id",
  "items.detail",
  "items.detail.quantity",
  "items.detail.raw_quantity",
  "items.detail.unit_price",
  "items.detail.raw_unit_price",
  "items.item",
  "items.item.id",
  "items.item.title",
  "items.item.variant_id",
  "items.item.unit_price",
  "items.item.raw_unit_price",
  "items.item.total",
  "items.item.raw_total",
  "items.item.item_total",
  "items.item.metadata",
];

function pickOrderTotalRaw(raw: Record<string, unknown>): unknown {
  const s = raw.summary;
  if (Array.isArray(s) && s[0] != null && typeof s[0] === "object") {
    const first = s[0] as Record<string, unknown>;
    const totals = first.totals as Record<string, unknown> | undefined;
    if (totals?.current_order_total != null) return totals.current_order_total;
  }
  if (s != null && typeof s === "object") {
    const obj = s as Record<string, unknown>;
    if (obj.current_order_total != null) return obj.current_order_total;
    const totals = obj.totals as Record<string, unknown> | undefined;
    if (totals?.current_order_total != null) return totals.current_order_total;
  }
  const direct = raw.raw_total ?? raw.total;
  if (direct != null && direct !== "") return direct;
  return undefined;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * GET /store/orders/:id
 * Uses Query.graph (same primitive as subscribers) — stable populate path vs. getOrderDetailWorkflow.
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
    const { data: rows = [] } = await query.graph({
      entity: "order",
      fields: ORDER_DETAIL_GRAPH_FIELDS,
      filters: { id },
    });

    const rawOrder = rows?.[0] as Record<string, unknown> | undefined;
    if (!rawOrder?.id) {
      return res.status(404).json({
        message: "Ordre ikke fundet.",
        code: "ORDER_NOT_FOUND",
      });
    }

    const customerId =
      (rawOrder.customer_id as string | undefined) ??
      (rawOrder as { customerId?: string }).customerId;
    if (customerId !== authContext.actor_id) {
      return res.status(403).json({
        message: "Du har ikke adgang til denne ordre.",
        code: "FORBIDDEN",
      });
    }

    const createdAt = rawOrder.created_at ?? (rawOrder as { createdAt?: string }).createdAt;
    const shippingTotalRaw =
      (rawOrder as { raw_shipping_total?: unknown }).raw_shipping_total ??
      rawOrder.shipping_total ??
      (rawOrder as { shippingTotal?: unknown }).shippingTotal;
    const orderTotalRaw = pickOrderTotalRaw(rawOrder);
    const orderMeta = (rawOrder.metadata ?? {}) as Record<string, unknown>;
    const shippingMethods = rawOrder.shipping_methods as
      | Array<{ data?: Record<string, unknown> }>
      | undefined;
    const shippingMethodData =
      shippingMethods?.[0]?.data && typeof shippingMethods[0].data === "object"
        ? shippingMethods[0].data
        : null;

    const documents = (orderMeta.documents ?? {}) as Record<string, unknown>;
    const hasOrderConfirmationPdf = typeof documents.order_confirmation_pdf_base64 === "string";
    const hasInvoicePdf = typeof documents.invoice_pdf_base64 === "string";

    const rawItems = (rawOrder.items as Record<string, unknown>[] | undefined) ?? [];
    const flatItems = rawItems.map((row) => flattenOrderItemFromGraph(row));
    const mappedItems = flatItems.map((item) => {
      const itemMeta = (item.metadata ?? {}) as Record<string, unknown>;
      const quantity = typeof item.quantity === "number" ? item.quantity : 1;
      const unitPriceMajor = toAmountMajor(
        (item as { raw_unit_price?: unknown }).raw_unit_price ?? item.unit_price
      );
      return {
        id: String(item.id ?? (item as { detail?: { id?: string } }).detail?.id ?? ""),
        title: item.title as string | undefined,
        variant_id: item.variant_id as string | undefined,
        quantity,
        unit_price: unitPriceMajor,
        total: resolveLineTotalMajor(item, unitPriceMajor, quantity),
        metadata: item.metadata ?? {},
        is_subscription_line: getSubscriptionCycleWeeksFromMetadata(itemMeta) > 0,
      };
    });
    const itemsSubtotalMajor = roundToTwo(
      mappedItems.reduce((sum, item) => sum + (item.total ?? 0), 0)
    );
    const orderTotalMajor = toAmountMajor(orderTotalRaw);
    const shippingMajorDirect = toAmountMajor(shippingTotalRaw);
    const shippingMajorDerived =
      orderTotalMajor != null ? roundToTwo(Math.max(0, orderTotalMajor - itemsSubtotalMajor)) : undefined;
    const shippingMajor =
      shippingMajorDirect != null && shippingMajorDirect > 0
        ? shippingMajorDirect
        : shippingMajorDerived ?? shippingMajorDirect;

    res.json({
      order: {
        id: String(rawOrder.id),
        display_id: rawOrder.display_id as number | undefined,
        status: rawOrder.status as string | undefined,
        created_at: typeof createdAt === "string" ? createdAt : undefined,
        total: orderTotalMajor,
        currency_code: rawOrder.currency_code as string | undefined,
        shipping_total: shippingMajor,
        shipping_address: (rawOrder.shipping_address ?? {}) as Record<string, unknown>,
        shipping_method_data: shippingMethodData,
        is_renewal: orderMeta.renewal === true,
        items: mappedItems,
        tracking_url: null as string | null,
        tracking_number: null as string | null,
        metadata: orderMeta,
        has_order_confirmation_pdf: hasOrderConfirmationPdf,
        has_invoice_pdf: hasInvoicePdf,
        order_confirmation_pdf_url: hasOrderConfirmationPdf
          ? `/store/orders/${encodeURIComponent(String(rawOrder.id))}/documents/order-confirmation`
          : null,
        invoice_pdf_url: hasInvoicePdf
          ? `/store/orders/${encodeURIComponent(String(rawOrder.id))}/documents/invoice`
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
