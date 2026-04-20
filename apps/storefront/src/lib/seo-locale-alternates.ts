import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { resolvePublishedLocales } from "@/i18n/published-locales";
import { getStorefrontSiteUrl } from "@/lib/site-url";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes a storefront path and strips a leading locale segment (`/da`, `/en`) if present,
 * so alternates/canonicals do not double-prefix locales.
 */
export function storefrontPathWithoutLocale(path: string): string {
  const t = path.trim();
  if (!t || t === "/") return "";
  const normalized = t.startsWith("/") ? t : `/${t}`;
  const localePattern = new RegExp(`^/(?:${locales.map(escapeRegExp).join("|")})(?=/|$)`);
  const withoutLocale = normalized.replace(localePattern, "");
  if (!withoutLocale || withoutLocale === "/") return "";
  return withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
}

/**
 * `alternates.canonical` + `alternates.languages` for published locales + x-default → da.
 */
export async function buildLocaleAlternates(
  locale: string,
  pathWithoutLocale: string,
): Promise<NonNullable<Metadata["alternates"]>> {
  const published = await resolvePublishedLocales();
  const base = getStorefrontSiteUrl();
  const suffix = storefrontPathWithoutLocale(pathWithoutLocale);
  const canonicalLocale = published.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  const canonical = `${base}/${canonicalLocale}${suffix}`;

  const languages: Record<string, string> = {
    "x-default": `${base}/da${suffix}`,
  };
  for (const l of published) {
    languages[l] = `${base}/${l}${suffix}`;
  }

  return { canonical, languages };
}
