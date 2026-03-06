import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchLatestArticles, articleThumbnailUrl } from "@/lib/payload-articles";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Blog" : "Blog",
    description: locale === "da"
      ? "Læs vores seneste artikler om hudpleje, ingredienser og tips."
      : "Read our latest articles about skincare, ingredients, and tips.",
  };
}

const CATEGORY_LABELS: Record<string, { da: string; en: string }> = {
  "skincare-tips": { da: "Hudplejetips", en: "Skincare Tips" },
  "product-guides": { da: "Produktguider", en: "Product Guides" },
  ingredients: { da: "Ingredienser", en: "Ingredient Spotlight" },
  routines: { da: "Rutiner", en: "Routine Advice" },
  news: { da: "Nyheder", en: "News & Updates" },
};

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const localeKey = locale as "da" | "en";
  const articles = await fetchLatestArticles(locale, 20);

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-text-primary">Blog</h1>
        <p className="mt-4 text-lg text-text-secondary">
          {locale === "da"
            ? "Udforsk vores artikler om hudpleje, ingredienser og tips til en sundere hud."
            : "Explore our articles about skincare, ingredients, and tips for healthier skin."}
        </p>
        <div className="mt-12 space-y-12">
          {articles.length === 0 ? (
            <p className="text-text-secondary">{locale === "da" ? "Ingen artikler endnu." : "No articles yet."}</p>
          ) : (
            articles.map((article) => {
              const thumbUrl = articleThumbnailUrl(article);
              const categoryLabel = article.category ? (CATEGORY_LABELS[article.category]?.[localeKey] ?? article.category) : null;
              return (
                <article key={article.slug ?? article.id} className="pb-10">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {thumbUrl && (
                      <Link href={`/${locale}/blog/${article.slug ?? ""}`} className="shrink-0 w-full sm:w-64 aspect-video rounded-lg overflow-hidden bg-surface group">
                        <ImageWithFallback src={thumbUrl} alt={article.title ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </Link>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
                        {categoryLabel && (
                          <>
                            <span className="rounded-full bg-surface-muted px-3 py-1">{categoryLabel}</span>
                            <span>·</span>
                          </>
                        )}
                        {article.publishedAt && (
                          <time dateTime={article.publishedAt}>
                            {new Date(article.publishedAt).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </time>
                        )}
                      </div>
                      <h2 className="mt-2 text-xl font-semibold text-text-primary">
                        <Link href={`/${locale}/blog/${article.slug ?? ""}`} className="hover:text-primary transition-colors">
                          {article.title ?? ""}
                        </Link>
                      </h2>
                      {article.excerpt && <p className="mt-2 text-text-secondary">{article.excerpt}</p>}
                      <Link href={`/${locale}/blog/${article.slug ?? ""}`} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                        {locale === "da" ? "Læs mere →" : "Read more →"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
