import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  articleOgImageUrl,
  articleThumbnailUrl,
  getArticleBySlugCached,
} from "@/lib/payload-articles";
import { getStorefrontSiteUrl } from "@/lib/site-url";
import { buildLocaleAlternates } from "@/lib/seo-locale-alternates";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { blogCategoryLabel } from "@/components/blog/blog-helpers";

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlugCached(slug, locale);
  if (!article) {
    return { title: "Not found" };
  }

  const title = article.meta?.title?.trim() || article.title || "Article";
  const description =
    article.meta?.description?.trim() || article.excerpt?.trim() || undefined;
  const imageUrl = articleOgImageUrl(article);
  const images = imageUrl ? [{ url: imageUrl }] : undefined;
  const siteUrl = getStorefrontSiteUrl();
  const blogPath = `/blog/${encodeURIComponent(slug)}`;
  const pageUrl = `${siteUrl}/${locale}${blogPath}`;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(locale, blogPath),
    openGraph: {
      title,
      description,
      images,
      type: "article",
      url: pageUrl,
      locale,
      publishedTime: article.publishedAt ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const validLocale = locale as Locale;
  const dict = await getDictionary(validLocale);
  const article = await getArticleBySlugCached(slug, validLocale);

  if (!article) {
    notFound();
  }

  const categoryLabel = blogCategoryLabel(article, dict);
  const heroUrl = articleThumbnailUrl(article);
  const featured = article.featuredImage;
  const imgAlt =
    (typeof featured === "object" && featured?.alt?.trim()) || article.title || "";

  const contentHtml = lexicalToHtml(article.content);
  const siteUrl = getStorefrontSiteUrl();
  const articleUrl = `${siteUrl}/${validLocale}/blog/${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-full w-full bg-background min-w-0 overflow-x-clip">
      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-10 lg:py-12">
        <article className="w-full">
          <BreadcrumbJsonLd
            items={[
              { name: dict.common.breadcrumbRoot, url: `${siteUrl}/${validLocale}` },
              { name: dict.blog.title, url: `${siteUrl}/${validLocale}/blog` },
              { name: article.title ?? slug, url: articleUrl },
            ]}
          />
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${validLocale}`}
                  className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-sm"
                >
                  {dict.common.breadcrumbRoot}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/${validLocale}/blog`}
                  className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-sm"
                >
                  {dict.blog.title}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground min-w-0 truncate">{article.title}</li>
            </ol>
          </nav>

          <header>
            <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {article.title}
            </h1>
          </header>

          {heroUrl && (
            <div className="mt-6 w-full overflow-hidden rounded-xl bg-surface-muted aspect-[16/9] sm:mt-8 sm:aspect-[2/1]">
              <ImageWithFallback
                src={heroUrl}
                alt={imgAlt}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {categoryLabel && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground sm:text-sm">
                {categoryLabel}
              </span>
            )}
            {categoryLabel && article.publishedAt && <span aria-hidden>·</span>}
            {article.publishedAt && (
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString(
                  validLocale === "da" ? "da-DK" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
            )}
          </div>

          {article.excerpt && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {article.excerpt}
            </p>
          )}

          {contentHtml ? (
            <div
              className="mt-8 w-full max-w-none prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:leading-relaxed [&_a]:text-primary [&_a]:underline [&_p]:mb-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <p className="mt-8 text-muted-foreground">
              {validLocale === "da" ? "Indhold mangler." : "Content missing."}
            </p>
          )}

          <div className="mt-12 border-t border-border pt-8">
            <Link
              href={`/${validLocale}/blog`}
              className="text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-sm"
            >
              ← {dict.blog.backToBlog}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
