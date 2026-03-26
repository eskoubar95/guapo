import type { StoreOrderDetail, StoreOrderDetailItem } from "@/lib/orders";

function extractShippingMethodData(o: Record<string, unknown>): Record<string, unknown> | null | undefined {
  const direct = o.shipping_method_data;
  if (direct && typeof direct === "object") {
    return direct as Record<string, unknown>;
  }
  const methods = o.shipping_methods as Array<{ data?: Record<string, unknown> }> | undefined;
  const data = methods?.[0]?.data;
  if (data && typeof data === "object") return data;
  return undefined;
}

/** Values at or above this in minor units are treated as already minor (sessionStorage heuristic). */
const SESSION_MINOR_ALREADY_THRESHOLD = 10_000;
/**
 * Upper bound (exclusive) for values we treat as major units when hydrating from sessionStorage
 * (e.g. 150.5 DKK → 15050 minor). Above this, assume minor units.
 */
const SESSION_MAJOR_MAX_EXCLUSIVE = 100_000;

export function toMajor(amount: number | undefined): number {
  if (amount == null) return 0;
  return amount / 100;
}

/** If value looks like major units (e.g. 150 or 150.5 for DKK), convert to minor for consistent display. */
export function ensureMinorAmount(value: number | undefined, fromSessionStorage: boolean): number | undefined {
  if (value == null || !fromSessionStorage) return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  if (value >= SESSION_MINOR_ALREADY_THRESHOLD) return value;
  if (value > 0 && value < SESSION_MAJOR_MAX_EXCLUSIVE) return Math.round(value * 100);
  return value;
}

/** Normalize order from sessionStorage or API (may be camelCase or partial). When fromSessionStorage, amounts may be in major units. */
export function normalizeOrder(raw: unknown, fromSessionStorage = false): StoreOrderDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "");
  if (!id) return null;
  const rawItems = Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : [];
  const items: StoreOrderDetailItem[] = rawItems.map((item) => {
    const up = item.unit_price as number | undefined;
    const tot = item.total as number | undefined;
    return {
      id: String(item.id ?? ""),
      title: item.title as string | undefined,
      variant_id: item.variant_id as string | undefined,
      quantity: item.quantity as number | undefined,
      unit_price: ensureMinorAmount(up, fromSessionStorage) ?? up,
      total: ensureMinorAmount(tot, fromSessionStorage) ?? tot,
      metadata: (item.metadata as Record<string, unknown>) ?? {},
      is_subscription_line:
        typeof (item.metadata as Record<string, unknown>)?.subscription_cycle === "number" ||
        Boolean(item.is_subscription_line),
    };
  });
  const totalRaw = o.total as number | undefined;
  const shippingRaw = (o.shipping_total ?? (o as Record<string, unknown>).shippingTotal) as number | undefined;
  return {
    id,
    display_id: o.display_id as number | undefined,
    status: o.status as string | undefined,
    created_at: (o.created_at ?? (o as Record<string, unknown>).createdAt) as string | undefined,
    total: ensureMinorAmount(totalRaw, fromSessionStorage) ?? totalRaw,
    currency_code: (o.currency_code ?? (o as Record<string, unknown>).currency_code) as string | undefined,
    shipping_total: ensureMinorAmount(shippingRaw, fromSessionStorage) ?? shippingRaw,
    shipping_address: (o.shipping_address ?? (o as Record<string, unknown>).shipping_address) as Record<string, unknown> | undefined,
    shipping_method_data: extractShippingMethodData(o),
    is_renewal: Boolean(o.is_renewal),
    items,
    tracking_url: (o.tracking_url as string | null) ?? null,
    tracking_number: (o.tracking_number as string | null) ?? null,
    metadata: (o.metadata as Record<string, unknown>) ?? undefined,
    has_order_confirmation_pdf: Boolean(o.has_order_confirmation_pdf),
    has_invoice_pdf: Boolean(o.has_invoice_pdf),
    order_confirmation_pdf_url: (o.order_confirmation_pdf_url as string | null) ?? null,
    invoice_pdf_url: (o.invoice_pdf_url as string | null) ?? null,
  };
}

export function formatShippingAddress(addr: Record<string, unknown> | undefined): string {
  if (!addr || typeof addr !== "object") return "";
  const parts = [
    addr.address_1,
    addr.address_2,
    [addr.postal_code, addr.city].filter(Boolean).join(" "),
    addr.province,
    addr.country_code,
  ].filter((p) => p != null && String(p).trim() !== "");
  return parts.map((p) => String(p)).join(", ");
}
