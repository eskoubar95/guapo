import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  HomePromoBars,
  CategoryStrip,
  PromotionSlider,
  FeaturedProducts,
  CampaignSection,
  ServiceStrip,
  BrandSpotlight,
  ContentGrid,
  RoutineBlock,
  CtaStrip,
  Newsletter,
} from "@/components/sections";
import { HomePageSections } from "@/components/home/HomePageSections";
import {
  homeMockProducts,
  homeMockRoutines,
  homeMockContent,
  homeMockCategories,
} from "@/lib/home-mock";
import { fetchHomepage, fetchPageByPath } from "@/lib/payload-homepage";
import { fetchProductsByHandles } from "@/lib/medusa-products";
import { fetchLatestArticles, articleThumbnailUrl } from "@/lib/payload-articles";
import type { HomepageSection } from "@/lib/payload-homepage";
import type { BlogCarouselArticle } from "@/components/sections/BlogCarouselSection";
import type { Product } from "@/components/ProductCard";

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string }>;
}

/** Resolve products for featured-products blocks and articles for blog-carousel blocks. */
async function resolveHomepageData(
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

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const { draft: draftParam } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const validLocale = locale as Locale;
  const draft = draftParam === "1" || draftParam === "true";

  // Prefer Page with path "home" (Pages collection) over Homepage global
  const homePage = await fetchPageByPath("home", validLocale, { draft });
  const sectionsFromPage =
    homePage?.pageType === "homepage" && homePage?.sections?.length
      ? homePage.sections
      : null;
  const homepage = await fetchHomepage(validLocale, { draft });
  const sectionsFromGlobal = homepage?.sections;
  const sections = sectionsFromPage ?? sectionsFromGlobal ?? null;
  const hasCmsSections = sections && sections.length > 0;

  if (hasCmsSections && sections) {
    const { resolvedProducts, resolvedArticles } = await resolveHomepageData(sections, validLocale);
    return (
      <div className="min-h-full bg-background min-w-0 overflow-x-hidden">
        <HomePageSections
          sections={sections}
          locale={validLocale}
          resolvedProducts={resolvedProducts}
          resolvedArticles={resolvedArticles}
        />
      </div>
    );
  }

  // Fallback: CMS not configured or no sections — render static/mock layout
  const featuredProducts = homeMockProducts.slice(0, 8);
  const bestSellersList = homeMockProducts.slice(0, 5);
  const bestSellers = [
    ...bestSellersList.map((p, i) => ({ ...p, id: `bestseller-${p.id}-${i}` })),
    ...bestSellersList.map((p, i) => ({ ...p, id: `bestseller-b-${p.id}-${i}` })),
  ];
  const newArrivals = homeMockProducts.slice(1, 8);
  const brandProductsList = homeMockProducts.slice(0, 5);
  const brandProducts = [
    ...brandProductsList.map((p, i) => ({ ...p, id: `brand-${p.id}-${i}` })),
    ...brandProductsList.map((p, i) => ({ ...p, id: `brand-b-${p.id}-${i}` })),
  ];

  const promoSliderSlides = [
    {
      id: "slide1",
      imageDesktopUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80",
      href: "/categories",
    },
  ];

  return (
    <div className="min-h-full bg-background min-w-0 overflow-x-hidden">
      <HomePromoBars bar1={dict.home.promoBars.bar1} bar2={dict.home.promoBars.bar2} />
      <CategoryStrip categories={homeMockCategories} locale={validLocale} />
      <PromotionSlider slides={promoSliderSlides} locale={validLocale} />
      <FeaturedProducts
        title={dict.home.editorPicks}
        products={featuredProducts}
        locale={validLocale}
        layout="carousel"
        backgroundColor="bg-background"
      />
      <CampaignSection
        title={dict.home.campaign.title}
        description={dict.home.campaign.description}
        image="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80"
        primaryCta={{ text: dict.home.campaign.ctaText, href: "/categories" }}
        locale={validLocale}
        layout="background"
      />
      <FeaturedProducts
        title={dict.home.featured.title}
        products={bestSellers}
        locale={validLocale}
        viewAllLink="/categories"
        viewAllText="Se alle"
        backgroundColor="bg-gradient-to-b from-surface-muted/50 to-background"
        layout="carousel"
      />
      <RoutineBlock
        title={dict.home.routine.title}
        subtitle={dict.home.routine.subtitle}
        routines={homeMockRoutines}
        locale={validLocale}
        layout="carousel"
        backgroundColor="bg-surface-muted/30"
      />
      <FeaturedProducts
        title={dict.home.newArrivals.title}
        products={newArrivals}
        locale={validLocale}
        viewAllLink="/categories"
        backgroundColor="bg-gradient-to-b from-surface-muted/20 to-background"
        layout="carousel"
      />
      <ContentGrid
        title={dict.home.content.title}
        subtitle={dict.home.content.subtitle}
        content={homeMockContent}
        locale={validLocale}
        layout="carousel"
      />
      <BrandSpotlight
        brandName="The Ordinary"
        description={dict.home.brandSpotlight.description}
        brandImage="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80"
        products={brandProducts}
        brandPageLink="/brands/the-ordinary"
        locale={validLocale}
        backgroundColor="bg-gradient-to-b from-surface-muted/20 to-surface-muted/30"
      />
      <CtaStrip locale={validLocale} backgroundColor="bg-background" />
      <ServiceStrip backgroundColor="bg-gradient-to-br from-surface-muted/40 to-surface-muted/20" />
      <Newsletter
        locale={validLocale}
        title={dict.home.newsletter.title}
        description={dict.home.newsletter.description}
        placeholder={dict.home.newsletter.placeholder}
        submitLabel={dict.home.newsletter.submitLabel}
      />
    </div>
  );
}
