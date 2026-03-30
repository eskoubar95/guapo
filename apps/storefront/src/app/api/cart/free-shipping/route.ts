/**
 * GET /api/cart/free-shipping — proxies to Medusa free-shipping-status for current cart cookie.
 */
import { getCartId } from "@/lib/cart-data";
import { NextResponse } from "next/server";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const UPSTREAM_TIMEOUT_MS = 5000;

/** Same shape as successful free-shipping responses when upstream is unavailable. */
const FREE_SHIPPING_DEGRADED = {
  threshold: null,
  cart_total: 0,
  remaining: null,
  qualifies: false,
  enabled: true,
  promotion_code: "FREESHIPPING",
} as const;

export async function GET() {
  let cartId: string | null = null;
  try {
    cartId = await getCartId();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
    };

    if (!cartId) {
      try {
        const cfgController = new AbortController();
        const cfgTimeoutId = setTimeout(() => cfgController.abort(), UPSTREAM_TIMEOUT_MS);
        const cfgRes = await fetch(`${MEDUSA_URL}/store/free-shipping-config`, {
          headers,
          cache: "no-store",
          signal: cfgController.signal,
        }).finally(() => clearTimeout(cfgTimeoutId));
        if (cfgRes.ok) {
          const cfg = (await cfgRes.json()) as {
            threshold?: number;
            enabled?: boolean;
            promotion_code?: string;
          };
          const threshold = typeof cfg.threshold === "number" ? cfg.threshold : 499;
          return NextResponse.json({
            threshold,
            cart_total: 0,
            remaining: threshold,
            qualifies: false,
            enabled: cfg.enabled !== false,
            promotion_code: cfg.promotion_code ?? "FREESHIPPING",
          });
        }
      } catch (err) {
        console.error("[free-shipping] Upstream config fetch failed", err);
      }
      return NextResponse.json(FREE_SHIPPING_DEGRADED, { status: 200 });
    }

    const statusController = new AbortController();
    const statusTimeoutId = setTimeout(() => statusController.abort(), UPSTREAM_TIMEOUT_MS);
    const res = await fetch(
      `${MEDUSA_URL}/store/free-shipping-status?cart_id=${encodeURIComponent(cartId)}`,
      { headers, cache: "no-store", signal: statusController.signal }
    ).finally(() => clearTimeout(statusTimeoutId));
    if (!res.ok) {
      const errText = await res.text();
      console.error("[free-shipping] Upstream request failed", {
        status: res.status,
        hasBody: Boolean(errText),
      });
      return NextResponse.json(
        { message: "Free shipping status failed", code: "UPSTREAM_ERROR" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[free-shipping] Route error", err);
    if (cartId == null) {
      return NextResponse.json(FREE_SHIPPING_DEGRADED, { status: 200 });
    }
    return NextResponse.json(
      { message: "Free shipping status failed", code: "ERROR" },
      { status: 500 }
    );
  }
}
