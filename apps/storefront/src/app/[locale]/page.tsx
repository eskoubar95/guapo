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
import {
  homeMockProducts,
  homeMockRoutines,
  homeMockContent,
  homeMockCategories,
} from "@/lib/home-mock";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const validLocale = locale as Locale;

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
      variant: "dark" as const,
      badge: dict.home.promoSlider.slide1.badge,
      title: dict.home.promoSlider.slide1.title,
      subtitle: dict.home.promoSlider.slide1.subtitle,
      disclaimer: dict.home.promoSlider.slide1.disclaimer,
      ctaText: dict.home.promoSlider.slide1.ctaText,
      ctaHref: "/categories",
    },
    {
      id: "slide2",
      variant: "light-blue" as const,
      title: dict.home.promoSlider.slide2.title,
      subtitle: dict.home.promoSlider.slide2.subtitle,
      ctaText: dict.home.promoSlider.slide2.ctaText,
      ctaHref: "/categories",
    },
    {
      id: "slide3",
      variant: "light-warm" as const,
      title: dict.home.promoSlider.slide3.title,
      subtitle: dict.home.promoSlider.slide3.subtitle,
      ctaText: dict.home.promoSlider.slide3.ctaText,
      ctaHref: "/categories",
      ctaVariant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-full bg-white">
      {/* Promo bars (design: two bars, not hero) */}
      <HomePromoBars
        bar1={dict.home.promoBars.bar1}
        bar2={dict.home.promoBars.bar2}
      />

      {/* Category strip with colored circles */}
      <CategoryStrip categories={homeMockCategories} locale={validLocale} />

      {/* Promotion slider (3 slides) */}
      <PromotionSlider slides={promoSliderSlides} locale={validLocale} />

      {/* Editor picks */}
      <FeaturedProducts
        title={dict.home.editorPicks}
        products={featuredProducts}
        locale={validLocale}
        layout="carousel"
        backgroundColor="bg-white"
      />

      {/* Campaign: Vinter hudpleje */}
      <CampaignSection
        title={dict.home.campaign.title}
        description={dict.home.campaign.description}
        image="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80"
        primaryCta={{
          text: dict.home.campaign.ctaText,
          href: "/categories",
        }}
        locale={validLocale}
        layout="background"
      />

      {/* Bestsellers */}
      <FeaturedProducts
        title={dict.home.featured.title}
        products={bestSellers}
        locale={validLocale}
        viewAllLink="/categories"
        viewAllText="Se alle"
        backgroundColor="bg-gradient-to-b from-slate-50/50 to-white"
        layout="carousel"
      />

      {/* Routine block */}
      <RoutineBlock
        title={dict.home.routine.title}
        subtitle={dict.home.routine.subtitle}
        routines={homeMockRoutines}
        locale={validLocale}
        layout="carousel"
        backgroundColor="bg-surface-muted/30"
      />

      {/* New arrivals */}
      <FeaturedProducts
        title={dict.home.newArrivals.title}
        products={newArrivals}
        locale={validLocale}
        viewAllLink="/categories"
        backgroundColor="bg-gradient-to-b from-sky-50/20 to-white"
        layout="carousel"
      />

      {/* Content grid: Inspiration & Guides */}
      <ContentGrid
        title={dict.home.content.title}
        subtitle={dict.home.content.subtitle}
        content={homeMockContent}
        locale={validLocale}
        layout="carousel"
      />

      {/* Brand spotlight: The Ordinary */}
      <BrandSpotlight
        brandName="The Ordinary"
        description={dict.home.brandSpotlight.description}
        brandImage="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80"
        products={brandProducts}
        brandPageLink="/brands/the-ordinary"
        locale={validLocale}
        backgroundColor="bg-gradient-to-b from-teal-50/20 to-slate-50/30"
      />

      {/* CTA strip */}
      <CtaStrip locale={validLocale} backgroundColor="bg-white" />

      {/* Service strip */}
      <ServiceStrip
        backgroundColor="bg-gradient-to-br from-slate-50/40 to-sky-50/20"
      />

      {/* Newsletter */}
      <Newsletter
        title={dict.home.newsletter.title}
        description={dict.home.newsletter.description}
        placeholder={dict.home.newsletter.placeholder}
        submitLabel={dict.home.newsletter.submitLabel}
      />
    </div>
  );
}
