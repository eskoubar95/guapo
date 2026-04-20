import { defaultLocale, isValidLocale, locales, type Locale } from "@/i18n/config";
import { fetchSiteSettings } from "@/lib/payload-site-settings";

/**
 * Emergency / CI override: comma-separated locale codes (`da`, `da,en`).
 * When set, wins over Payload and Medusa.
 */
export function parsePublishedLocalesFromEnv(): Locale[] | null {
  const raw = process.env.PUBLISHED_LOCALES?.trim();
  if (!raw) return null;
  const out: Locale[] = [];
  for (const part of raw.split(",")) {
    const p = part.trim();
    if (isValidLocale(p) && !out.includes(p)) out.push(p);
  }
  if (out.length === 0) return null;
  if (!out.includes(defaultLocale)) {
    out.unshift(defaultLocale);
  }
  out.sort((a, b) => locales.indexOf(a) - locales.indexOf(b));
  return out;
}

/** Normalize a list from JSON/API (e.g. middleware) to a safe non-empty ordered list. */
export function coercePublishedLocales(raw: string[]): Locale[] {
  const list = raw.filter((l): l is Locale => isValidLocale(l));
  const uniq = [...new Set(list)] as Locale[];
  if (!uniq.includes(defaultLocale)) {
    uniq.unshift(defaultLocale);
  }
  uniq.sort((a, b) => locales.indexOf(a) - locales.indexOf(b));
  return uniq.length > 0 ? uniq : [defaultLocale];
}

function normalizeFromPayload(enabled: unknown): Locale[] {
  if (!Array.isArray(enabled) || enabled.length === 0) {
    return [defaultLocale];
  }
  const strings = enabled.filter((x): x is string => typeof x === "string");
  return coercePublishedLocales(strings);
}

/**
 * Future: when `STOREFRONT_LOCALE_SOURCE=medusa`, read from Medusa Store API
 * (e.g. GET /store/storefront-locale-config). Returns null until implemented.
 */
async function resolveFromMedusa(): Promise<Locale[] | null> {
  if (process.env.STOREFRONT_LOCALE_SOURCE !== "medusa") {
    return null;
  }
  // Future: GET ${MEDUSA_URL}/store/storefront-locale-config → parse enabled codes
  return null;
}

/**
 * Locales that are publicly served on the storefront (routing, hreflang, sitemap).
 * Priority: `PUBLISHED_LOCALES` env → Medusa (stub) → Payload Site settings → `da`.
 */
export async function resolvePublishedLocales(): Promise<readonly Locale[]> {
  const fromEnv = parsePublishedLocalesFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const fromMedusa = await resolveFromMedusa();
  if (fromMedusa?.length) {
    return fromMedusa;
  }

  const site = await fetchSiteSettings(defaultLocale);
  if (site?.enabledStorefrontLocales?.length) {
    return normalizeFromPayload(site.enabledStorefrontLocales);
  }

  return [defaultLocale];
}
