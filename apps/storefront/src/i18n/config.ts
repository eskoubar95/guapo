/**
 * i18n Configuration for Guapo Storefront
 * 
 * Supports Danish (da) and English (en) locales.
 * Danish is the default locale.
 */

export const locales = ["da", "en"] as const;
export type Locale = (typeof locales)[number];

/**
 * Locales included in sitemap.xml (and other bulk SEO URL lists). Middleware/routing may still
 * accept other entries in `locales`; expand this when /en is ready for indexing.
 */
export const sitemapLocales: readonly Locale[] = ["da"];

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
