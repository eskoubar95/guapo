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

    const [products, articlesRes] = await Promise.all([
      fetchProductsByQuery(q, PRODUCT_LIMIT),
      PAYLOAD_URL
        ? fetch(
            `${PAYLOAD_URL}/api/storefront/articles?${new URLSearchParams({
              q,
              limit: String(ARTICLE_LIMIT),
              sort: "-publishedAt",
              locale,
              "fallback-locale": "da",
            })}`,
            { headers: { "Content-Type": "application/json" }, next: { revalidate: 30 } }
          ).then((r) => r.json() as Promise<{ docs?: Array<{ slug?: string; title?: string; excerpt?: string; publishedAt?: string }> }>)
        : Promise.resolve({ docs: [] }),
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
