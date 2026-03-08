/**
 * POST /api/cart/line-item — Update line item quantity (and optional metadata).
 * Body: { lineItemId: string, quantity: number, metadata?: Record<string, unknown> }
 * Used by AddToCartModal to avoid calling server action directly from client (Turbopack/async panic).
 */
import { updateLineItem } from "@/lib/cart";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      lineItemId?: string;
      quantity?: number;
      metadata?: Record<string, unknown>;
    };
    const lineItemId = body.lineItemId;
    const quantity = body.quantity;
    if (typeof lineItemId !== "string" || !lineItemId) {
      return NextResponse.json({ error: "Missing lineItemId" }, { status: 400 });
    }
    const qty = Math.max(1, Math.floor(Number(quantity ?? 1)));
    const metadata =
      body.metadata != null && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    await updateLineItem(lineItemId, qty, metadata);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update line item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
