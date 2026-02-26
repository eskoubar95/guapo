import { NextResponse } from "next/server";

const MEDUSA_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

/**
 * GET /api/checkout/init
 * Returns region_id and variant_id for Denmark to bootstrap checkout.
 * Used when creating a cart for Stripe PaymentElement demo.
 */
export async function GET() {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
    };

    const [regionsRes, productsRes] = await Promise.all([
      fetch(`${MEDUSA_URL}/store/regions?currency_code=dkk`, { headers }),
      fetch(`${MEDUSA_URL}/store/products?limit=1`, { headers }),
    ]);

    if (!regionsRes.ok || !productsRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch checkout init data" },
        { status: 502 }
      );
    }

    const [regionsData, productsData] = await Promise.all([
      regionsRes.json(),
      productsRes.json(),
    ]);

    const regions = regionsData.regions ?? regionsData;
    const region = Array.isArray(regions) ? regions[0] : regions;
    const region_id = region?.id;

    const products = productsData.products ?? productsData;
    const product = Array.isArray(products) ? products[0] : products;
    const variant_id = product?.variants?.[0]?.id;

    if (!region_id || !variant_id) {
      return NextResponse.json(
        { message: "No Denmark region or products found. Run seed." },
        { status: 404 }
      );
    }

    return NextResponse.json({ region_id, variant_id });
  } catch {
    return NextResponse.json(
      { message: "Checkout init failed" },
      { status: 500 }
    );
  }
}
