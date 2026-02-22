import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

/**
 * POST /api/product-reviews
 * Proxies to Medusa POST /store/product-reviews/submit.
 * Forwards Authorization header so logged-in customers can submit reviews.
 */
const AUTH_COOKIE_NAME = "medusa_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let auth = request.headers.get("authorization");
    if (!auth) {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (token) auth = `Bearer ${token}`;
    }
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(auth && { Authorization: auth }),
    };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    const res = await fetch(`${MEDUSA_URL}/store/product-reviews/submit`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Could not submit review.", code: "NETWORK_ERROR" },
      { status: 500 }
    );
  }
}
