/**
 * GET /api/search?q=...&locale=da
 * Returns products (Medusa) and articles (Payload) for the search modal.
 */
import { fetchProductsByQuery } from "@/lib/medusa-products";
import { NextResponse } from "next/server";

const PAYLOAD_URL = (process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "").replace(/\/$/, "");
const PRODUCT_LIMIT = 8;
const ARTICLE_LIMIT = 5;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const locale = searchParams.get("locale") ?? "da";

    if (!q) {
      return NextResponse.json({ products: [], articles: [] });
    }

    const fetchArticles = async (): Promise<{ docs?: Array<{ slug?: string; title?: string; excerpt?: string; publishedAt?: string }> }> => {
      if (!PAYLOAD_URL) return { docs: [] };
      try {
        const r = await fetch(
          `${PAYLOAD_URL}/api/storefront/articles?${new URLSearchParams({
            q,
            limit: String(ARTICLE_LIMIT),
            sort: "-publishedAt",
            locale,
            "fallback-locale": "da",
          })}`,
          { headers: { "Content-Type": "application/json" }, next: { revalidate: 30 } }
        );
        if (!r.ok) return { docs: [] };
        return (await r.json()) as { docs?: Array<{ slug?: string; title?: string; excerpt?: string; publishedAt?: string }> };
      } catch {
        return { docs: [] };
      }
    };

    const [products, articlesRes] = await Promise.all([
      fetchProductsByQuery(q, PRODUCT_LIMIT),
      fetchArticles(),
    ]);

    const articles = (articlesRes.docs ?? []).map((a) => ({
      slug: a.slug ?? "",
      title: a.title ?? "",
      excerpt: a.excerpt ?? "",
      publishedAt: a.publishedAt ?? "",
    }));

    return NextResponse.json({ products, articles });
  } catch {
    return NextResponse.json({ products: [], articles: [] }, { status: 500 });
  }
}
