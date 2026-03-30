/**
 * Resolve products and articles for homepage/landing section blocks.
 * Used by [locale]/page.tsx and [locale]/[...path]/page.tsx.
 */
import { fetchProductsByHandles } from "@/lib/medusa-products";
import { fetchLatestArticles, articleThumbnailUrl } from "@/lib/payload-articles";
import type { HomepageSection } from "@/lib/payload-homepage";
import type { BlogCarouselArticle } from "@/components/sections/BlogCarouselSection";
import type { Product } from "@/components/ProductCard";

export async function resolveHomepageData(
  sections: HomepageSection[],
  locale: string
): Promise<{
  resolvedProducts: Record<string, Product[]>;
  resolvedArticles: Record<string, BlogCarouselArticle[]>;
}> {
  const resolvedProducts: Record<string, Product[]> = {};
  const resolvedArticles: Record<string, BlogCarouselArticle[]> = {};

  await Promise.all(
    sections.map(async (block, index) => {
      const key = (block as { id?: string }).id ?? `${block.blockType}-${index}`;

      if (block.blockType === "featured-products") {
        const fp = block as import("@/lib/payload-homepage").FeaturedProductsBlock;
        let handles: string[] = [];
        if (fp.productHandles?.length) {
          handles = fp.productHandles.map((h) => h.handle);
        } else if (Array.isArray(fp.products)) {
          handles = fp.products
            .map((p) => (typeof p === "object" && p && "handle" in p ? (p as { handle?: string }).handle : null))
            .filter((h): h is string => Boolean(h));
        }
        if (handles.length > 0) {
          const products = await fetchProductsByHandles(handles);
          resolvedProducts[key] = products;
        } else {
          resolvedProducts[key] = [];
        }
      }

      if (block.blockType === "brand-spotlight") {
        const bs = block as import("@/lib/payload-homepage").BrandSpotlightBlock;
        const handles = bs.productHandles?.map((h) => h.handle) ?? [];
        resolvedProducts[key] = handles.length > 0 ? await fetchProductsByHandles(handles) : [];
      }

      if (block.blockType === "blog-carousel") {
        const bc = block as import("@/lib/payload-homepage").BlogCarouselBlock;
        if (bc.source === "manual" && Array.isArray(bc.articles) && bc.articles.length > 0) {
          resolvedArticles[key] = bc.articles.map((a) => {
            const doc = typeof a === "object" && a && "slug" in a ? a : null;
            const withImg = doc as import("@/lib/payload-articles").PayloadArticleListItem;
            return doc
              ? {
                  slug: doc.slug,
                  title: (doc as { title?: string }).title,
                  excerpt: (doc as { excerpt?: string }).excerpt,
                  publishedAt: (doc as { publishedAt?: string }).publishedAt,
                  thumbnailUrl: articleThumbnailUrl(withImg) ?? undefined,
                  category: (doc as { category?: string }).category ?? undefined,
                }
              : { slug: null, title: null };
          });
        } else {
          const limit = bc.limit ?? 4;
          const articles = await fetchLatestArticles(locale, limit);
          resolvedArticles[key] = articles.map((a) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            publishedAt: a.publishedAt,
            thumbnailUrl: articleThumbnailUrl(a) ?? undefined,
            category: a.category ?? undefined,
          }));
        }
      }
    })
  );

  return { resolvedProducts, resolvedArticles };
}
