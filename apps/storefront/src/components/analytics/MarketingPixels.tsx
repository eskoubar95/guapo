"use client";

/**
 * Marketing pixels (Meta, TikTok, etc.) should be added inside **Google Tag Manager**
 * with consent-aware tag configuration, not as separate React snippets.
 *
 * The storefront loads GTM after analytics or marketing consent when the container ID
 * is set in Payload (Tracking global) or NEXT_PUBLIC_GTM_CONTAINER_ID.
 */
export function MarketingPixels() {
  return null;
}
