/** Build a short payment line for PDFs from order.metadata (Stripe card hints). */
export function formatPaymentMethodLabel(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const brandRaw = metadata.payment_brand;
  const last4Raw = metadata.payment_last4;
  const brand = typeof brandRaw === "string" ? brandRaw.trim() : "";
  const last4 = typeof last4Raw === "string" ? last4Raw.trim() : "";
  if (!brand && !last4) return null;

  const b = brand.toLowerCase();
  const prettyBrand =
    b === "visa"
      ? "Visa"
      : b === "mastercard"
        ? "Mastercard"
        : b === "amex"
          ? "American Express"
          : brand.length > 0
            ? brand.charAt(0).toUpperCase() + brand.slice(1)
            : "";

  if (prettyBrand && last4) return `${prettyBrand} ···· ${last4}`;
  return prettyBrand || (last4 ? `···· ${last4}` : null);
}
