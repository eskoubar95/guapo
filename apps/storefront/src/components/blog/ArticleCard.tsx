import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { articleThumbnailUrl, type PayloadArticleListItem } from "@/lib/payload-articles";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { blogCategoryLabel } from "@/components/blog/blog-helpers";

interface ArticleCardProps {
  article: PayloadArticleListItem;
  locale: Locale;
  dict: Dictionary;
  variant: "grid" | "featured";
}

export function ArticleCard({ article, locale, dict, variant }: ArticleCardProps) {
  if (!article.slug?.trim()) return null;
  const href = `/${locale}/blog/${article.slug}`;
  const thumbUrl = articleThumbnailUrl(article);
  const title = article.title ?? "";
  const categoryLabel = blogCategoryLabel(article, dict);
  const readMore = `${dict.blog.readMore} →`;

  if (variant === "featured") {
    return (
      <article className="min-w-0">
        <Link
          href={href}
          className="group grid min-h-0 grid-cols-1 gap-4 rounded-xl bg-surface-muted/35 p-5 transition-colors hover:bg-surface-muted/50 sm:gap-5 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] md:items-center md:gap-7 md:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
        >
          <div className="relative h-[236px] min-h-[236px] w-full shrink-0 overflow-hidden rounded-xl bg-background/60 sm:h-[268px] sm:min-h-[268px] md:h-[288px] md:min-h-[288px] md:max-h-[288px]">
            <ImageWithFallback
              src={thumbUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center py-0.5 md:py-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              {categoryLabel && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground sm:text-sm">
                  {categoryLabel}
                </span>
              )}
              {categoryLabel && article.publishedAt && <span aria-hidden>·</span>}
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString(
                    locale === "da" ? "da-DK" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </time>
              )}
            </div>
            <h2 className="mt-2.5 text-2xl font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
              {title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
            )}
            <span className="mt-4 inline-flex text-sm font-semibold text-primary">{readMore}</span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <li className="min-w-0 h-full">
      <article className="h-full">
        <Link
          href={href}
          className="group flex h-full flex-col overflow-hidden rounded-xl transition-colors hover:bg-surface-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
        >
          <div className="aspect-[16/10] overflow-hidden rounded-lg bg-surface-muted shrink-0">
            <ImageWithFallback
              src={thumbUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {categoryLabel && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {categoryLabel}
                </span>
              )}
              {categoryLabel && article.publishedAt && <span aria-hidden>·</span>}
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString(
                    locale === "da" ? "da-DK" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </time>
              )}
            </div>
            <h2 className="mt-2 text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h2>
            {article.excerpt && (
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                {article.excerpt}
              </p>
            )}
            <span className="mt-3 text-sm font-medium text-primary">{readMore}</span>
          </div>
        </Link>
      </article>
    </li>
  );
}
