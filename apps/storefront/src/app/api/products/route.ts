/**
 * GET /api/products?handles=handle1,handle2 — Returns products for given handles (e.g. for wishlist).
 */
import { fetchProductsByHandles } from "@/lib/medusa-products";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handlesParam = searchParams.get("handles");
    const handles = handlesParam
      ? handlesParam.split(",").map((h) => h.trim()).filter(Boolean)
      : [];
    if (handles.length === 0) {
      return NextResponse.json([]);
    }
    const products = await fetchProductsByHandles(handles);
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
