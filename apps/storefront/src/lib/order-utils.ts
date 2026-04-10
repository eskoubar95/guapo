import type { StoreOrderDetail, StoreOrderDetailItem } from "@/lib/orders";
import { getSubscriptionCycleWeeksFromMetadata } from "@/lib/subscription-cycle";

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

/** Line total in DKK (major). Prefer `total`; else unit_price × quantity. */
export function lineItemTotalMajor(item: {
  total?: number;
  unit_price?: number;
  quantity?: number;
}): number {
  const qty = Math.max(1, item.quantity ?? 1);
  if (item.total != null) return item.total;
  return (item.unit_price ?? 0) * qty;
}

export function orderItemsSubtotal(
  items: Array<{ total?: number; unit_price?: number; quantity?: number }> | undefined
): number {
  if (!items?.length) return 0;
  return items.reduce((sum, i) => sum + lineItemTotalMajor(i), 0);
}

/** If value looks like major units (e.g. 150 or 150.5 for DKK), convert to minor for consistent display. */
export function ensureMinorAmount(value: number | undefined, fromSessionStorage: boolean): number | undefined {
  if (value == null || !fromSessionStorage) return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  if (value >= SESSION_MINOR_ALREADY_THRESHOLD) return value;
  if (value > 0 && value < SESSION_MAJOR_MAX_EXCLUSIVE) return Math.round(value * 100);
  return value;
}

/** After ensureMinorAmount, values are integer øre; convert back to DKK for UI. */
function sessionAmountToMajor(value: number | undefined): number | undefined {
  const minor = ensureMinorAmount(value, true);
  if (minor == null) return undefined;
  return minor / 100;
}

/**
 * Normalize order from sessionStorage or API (may be camelCase or partial).
 * Medusa amounts are **major DKK** for API responses; sessionStorage may store major or minor (heuristic).
 */
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
      unit_price: fromSessionStorage ? sessionAmountToMajor(up) ?? up : up,
      total: fromSessionStorage ? sessionAmountToMajor(tot) ?? tot : tot,
      metadata: (item.metadata as Record<string, unknown>) ?? {},
      is_subscription_line:
        getSubscriptionCycleWeeksFromMetadata(
          item.metadata as Record<string, unknown> | undefined
        ) > 0 || Boolean(item.is_subscription_line),
    };
  });
  const totalRaw = o.total as number | undefined;
  const shippingRaw = (o.shipping_total ?? (o as Record<string, unknown>).shippingTotal) as number | undefined;
  return {
    id,
    display_id: o.display_id as number | undefined,
    status: o.status as string | undefined,
    created_at: (o.created_at ?? (o as Record<string, unknown>).createdAt) as string | undefined,
    total: fromSessionStorage ? sessionAmountToMajor(totalRaw) ?? totalRaw : totalRaw,
    currency_code: (o.currency_code ?? (o as Record<string, unknown>).currency_code) as string | undefined,
    shipping_total: fromSessionStorage ? sessionAmountToMajor(shippingRaw) ?? shippingRaw : shippingRaw,
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
