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

export type AccountSummary = {
  customer: {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  metrics: {
    order_count: number;
    active_subscription_count: number;
  };
  preferred_pickup: {
    name?: string;
    address?: string;
    postal_code?: string;
    city?: string;
    carrier_code?: string | null;
  } | null;
  fallback_shipping_address: {
    address_1?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  } | null;
  payment_method: {
    brand?: string;
    last4?: string;
  } | null;
  recent_orders: Array<{
    id: string;
    created_at?: string;
  }>;
};

export async function getAccountSummary(): Promise<AccountSummary | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${MEDUSA_URL}/store/account/summary`, {
    headers: {
      ...baseHeaders(),
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(MEDUSA_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 404) return null;
    throw new Error(`Account summary fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { summary?: AccountSummary };
  return data.summary ?? null;
}
