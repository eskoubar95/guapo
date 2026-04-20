/**
 * Payload CMS — Site settings global (favicon, touch icon).
 */
import type { PayloadMedia } from "@/lib/payload-homepage";

const PAYLOAD_URL = (process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "").replace(
  /\/$/,
  "",
);

export interface SiteSettingsPayload {
  favicon?: PayloadMedia | number | null;
  appleTouchIcon?: PayloadMedia | number | null;
  /** Locales live on the storefront; always includes `da` when returned from CMS API. */
  enabledStorefrontLocales?: ("da" | "en")[];
}

export async function fetchSiteSettings(locale: string): Promise<SiteSettingsPayload | null> {
  if (!PAYLOAD_URL) return null;

  try {
    const params = new URLSearchParams({
      locale,
      "fallback-locale": "da",
    });
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/globals/site-settings?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteSettingsPayload;
  } catch {
    return null;
  }
}
