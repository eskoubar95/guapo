/**
 * Klarna is off at launch unless explicitly enabled in env.
 * Set NEXT_PUBLIC_CHECKOUT_ENABLE_KLARNA=true when ready to show it in checkout.
 */
export function isCheckoutKlarnaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_ENABLE_KLARNA === "true";
}
