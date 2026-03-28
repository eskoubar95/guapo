"use server";

import { cookies } from "next/headers";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const MEDUSA_FETCH_TIMEOUT_MS = 8000;

function baseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
  };
}

function withBackendUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) return null;
  return `${MEDUSA_URL}${path}`;
}

export type StoreOrderSummary = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  /** Number of line items (from list endpoint). */
  item_count?: number;
  tracking_url?: string | null;
  is_renewal?: boolean;
  has_order_confirmation_pdf?: boolean;
  has_invoice_pdf?: boolean;
  order_confirmation_pdf_url?: string | null;
  invoice_pdf_url?: string | null;
};

export type StoreOrderDetailItem = {
  id: string;
  title?: string;
  variant_id?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  metadata?: Record<string, unknown>;
  is_subscription_line?: boolean;
};

export type StoreOrderDetail = {
  id: string;
  display_id?: number;
  status?: string;
  created_at?: string;
  total?: number;
  currency_code?: string;
  shipping_total?: number;
  shipping_address?: Record<string, unknown>;
  /** First shipping method data (e.g. Shipmondo service_point_* for pakkeshop) */
  shipping_method_data?: Record<string, unknown> | null;
  is_renewal?: boolean;
  items: StoreOrderDetailItem[];
  tracking_url?: string | null;
  tracking_number?: string | null;
  /** From order.metadata when set by backend (e.g. payment_last4, payment_brand). */
  metadata?: Record<string, unknown>;
  has_order_confirmation_pdf?: boolean;
  has_invoice_pdf?: boolean;
  order_confirmation_pdf_url?: string | null;
  invoice_pdf_url?: string | null;
};

/** Fetch customer order list (requires auth). Returns [] if not authenticated. */
export async function getCustomerOrders(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ orders: StoreOrderSummary[]; count: number }> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const qs = params.toString();

  const res = await fetch(
    `${MEDUSA_URL}/store/orders${qs ? `?${qs}` : ""}`,
    {
      headers: {
        ...baseHeaders(),
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(MEDUSA_FETCH_TIMEOUT_MS),
    }
  );

  if (!res.ok) {
    if (res.status === 401) return { orders: [], count: 0 };
    throw new Error(`Orders fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    orders?: StoreOrderSummary[];
    count?: number;
  };
  return {
    orders: (data.orders ?? []).map((order) => ({
      ...order,
      order_confirmation_pdf_url: withBackendUrl(order.order_confirmation_pdf_url),
      invoice_pdf_url: withBackendUrl(order.invoice_pdf_url),
    })),
    count: data.count ?? 0,
  };
}

/** Fetch single order by id (requires auth and ownership). Returns null if not found or unauthorized. */
export async function getCustomerOrder(
  orderId: string
): Promise<StoreOrderDetail | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${MEDUSA_URL}/store/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      ...baseHeaders(),
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(MEDUSA_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 401 || res.status === 403) return null;
    throw new Error(`Order fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { order?: StoreOrderDetail };
  if (!data.order) return null;
  return {
    ...data.order,
    order_confirmation_pdf_url: withBackendUrl(data.order.order_confirmation_pdf_url),
    invoice_pdf_url: withBackendUrl(data.order.invoice_pdf_url),
  };
}
