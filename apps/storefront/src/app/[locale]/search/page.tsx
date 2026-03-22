import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchProductsByQuery } from "@/lib/medusa-products";
import { fetchArticlesByQuery } from "@/lib/payload-articles";
import { ProductCard } from "@/components/ProductCard";
import { productCardA11yFromDict } from "@/components/product-card-a11y";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  return {
    title: q
      ? `${locale === "da" ? "Søgeresultater for" : "Search results for"} "${q}"`
      : (locale === "da" ? "Søg" : "Search"),
    robots: { index: false },
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q: query } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const trimmed = (query ?? "").trim();

  const [products, articles] =
    trimmed.length >= 2
      ? await Promise.all([
          fetchProductsByQuery(trimmed, 24),
          fetchArticlesByQuery(trimmed, locale, 8),
        ])
      : [[], []];

  const base = `/${locale}`;
  const s = dict.search;
  const productCardA11y = productCardA11yFromDict(dict);

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        <form action={`${base}/search`} method="GET" className="mb-8">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={s.placeholder}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              aria-label={dict.common.search}
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        {!trimmed ? (
          <p className="text-muted-foreground">{s.minChars}</p>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-foreground">
                {locale === "da" ? "Søgeresultater for" : "Search results for"} &quot;{query}&quot;
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {products.length} {locale === "da" ? "produkter" : "products"}
                {articles.length > 0 &&
                  ` · ${articles.length} ${locale === "da" ? "artikler" : "articles"}`}
              </p>
            </div>

            {products.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-foreground mb-4">{s.products}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      labels={productCardA11y}
                    />
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">{s.articles}</h2>
                <ul className="space-y-4">
                  {articles.map((article, index) => (
                    <li key={article.slug ?? article.id ?? index}>
                      <Link
                        href={`${base}/blog/${article.slug ?? ""}`}
                        className="block p-4 rounded-lg border border-border hover:bg-surface transition-colors"
                      >
                        {article.publishedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString(
                              locale === "da" ? "da-DK" : "en-GB",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </p>
                        )}
                        <h3 className="font-medium text-foreground mt-0.5">{article.title}</h3>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {products.length === 0 && articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{dict.search.noResults}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.tryDifferent}</p>
                <Link
                  href={`${base}/categories`}
                  className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {locale === "da" ? "Se alle kategorier →" : "Browse all categories →"}
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
