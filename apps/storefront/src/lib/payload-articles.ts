/**
 * Payload CMS — Articles for storefront (blog list, blog carousel).
 * Category labels must match apps/cms/src/collections/Articles.ts select options.
 */
import { cache } from "react";

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

/** Map article category value (from Payload API) to display label. Source: CMS Articles collection. */
export const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  "skincare-tips": "Skincare Tips",
  "product-guides": "Product Guides",
  ingredients: "Ingredient Spotlight",
  routines: "Routine Advice",
  news: "News & Updates",
};

export function getArticleCategoryLabel(value: string | null | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  return ARTICLE_CATEGORY_LABELS[value] ?? value;
}

export interface PayloadArticleListItem {
  id?: number;
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  featuredImage?: { url?: string | null; alt?: string | null } | number | null;
}

/** Full article for detail page (from by-slug API, depth 2). */
export interface PayloadArticleDetail extends PayloadArticleListItem {
  content?: unknown;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: { url?: string | null } | number | null;
  } | null;
}

function mediaAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  if (url.startsWith("http")) return url;
  const base = PAYLOAD_URL ?? "";
  if (!base) return undefined;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base.replace(/\/$/, "")}${path}`;
}

/** Resolve thumbnail URL from article featuredImage (requires depth >= 1 from API). */
export function articleThumbnailUrl(article: PayloadArticleListItem): string | undefined {
  const img = article.featuredImage;
  if (!img || typeof img === "number") return undefined;
  return mediaAbsoluteUrl(img.url);
}

/** OG / hero image: meta.image if populated, else featured image. */
export function articleOgImageUrl(article: PayloadArticleDetail): string | undefined {
  const metaImg = article.meta?.image;
  if (metaImg && typeof metaImg === "object" && "url" in metaImg) {
    const u = mediaAbsoluteUrl(metaImg.url);
    if (u) return u;
  }
  return articleThumbnailUrl(article);
}

/**
 * Fetch latest articles from Payload. Returns empty array if CMS not configured or request fails.
 */
export async function fetchLatestArticles(
  locale: string,
  limit = 4
): Promise<PayloadArticleListItem[]> {
  if (!PAYLOAD_URL) return [];

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      sort: "-publishedAt",
      locale,
      "fallback-locale": "da",
    });
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/articles?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { docs?: PayloadArticleListItem[] };
    return json.docs ?? [];
  } catch {
    return [];
  }
}

/**
 * Search articles by query string (title/excerpt). Returns empty array if CMS not configured or request fails.
 */
export async function fetchArticlesByQuery(
  q: string,
  locale: string,
  limit = 10
): Promise<PayloadArticleListItem[]> {
  if (!PAYLOAD_URL || !q.trim()) return [];

  try {
    const params = new URLSearchParams({
      q: q.trim(),
      limit: String(limit),
      sort: "-publishedAt",
      locale,
      "fallback-locale": "da",
    });
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/articles?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { docs?: PayloadArticleListItem[] };
    return json.docs ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch one published article by slug. Returns null if not found or CMS unavailable.
 */
export async function fetchArticleBySlug(
  slug: string,
  locale: string
): Promise<PayloadArticleDetail | null> {
  if (!PAYLOAD_URL || !slug.trim()) return null;

  try {
    const params = new URLSearchParams({
      slug: slug.trim(),
      locale,
      "fallback-locale": "da",
    });
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/articles/by-slug?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as PayloadArticleDetail;
  } catch {
    return null;
  }
}

/** Dedupe article fetch within one RSC request (metadata + page). */
export const getArticleBySlugCached = cache(fetchArticleBySlug);
