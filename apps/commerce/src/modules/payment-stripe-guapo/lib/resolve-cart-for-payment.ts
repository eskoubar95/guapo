import { MedusaModule } from "@medusajs/framework/modules-sdk";

import type { GuapoCartLine, GuapoCartPayload } from "./guapo-stripe.types";

const MODULE_CART = "cart";

type CartModuleLike = {
  retrieveCart: (
    id: string,
    config?: { relations?: string[]; select?: string[] },
  ) => Promise<Record<string, unknown> | null>;
};

const CART_PREFIX = "cart_";

function mapCartToGuapoPayload(cart: Record<string, unknown>): GuapoCartPayload {
  const rawItems = (cart.items as Record<string, unknown>[] | undefined) ?? [];
  const items: GuapoCartLine[] = rawItems.map((it) => {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const unit = Number(it.unit_price) || 0;
    const sub =
      it.subtotal != null
        ? Number(it.subtotal)
        : unit * qty;
    const taxLines = (it.tax_lines as { amount?: number }[] | undefined) ?? [];
    const tax_total = taxLines.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return {
      title: (it.title as string) ?? undefined,
      quantity: qty,
      total: sub,
      tax_total: tax_total || undefined,
      metadata: (it.metadata as Record<string, unknown>) ?? null,
      variant: it.variant_sku
        ? { sku: String(it.variant_sku) }
        : undefined,
    };
  });
  return {
    id: cart.id as string,
    items,
    tax_total: cart.tax_total != null ? Number(cart.tax_total) : undefined,
    total: cart.total != null ? Number(cart.total) : undefined,
    discount_total:
      cart.discount_total != null ? Number(cart.discount_total) : undefined,
    shipping_total:
      cart.shipping_total != null ? Number(cart.shipping_total) : undefined,
  };
}

/**
 * Loads cart for Guapo Stripe rules (subscriptions, Klarna metadata, amount_details).
 * Uses the cart module (same process as Medusa payment pipeline).
 *
 * Payable amount for Stripe comes from {@link initiatePayment}'s `input.amount`
 * (payment collection), which must stay aligned with the cart via
 * `refreshPaymentCollectionForCartWorkflow` when totals change.
 *
 * Currency must match the payment session.
 */
export async function resolveCartForPaymentCollection(
  cartId: unknown,
  expected: { currency_code: string },
): Promise<GuapoCartPayload | null> {
  if (typeof cartId !== "string" || !cartId.startsWith(CART_PREFIX)) {
    return null;
  }

  /**
   * MedusaModule.getModuleInstance returns { [moduleKey]: Service }, not the
   * service directly. See medusa-module.js → resolveLoadedModule.
   */
  const rawInstance = MedusaModule.getModuleInstance(MODULE_CART);
  const cartModule = (
    rawInstance && typeof rawInstance.retrieveCart === "function"
      ? rawInstance
      : rawInstance ? Object.values(rawInstance)[0] : undefined
  ) as CartModuleLike | undefined;

  if (!cartModule?.retrieveCart) {
    return null;
  }

  let cart: Record<string, unknown> | null;
  try {
    cart = await cartModule.retrieveCart(cartId, {
      select: [
        "id",
        "currency_code",
        "total",
        "tax_total",
        "discount_total",
        "shipping_total",
        "items",
      ],
    });
  } catch {
    return null;
  }

  if (!cart?.id) {
    return null;
  }

  const cartCc = String(cart.currency_code ?? "").toLowerCase();
  const expCc = String(expected.currency_code ?? "").toLowerCase();
  if (!cartCc || cartCc !== expCc) {
    return null;
  }

  return mapCartToGuapoPayload(cart);
}
