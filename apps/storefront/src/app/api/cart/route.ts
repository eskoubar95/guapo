/**
 * GET /api/cart — Returns current cart for client (e.g. header dropdown).
 * Uses cart_id cookie; returns null if no cart.
 */
import { getCart } from "@/lib/cart";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cart = await getCart();
    return NextResponse.json(cart ?? null);
  } catch {
    return NextResponse.json(null);
  }
}
