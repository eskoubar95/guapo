/**
 * i18n Configuration for Guapo Storefront
 * 
 * Supports Danish (da) and English (en) locales.
 * Danish is the default locale.
 */

export const locales = ["da", "en"] as const;
export type Locale = (typeof locales)[number];

/** Default path prefix and x-default hreflang target. */
export const defaultLocale: Locale = "da";

export const localeNames: Record<Locale, string> = {
  da: "Dansk",
  en: "English",
};

export const localeCurrencies: Record<Locale, string> = {
  da: "DKK",
  en: "EUR", // Default for English (Europe)
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
