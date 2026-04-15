import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { getStorefrontSiteUrl } from "@/lib/site-url";

/**
 * Full URL for a storefront path **without** locale prefix, e.g. `/products/foo` or `` for home.
 */
export function storefrontPathWithoutLocale(path: string): string {
  const t = path.trim();
  if (!t || t === "/") return "";
  return t.startsWith("/") ? t : `/${t}`;
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
