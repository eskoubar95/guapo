/**
 * Medusa Store API — product reviews (@lambdacurry/medusa-product-reviews).
 * GET /store/product-reviews, GET /store/product-review-stats.
 */

const MEDUSA_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "") +
  "/store";

function medusaHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (key) headers["x-publishable-api-key"] = key;
  return headers;
}

export interface ProductReviewItem {
  id: string;
  name: string | null;
  email: string | null;
  rating: number;
  content: string | null;
  status: string;
  created_at?: string;
  response?: { content: string } | null;
}

export interface ProductReviewStats {
  product_id: string;
  average_rating: number | null;
  review_count: number;
  rating_count_1?: number;
  rating_count_2?: number;
  rating_count_3?: number;
  rating_count_4?: number;
  rating_count_5?: number;
}

/**
 * List approved reviews for a product.
 */
export async function fetchProductReviews(
  productId: string,
  limit = 20,
  offset = 0
): Promise<{ reviews: ProductReviewItem[]; count: number }> {
  try {
    const params = new URLSearchParams({
      product_id: productId,
      status: "approved",
      limit: String(limit),
      offset: String(offset),
    });
    const res = await fetch(`${MEDUSA_URL}/product-reviews?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { reviews: [], count: 0 };
    const json = (await res.json()) as {
      product_reviews?: ProductReviewItem[];
      count?: number;
    };
    const reviews = json.product_reviews ?? [];
    return { reviews, count: json.count ?? reviews.length };
  } catch {
    return { reviews: [], count: 0 };
  }
}

/**
 * Get review stats (average rating, count) for a product.
 */
export async function fetchProductReviewStats(
  productId: string
): Promise<ProductReviewStats | null> {
  try {
    const params = new URLSearchParams({ product_id: productId });
    const res = await fetch(`${MEDUSA_URL}/product-review-stats?${params}`, {
      headers: medusaHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      product_review_stats?: ProductReviewStats[];
      count?: number;
    };
    const stats = json.product_review_stats?.[0] ?? null;
    return stats;
  } catch {
    return null;
  }
}
