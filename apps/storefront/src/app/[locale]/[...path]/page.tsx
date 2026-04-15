/**
 * Catch-all route for Payload CMS Pages (path-based).
 * Renders pages from the Pages collection: default (rich text), landing, or homepage-type sections.
 * Examples: /da/handelsbetingelser, /da/om-os, /da/campaign/summer-sale
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchPageByPath } from "@/lib/payload-homepage";
import { getStorefrontSiteUrl, normalizeImageUrlForSharing } from "@/lib/site-url";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";
import { buildLocaleAlternates } from "@/lib/seo-locale-alternates";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { resolveHomepageData } from "@/lib/resolve-homepage-data";
import { HomePageSections } from "@/components/home/HomePageSections";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { productCardA11yFromDict } from "@/components/product-card-a11y";
import { ArticleFeed } from "@/components/blog/ArticleFeed";
import { fetchLatestArticles } from "@/lib/payload-articles";

interface PayloadPageProps {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<{ draft?: string }>;
}

export async function generateMetadata({ params }: PayloadPageProps): Promise<Metadata> {
  const { locale, path: pathSegments } = await params;
  const pathString = pathSegments?.length ? pathSegments.join("/") : "";
  if (!pathString) return { title: "Page" };

  const page = await fetchPageByPath(pathString, locale as Locale);
  if (!page) return { title: "Page" };

  const metaTitle = typeof page.meta?.title === "string" ? page.meta.title.trim() : "";
  const rawTitle = typeof page.title === "string" ? page.title.trim() : "";
  const title = metaTitle ? { absolute: metaTitle } : rawTitle || "Page";
  const description =
    typeof page.meta?.description === "string" ? page.meta.description.trim() : undefined;
  const siteUrl = getStorefrontSiteUrl();
  const pathSuffix = `/${pathString.split("/").map(encodeURIComponent).join("/")}`;
  const pageUrl = `${siteUrl}/${locale}${pathSuffix}`;
  const ogRaw = resolvePayloadMediaUrl(
    page.meta?.image as Parameters<typeof resolvePayloadMediaUrl>[0],
  );
  const ogImage = normalizeImageUrlForSharing(ogRaw);
  const ogTitle = metaTitle || rawTitle || "Page";

  return {
    title,
    description: description || undefined,
    alternates: buildLocaleAlternates(locale, pathSuffix),
    openGraph: {
      type: "website",
      siteName: "Guapo",
      url: pageUrl,
      locale,
      title: ogTitle,
      description: description || undefined,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(ogImage
      ? { twitter: { card: "summary_large_image" as const, images: [ogImage] } }
      : {}),
    robots: { index: true, follow: true },
  };
}

export default async function PayloadPageRoute({ params, searchParams }: PayloadPageProps) {
  const { locale, path: pathSegments } = await params;
  const { draft: draftParam } = await searchParams;
  const validLocale = locale as Locale;
  const draft = draftParam === "1" || draftParam === "true";

  if (!pathSegments?.length) {
    notFound();
  }

  const pathString = pathSegments.join("/");
  if (pathString === "home") {
    notFound();
  }

  const page = await fetchPageByPath(pathString, validLocale, { draft });
  if (!page) {
    notFound();
  }

  const dict = await getDictionary(validLocale);

  if (page.pageType === "default") {
    const title = (page.title as string) ?? "Page";
    const contentHtml = lexicalToHtml(page.content);
    const siteUrl = getStorefrontSiteUrl();
    const pageUrl = `${siteUrl}/${validLocale}/${pathString.split("/").map(encodeURIComponent).join("/")}`;
    return (
      <div className="min-h-full">
        <main className="container mx-auto max-w-3xl px-4 py-12">
          <BreadcrumbJsonLd
            items={[
              { name: dict.common.breadcrumbRoot, url: `${siteUrl}/${validLocale}` },
              { name: title, url: pageUrl },
            ]}
          />
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${validLocale}`} className="hover:text-primary">
                  {dict.common.breadcrumbRoot}
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground">{title}</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {contentHtml ? (
            <div
              className="mt-8 prose prose-neutral dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_p]:mb-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <p className="mt-6 text-muted-foreground">
              {validLocale === "da" ? "Indhold mangler." : "Content missing."}
            </p>
          )}
        </main>
      </div>
    );
  }

  if (page.pageType === "landing" || page.pageType === "homepage") {
    const sections = page.sections ?? [];
    if (!sections.length) {
      const title = (page.title as string) ?? "Page";
      return (
        <div className="min-h-full">
          <main className="container mx-auto max-w-3xl px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-6 text-muted-foreground">
              {validLocale === "da" ? "Ingen sektioner konfigureret." : "No sections configured."}
            </p>
          </main>
        </div>
      );
    }
    const { resolvedProducts, resolvedArticles } = await resolveHomepageData(sections, validLocale);
    const productCardA11y = productCardA11yFromDict(dict);
    return (
      <div className="min-h-full w-full bg-background min-w-0 overflow-x-clip">
        <HomePageSections
          sections={sections}
          locale={validLocale}
          resolvedProducts={resolvedProducts}
          resolvedArticles={resolvedArticles}
          productCardA11y={productCardA11y}
          promoSliderLabels={{
            previousSlide: dict.home.promoSlider.previousSlide,
            nextSlide: dict.home.promoSlider.nextSlide,
            goToSlide: dict.home.promoSlider.goToSlide,
          }}
        />
      </div>
    );
  }

  if (page.pageType === "blog-index") {
    const articles = await fetchLatestArticles(validLocale, 50);
    const introHtml = page.content ? lexicalToHtml(page.content) : "";
    const pageTitle = (page.title as string) ?? undefined;
    return (
      <div className="min-h-full w-full bg-background min-w-0 overflow-x-clip">
        <main className="section-container py-8 sm:py-10 lg:py-12">
          <ArticleFeed
            articles={articles}
            locale={validLocale}
            dict={dict}
            pageTitle={pageTitle}
            introHtml={introHtml || undefined}
          />
        </main>
      </div>
    );
  }

  notFound();
}
