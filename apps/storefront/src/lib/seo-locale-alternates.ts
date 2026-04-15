import type { Metadata } from "next";
import { locales } from "@/i18n/config";
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
 * `alternates.canonical` + `alternates.languages` for da/en + x-default → da.
 */
export function buildLocaleAlternates(
  locale: string,
  pathWithoutLocale: string,
): NonNullable<Metadata["alternates"]> {
  const base = getStorefrontSiteUrl();
  const suffix = storefrontPathWithoutLocale(pathWithoutLocale);
  const loc = locale === "en" ? "en" : "da";
  const canonical = `${base}/${loc}${suffix}`;

  const languages: Record<string, string> = {
    "x-default": `${base}/da${suffix}`,
  };
  for (const l of locales) {
    languages[l] = `${base}/${l}${suffix}`;
  }

  return { canonical, languages };
}
