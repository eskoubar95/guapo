/**
 * Debug endpoint to inspect Payload API response for a product.
 * GET /api/debug-payload?handle=anua-niacinamide-10-txa-4-dark-spot-removing-serum
 * Remove this file when done debugging.
 */
import { NextResponse } from "next/server";

const PAYLOAD_URL = process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

export async function GET(req: Request) {
  if (!PAYLOAD_URL) {
    return NextResponse.json(
      { error: "PAYLOAD_API_URL not configured" },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle") ?? "anua-niacinamide-10-txa-4-dark-spot-removing-serum";
  const params = new URLSearchParams({
    locale: "da",
    "fallback-locale": "da",
  });
  const res = await fetch(`${PAYLOAD_URL}/api/storefront/product/${encodeURIComponent(handle)}?${params}`, {
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  return NextResponse.json(
    {
      status: res.status,
      payloadUrl: `${PAYLOAD_URL}/api/products?${params}`,
      docsCount: json.docs?.length ?? 0,
      raw: json,
      skinTypesRaw: json.docs?.[0]?.skinTypes,
      concernsRaw: json.docs?.[0]?.concerns,
    },
    { status: 200 }
  );
}
