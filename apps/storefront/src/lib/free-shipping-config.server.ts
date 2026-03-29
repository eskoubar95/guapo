import { getFreeShippingThresholdDkk } from "./shipping-config";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export interface FreeShippingConfig {
  threshold: number;
  enabled: boolean;
  promotion_code: string;
}

/**
 * Server-side: fetch free-shipping config from Medusa's Store API.
 * Cached for 60 s so pages don't hit the backend on every render.
 */
export async function fetchFreeShippingConfig(): Promise<FreeShippingConfig> {
  const fallback: FreeShippingConfig = {
    threshold: getFreeShippingThresholdDkk(),
    enabled: true,
    promotion_code: "FREESHIPPING",
  };

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
    };
    const res = await fetch(`${MEDUSA_URL}/store/free-shipping-config`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as Partial<FreeShippingConfig>;
    return {
      threshold:
        typeof data.threshold === "number" && data.threshold > 0
          ? data.threshold
          : fallback.threshold,
      enabled: data.enabled !== false,
      promotion_code: data.promotion_code || fallback.promotion_code,
    };
  } catch {
    return fallback;
  }
}
