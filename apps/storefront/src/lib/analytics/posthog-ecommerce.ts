"use client";

import posthog from "posthog-js";

function isEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

function safeCapture(event: string, properties?: Record<string, unknown>): void {
  if (!isEnabled()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* ignore */
  }
}

/** SPA / App Router page views — set capture_pageview: false in init when using this. */
export function capturePosthogPageview(fullUrl: string): void {
  safeCapture("$pageview", { $current_url: fullUrl });
}

export function identifyPosthogUser(
  distinctId: string,
  properties?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  }
): void {
  if (!isEnabled()) return;
  try {
    const props: Record<string, string> = {};
    if (properties?.email) props.email = properties.email;
    if (properties?.first_name) props.first_name = properties.first_name;
    if (properties?.last_name) props.last_name = properties.last_name;
    posthog.identify(distinctId, Object.keys(props).length ? props : undefined);
  } catch {
    /* ignore */
  }
}

/** Call after logout so the next session gets a fresh anonymous distinct_id. */
export function resetPosthogIdentity(): void {
  if (!isEnabled()) return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}

export function trackProductViewed(payload: {
  product_id: string;
  handle: string;
  name: string;
  price: number;
  currency: string;
  category_name?: string;
}): void {
  safeCapture("product_viewed", payload);
}

export function trackProductAddedToCart(payload: {
  product_id?: string;
  product_handle: string;
  product_name: string;
  variant_id: string;
  quantity: number;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_cycle_weeks?: number | null;
  category_name?: string;
}): void {
  safeCapture("product_added_to_cart", payload);
}

export function trackCheckoutStarted(payload: {
  cart_id: string;
  value: number;
  currency: string;
  item_count: number;
  has_subscription_items: boolean;
}): void {
  safeCapture("checkout_started", payload);
}

export function trackOrderCompleted(payload: {
  order_id: string;
  display_id?: number;
  value: number;
  currency: string;
  item_count: number;
  has_subscription: boolean;
}): void {
  safeCapture("order_completed", payload);
}

export function trackUserRegistered(payload: {
  method: "emailpass";
  /** False when account existed and user was logged in instead */
  is_new_customer: boolean;
}): void {
  safeCapture("user_registered", payload);
}

export function trackUserLoggedIn(payload: {
  method: "emailpass" | "google";
  /** Google only: new Medusa customer was created */
  created_profile?: boolean;
}): void {
  safeCapture("user_logged_in", payload);
}

export function trackSearchResultsViewed(payload: {
  query: string;
  product_count: number;
  article_count: number;
  source: "modal" | "page";
}): void {
  safeCapture("search_results_viewed", payload);
}

/** User navigated to full search page (e.g. from modal submit). */
export function trackSearchSubmitted(payload: {
  query: string;
  source: "modal" | "page_form";
}): void {
  safeCapture("search_submitted", payload);
}

export function trackWishlistUpdated(payload: {
  action: "add" | "remove";
  product_handle: string;
  wishlist_size: number;
}): void {
  safeCapture("wishlist_updated", payload);
}

export function trackWishlistPageViewed(payload: {
  wishlist_size: number;
  products_shown: number;
}): void {
  safeCapture("wishlist_page_viewed", payload);
}

export function trackCartViewed(payload: {
  surface: "cart_page" | "mobile_drawer" | "add_to_cart_modal";
  item_count: number;
  /** Total cart value in major units (DKK) */
  cart_value: number;
}): void {
  safeCapture("cart_viewed", payload);
}
