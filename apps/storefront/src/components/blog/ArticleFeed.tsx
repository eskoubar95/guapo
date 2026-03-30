import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { PayloadArticleListItem } from "@/lib/payload-articles";
import { ArticleCard } from "@/components/blog/ArticleCard";

export interface ArticleFeedProps {
  articles: PayloadArticleListItem[];
  locale: Locale;
  dict: Dictionary;
  /** Optional page title override (e.g. from CMS page). */
  pageTitle?: string;
  /** Optional CMS rich text intro (HTML); when set, default dictionary intro is not shown. */
  introHtml?: string | null;
}

const introProseClass =
  "mt-3 max-w-2xl text-lg text-muted-foreground prose prose-neutral dark:prose-invert prose-p:mb-3 prose-p:last:mb-0 [&_a]:text-primary [&_a]:underline";

export function ArticleFeed({ articles, locale, dict, pageTitle, introHtml }: ArticleFeedProps) {
  const title = pageTitle?.trim() ? pageTitle.trim() : dict.blog.title;
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {introHtml ? (
          <div
            className={introProseClass}
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : (
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{dict.blog.intro}</p>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-muted/50 px-6 py-12 text-center text-muted-foreground">
          {dict.blog.empty}
        </p>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {featured && (
            <section aria-labelledby="blog-featured-heading">
              <h2 id="blog-featured-heading" className="sr-only">
                {dict.blog.featuredHeading}
              </h2>
              <ArticleCard article={featured} locale={locale} dict={dict} variant="featured" />
            </section>
          )}

          {rest.length > 0 && (
            <section aria-labelledby="blog-more-heading">
              <h2
                id="blog-more-heading"
                className="mb-3 text-base font-semibold text-muted-foreground sm:mb-4"
              >
                {dict.blog.moreArticles}
              </h2>
              <ul
                className="grid grid-cols-2 list-none gap-3 p-0 m-0 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6"
                role="list"
              >
                {rest.map((article) => (
                  <ArticleCard
                    key={article.slug ?? article.id}
                    article={article}
                    locale={locale}
                    dict={dict}
                    variant="grid"
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
