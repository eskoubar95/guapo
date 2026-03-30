"use client";

/**
 * Placeholder for marketing pixels (Meta, TikTok, etc.).
 * Add ConsentScript components with category="marketing" when pixels are configured.
 * Only loads when user has accepted marketing cookies.
 *
 * Example Meta Pixel:
 * <ConsentScript
 *   id="meta-pixel"
 *   src="https://connect.facebook.net/en_US/fbevents.js"
 *   category="marketing"
 *   onLoad={() => { fbq('init', 'PIXEL_ID'); fbq('track', 'PageView'); }}
 *   onRevoke={() => { scriptCleanupHelpers.facebookPixel(); }}
 * />
 *
 * Example TikTok Pixel:
 * <ConsentScript
 *   id="tiktok-pixel"
 *   src="https://analytics.tiktok.com/i18n/pixel/... .js"
 *   category="marketing"
 *   onLoad={() => { ttq.load('PIXEL_ID'); ttq.page(); }}
 *   onRevoke={() => { ... clear ttq / cookies ... }}
 * />
 */
export function MarketingPixels() {
  return null;
}
