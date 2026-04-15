import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../modules/subscription/service";
import {
  flattenOrderItemFromGraph,
  resolveLineTotalMajor,
} from "../../../../lib/store-order-graph-item";
import { toAmountMajor } from "../../../../lib/store-order-money";

/** Subset of order graph fields needed to resolve subscription line prices from the initial order. */
const ORDER_ITEMS_GRAPH_FIELDS = [
  "id",
  "currency_code",
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

type LinkedOrderRow = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  raw_total?: unknown;
  currency_code?: string;
  metadata?: Record<string, unknown>;
};

type LinkedOrderGraphRow = LinkedOrderRow & { customer_id?: string | null };

function toPublicLinkedOrder(row: LinkedOrderGraphRow): LinkedOrderRow {
  return {
    id: row.id,
    display_id: row.display_id,
    status: row.status,
    created_at: row.created_at,
    total: row.total,
    raw_total: row.raw_total,
    currency_code: row.currency_code,
    metadata: row.metadata,
  };
}

const ORDER_LINK_SUMMARY_FIELDS = [
  "id",
  "display_id",
  "customer_id",
  "status",
  "created_at",
  "total",
  "raw_total",
  "currency_code",
  "metadata",
] as const;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * GET /store/subscriptions/:id
 * Retrieve one subscription. Requires auth and ownership.
 * Enriches with catalog titles/thumbnail, line(s) priced from the initial order when possible,
 * and linked renewal orders (same customer only).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authContext = (req as unknown as { auth_context?: { actor_id: string } })
    .auth_context;
  if (!authContext?.actor_id) {
    return res.status(401).json({
      message: "Log ind for at se abonnementet.",
      code: "UNAUTHORIZED",
    });
  }

  const { id } = req.params;
  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subscription = await subscriptionService
    .retrieveSubscription(id)
    .catch(() => null);

  if (!subscription) {
    return res.status(404).json({
      message: "Abonnement ikke fundet.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  }

  if (subscription.customer_id !== authContext.actor_id) {
    return res.status(403).json({
      message: "Du har ikke adgang til dette abonnement.",
      code: "FORBIDDEN",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (opts: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data: unknown[] }>;
  };

  let productTitle = "";
  let variantTitle = "";
  let thumbnail: string | null = null;
  if (subscription.variant_id) {
    try {
      const productModule = req.scope.resolve(Modules.PRODUCT) as {
        listProductVariants: (
          filters: Record<string, unknown>,
          config?: { relations?: string[] }
        ) => Promise<
          Array<{
            id: string;
            title?: string;
            product?: { id: string; title?: string; thumbnail?: string | null };
          }>
        >;
      };
      const variants = await productModule.listProductVariants(
        { id: subscription.variant_id },
        { relations: ["product"] }
      );
      const v = variants?.[0];
      if (v) {
        variantTitle = v.title ?? "";
        productTitle = v.product?.title ?? "";
        thumbnail = v.product?.thumbnail ?? null;
      }
    } catch {
      /* titles optional */
    }
  }

  const quantity = typeof subscription.quantity === "number" ? subscription.quantity : 1;
  const discountPercent = subscription.discount_percent ?? 0;

  type SubscriptionLine = {
    title: string;
    product_title: string;
    variant_title: string;
    thumbnail: string | null;
    quantity: number;
    unit_price: number | undefined;
    line_total: number | undefined;
    currency_code: string | undefined;
    discount_percent: number;
  };

  let lines: SubscriptionLine[] = [];

  const initialOrderId = (subscription.metadata as Record<string, unknown> | null)?.order_id as
    | string
    | undefined;

  if (initialOrderId && subscription.variant_id) {
    try {
      const { data: orderRows = [] } = await query.graph({
        entity: "order",
        fields: ORDER_ITEMS_GRAPH_FIELDS,
        filters: { id: initialOrderId },
      });
      const rawOrder = orderRows?.[0] as Record<string, unknown> | undefined;
      const cust = rawOrder?.customer_id as string | undefined;
      if (rawOrder?.id && cust === authContext.actor_id) {
        const currency = rawOrder.currency_code as string | undefined;
        const rawItems = (rawOrder.items as Record<string, unknown>[] | undefined) ?? [];
        const flatItems = rawItems.map((row) => flattenOrderItemFromGraph(row));
        const match = flatItems.find(
          (it) => String(it.variant_id ?? "") === String(subscription.variant_id)
        );
        if (match) {
          const qty = typeof match.quantity === "number" ? match.quantity : quantity;
          const unitPriceMajor = toAmountMajor(
            (match as { raw_unit_price?: unknown }).raw_unit_price ?? match.unit_price
          );
          const lineTotal = resolveLineTotalMajor(match, unitPriceMajor, qty);
          const displayTitle =
            (match.title as string | undefined) ||
            [productTitle, variantTitle].filter(Boolean).join(" · ") ||
            productTitle ||
            variantTitle ||
            "–";
          lines = [
            {
              title: displayTitle,
              product_title: productTitle,
              variant_title: variantTitle,
              thumbnail,
              quantity: qty,
              unit_price: unitPriceMajor != null ? roundToTwo(unitPriceMajor) : undefined,
              line_total: lineTotal != null ? roundToTwo(lineTotal) : undefined,
              currency_code: currency,
              discount_percent: discountPercent,
            },
          ];
        }
      }
    } catch {
      /* fall through to catalog-only line */
    }
  }

  if (lines.length === 0) {
    const displayTitle = [productTitle, variantTitle].filter(Boolean).join(" · ") || productTitle || variantTitle || "–";
    lines = [
      {
        title: displayTitle,
        product_title: productTitle,
        variant_title: variantTitle,
        thumbnail,
        quantity,
        unit_price: undefined,
        line_total: undefined,
        currency_code: undefined,
        discount_percent: discountPercent,
      },
    ];
  }

  const linkedOrdersMap = new Map<string, LinkedOrderRow>();
  const customerId = authContext.actor_id;

  try {
    const { data: linkedData } = (await query.graph({
      entity: "subscription",
      fields: [
        "id",
        "orders.id",
        "orders.display_id",
        "orders.customer_id",
        "orders.status",
        "orders.created_at",
        "orders.total",
        "orders.raw_total",
        "orders.currency_code",
        "orders.metadata",
      ],
      filters: { id },
    })) as { data: Array<{ id: string; orders?: LinkedOrderGraphRow[] }> };
    const linked = linkedData?.[0]?.orders ?? [];
    const needsOwnershipVerify: string[] = [];

    for (const order of linked) {
      if (!order?.id) continue;
      if (order.customer_id === customerId) {
        linkedOrdersMap.set(order.id, toPublicLinkedOrder(order));
      } else if (order.customer_id == null || order.customer_id === "") {
        needsOwnershipVerify.push(order.id);
      }
    }

    if (needsOwnershipVerify.length > 0) {
      try {
        const { data: verified = [] } = (await query.graph({
          entity: "order",
          fields: [...ORDER_LINK_SUMMARY_FIELDS],
          filters: {
            id: needsOwnershipVerify,
            customer_id: customerId,
          },
        })) as { data: LinkedOrderGraphRow[] };
        for (const row of verified) {
          if (row?.id) {
            linkedOrdersMap.set(row.id, toPublicLinkedOrder(row));
          }
        }
      } catch {
        for (const orderId of needsOwnershipVerify) {
          try {
            const { data: one = [] } = (await query.graph({
              entity: "order",
              fields: [...ORDER_LINK_SUMMARY_FIELDS],
              filters: { id: orderId, customer_id: customerId },
            })) as { data: LinkedOrderGraphRow[] };
            const row = one[0];
            if (row?.id) {
              linkedOrdersMap.set(row.id, toPublicLinkedOrder(row));
            }
          } catch {
            /* skip id */
          }
        }
      }
    }

    if (initialOrderId && !linkedOrdersMap.has(initialOrderId)) {
      const { data: initialOrderData } = (await query.graph({
        entity: "order",
        fields: [...ORDER_LINK_SUMMARY_FIELDS],
        filters: { id: initialOrderId },
      })) as { data: LinkedOrderGraphRow[] };
      const o = initialOrderData?.[0];
      if (o?.id && o.customer_id === customerId) {
        linkedOrdersMap.set(o.id, toPublicLinkedOrder(o));
      }
    }
  } catch {
    /* orders optional */
  }

  const ordersPayload = [...linkedOrdersMap.values()]
    .map((o) => {
      const meta = (o.metadata ?? {}) as Record<string, unknown>;
      const documents = (meta.documents ?? {}) as Record<string, unknown>;
      const hasOrderConfirmationPdf = typeof documents.order_confirmation_pdf_base64 === "string";
      const hasInvoicePdf = typeof documents.invoice_pdf_base64 === "string";
      return {
        id: o.id,
        display_id: o.display_id,
        status: o.status,
        created_at: o.created_at,
        total: toAmountMajor(o.raw_total ?? o.total),
        currency_code: o.currency_code,
        is_renewal: meta.renewal === true,
        has_order_confirmation_pdf: hasOrderConfirmationPdf,
        has_invoice_pdf: hasInvoicePdf,
        order_confirmation_pdf_url: hasOrderConfirmationPdf
          ? `/store/orders/${encodeURIComponent(o.id)}/documents/order-confirmation`
          : null,
        invoice_pdf_url: hasInvoicePdf
          ? `/store/orders/${encodeURIComponent(o.id)}/documents/invoice`
          : null,
      };
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return tb - ta;
    });

  res.json({
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cycle_weeks: subscription.cycle_weeks,
      next_renewal_at: subscription.next_renewal_at,
      last_renewal_at: subscription.last_renewal_at,
      delivery_count: subscription.delivery_count,
      discount_percent: subscription.discount_percent,
      variant_id: subscription.variant_id,
      quantity: subscription.quantity,
      skip_next: subscription.skip_next,
      shipping_address: subscription.shipping_address,
      billing_address: subscription.billing_address,
      delivery_data: (subscription as { delivery_data?: unknown }).delivery_data ?? null,
      metadata: subscription.metadata,
      last_failure_reason: (subscription as { last_failure_reason?: string | null }).last_failure_reason ?? null,
      on_hold_at: (subscription as { on_hold_at?: string | null }).on_hold_at ?? null,
      lines,
      orders: ordersPayload,
    },
  });
};
