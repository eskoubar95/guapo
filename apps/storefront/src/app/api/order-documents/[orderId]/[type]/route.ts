import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const ALLOWED_TYPES = new Set(["order-confirmation", "invoice"]);

/**
 * Proxies order PDF downloads so the browser request includes
 * `x-publishable-api-key` and session cookies — direct links to Medusa cannot send the publishable key.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string; type: string }> }
) {
  const { orderId, type } = await context.params;
  if (!orderId || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ message: "Invalid document type" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie");
  const upstreamUrl = `${MEDUSA_URL}/store/orders/${encodeURIComponent(orderId)}/documents/${encodeURIComponent(type)}`;

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  const contentType = upstream.headers.get("Content-Type") || "application/pdf";
  const disposition = upstream.headers.get("Content-Disposition");

  if (!upstream.ok) {
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  if (disposition) headers.set("Content-Disposition", disposition);
  headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  headers.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(upstream.body, { status: 200, headers });
}
