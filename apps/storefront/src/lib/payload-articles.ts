/**
 * Payload CMS — Articles for storefront (blog list, blog carousel).
 * Category labels must match apps/cms/src/collections/Articles.ts select options.
 */
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
  featuredImage?: { url?: string | null } | number | null;
}

/** Resolve thumbnail URL from article featuredImage (requires depth >= 1 from API). */
export function articleThumbnailUrl(article: PayloadArticleListItem): string | undefined {
  const img = article.featuredImage;
  if (!img || typeof img === "number") return undefined;
  const url = img.url;
  if (!url || typeof url !== "string") return undefined;
  if (url.startsWith("http")) return url;
  const base = PAYLOAD_URL ?? "";
  if (!base) return undefined;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base.replace(/\/$/, "")}${path}`;
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
