/**
 * Format a numeric amount as currency (DKK) for display.
 * @param amount - Amount in minor units (e.g. øre)
 * @param locale - Optional locale for formatting (default "da-DK")
 */
export function formatPrice(amount: number, locale = "da-DK"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
  }).format(amount);
}
