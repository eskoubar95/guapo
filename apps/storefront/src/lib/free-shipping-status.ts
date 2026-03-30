import { getFreeShippingThresholdDkk } from "@/lib/shipping-config";

export type FreeShippingStatusPayload = {
  threshold: number | null;
  cart_total: number;
  remaining: number | null;
  qualifies: boolean;
  enabled: boolean;
  promotion_code: string;
};

/**
 * Client: load free-shipping status from Medusa via Next.js proxy.
 * Falls back to env threshold for display if the request fails.
 */
export async function fetchFreeShippingStatusClient(): Promise<FreeShippingStatusPayload> {
  try {
    const res = await fetch("/api/cart/free-shipping", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const data = (await res.json()) as FreeShippingStatusPayload;
    if (typeof data.threshold === "number" && data.threshold > 0) {
      return data;
    }
  } catch {
    /* fallback */
  }
  const fb = getFreeShippingThresholdDkk();
  return {
    threshold: fb,
    cart_total: 0,
    remaining: fb,
    qualifies: false,
    enabled: true,
    promotion_code: "FREESHIPPING",
  };
}
