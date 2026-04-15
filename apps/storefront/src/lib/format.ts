const ROUTE_LOCALE_TO_INTL: Record<string, string> = {
  da: "da-DK",
  en: "en-US",
};

/** Resolve BCP 47 locale for Intl from route segment (e.g. "da" → "da-DK"). */
export function intlLocaleFromRoute(routeLocale: string): string {
  return ROUTE_LOCALE_TO_INTL[routeLocale] ?? routeLocale;
}

/**
 * Format a numeric amount as currency (DKK) for display.
 * @param amount - Amount in major units (DKK), as returned by Medusa APIs (e.g. 112.5 = 112.50 kr.)
 * @param locale - Route locale ("da" | "en") or full Intl locale (e.g. "da-DK"); default "da-DK"
 */
export function formatPrice(amount: number, locale = "da-DK"): string {
  const intlLocale = intlLocaleFromRoute(locale);
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a major-unit amount with an explicit ISO currency (e.g. order confirmation).
 */
export function formatCurrencyAmount(
  amount: number,
  routeLocale: string,
  currencyCode = "dkk"
): string {
  const intlLocale = intlLocaleFromRoute(routeLocale);
  const currency = currencyCode.toUpperCase();
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Long date for order confirmation etc. */
export function formatLongDate(dateStr: string | undefined, routeLocale: string): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString(intlLocaleFromRoute(routeLocale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
