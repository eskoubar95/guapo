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

export type StoreSubscription = {
  id: string;
  status: string;
  cycle_weeks: number;
  next_renewal_at: string;
  last_renewal_at: string | null;
  delivery_count: number;
  discount_percent: number;
  variant_id: string;
  quantity: number;
  skip_next?: boolean;
};

/** Fetch customer subscriptions (requires auth). Returns [] if not authenticated. */
export async function getCustomerSubscriptions(): Promise<
  StoreSubscription[]
> {
  const cookieStore = await cookies();
  // Forward cookies so Medusa can resolve session; backend validates auth.
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${MEDUSA_URL}/store/subscriptions`, {
    headers: {
      ...baseHeaders(),
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(MEDUSA_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error(`Subscriptions fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { subscriptions?: StoreSubscription[] };
  return data.subscriptions ?? [];
}

/** Fetch single subscription by id (requires auth and ownership). */
export async function getCustomerSubscription(
  id: string
): Promise<StoreSubscription | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const encodedId = encodeURIComponent(id);
  const res = await fetch(`${MEDUSA_URL}/store/subscriptions/${encodedId}`, {
    headers: {
      ...baseHeaders(),
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(MEDUSA_FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    if (res.status === 404 || res.status === 401) return null;
    throw new Error(`Subscription fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { subscription?: StoreSubscription };
  return data.subscription ?? null;
}
