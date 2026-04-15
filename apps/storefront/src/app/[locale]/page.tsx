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
import { resolveHomepageData } from "@/lib/resolve-homepage-data";
import { productCardA11yFromDict } from "@/components/product-card-a11y";
import { HomePrimaryHeroLoadGate } from "@/components/home/HomePrimaryHeroLoadGate";
import { getAboveFoldHeroBackgroundImageUrl } from "@/lib/homepage-primary-hero";
import { preload } from "react-dom";

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string }>;
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const { draft: draftParam } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const validLocale = locale as Locale;
  const draft = draftParam === "1" || draftParam === "true";

  // Prefer Page with path "home" (Pages collection) over Homepage global — avoid double CMS fetch when page wins
  const homePage = await fetchPageByPath("home", validLocale, { draft });
  const sectionsFromPage =
    homePage?.pageType === "homepage" && homePage?.sections?.length
      ? homePage.sections
      : null;
  const sections =
    sectionsFromPage ??
    (await fetchHomepage(validLocale, { draft }))?.sections ??
    null;
  const hasCmsSections = sections && sections.length > 0;
  const productCardA11y = productCardA11yFromDict(dict);

  if (hasCmsSections && sections) {
    const { resolvedProducts, resolvedArticles } = await resolveHomepageData(sections, validLocale);
    const aboveFoldHeroImageUrl = getAboveFoldHeroBackgroundImageUrl(sections);
    if (aboveFoldHeroImageUrl) {
      preload(aboveFoldHeroImageUrl, { as: "image" });
    }
    return (
      <HomePrimaryHeroLoadGate blockUntilPrimaryHeroMedia={Boolean(aboveFoldHeroImageUrl)}>
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
      </HomePrimaryHeroLoadGate>
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
    <div className="min-h-full w-full bg-background min-w-0 overflow-x-clip">
      <HomePromoBars bar1={dict.home.promoBars.bar1} bar2={dict.home.promoBars.bar2} />
      <CategoryStrip categories={homeMockCategories} locale={validLocale} />
      <PromotionSlider
        slides={promoSliderSlides}
        locale={validLocale}
        labels={{
          previousSlide: dict.home.promoSlider.previousSlide,
          nextSlide: dict.home.promoSlider.nextSlide,
          goToSlide: dict.home.promoSlider.goToSlide,
        }}
      />
      <FeaturedProducts
        title={dict.home.editorPicks}
        products={featuredProducts}
        locale={validLocale}
        layout="carousel"
        backgroundColor="bg-background"
        productCardA11y={productCardA11y}
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
        productCardA11y={productCardA11y}
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
        productCardA11y={productCardA11y}
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
        productCardA11y={productCardA11y}
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
