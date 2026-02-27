const ROUTE_LOCALE_TO_INTL: Record<string, string> = {
  da: "da-DK",
  en: "en-US",
};

/**
 * Format a numeric amount as currency (DKK) for display.
 * @param amount - Amount in minor units (e.g. øre)
 * @param locale - Route locale ("da" | "en") or full Intl locale (e.g. "da-DK"); default "da-DK"
 */
export function formatPrice(amount: number, locale = "da-DK"): string {
  const intlLocale = ROUTE_LOCALE_TO_INTL[locale] ?? locale;
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
  }).format(amount);
}
