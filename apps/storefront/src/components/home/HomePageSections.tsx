/**
 * Renders homepage sections from Payload Homepage global.
 * Maps each blockType to the corresponding section component.
 */

import type { HomepageSection, PayloadMedia } from "@/lib/payload-homepage";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";
import type { Product } from "@/components/ProductCard";
import type { ProductCardA11yLabels } from "@/components/product-card-a11y";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { CategoryStrip } from "@/components/sections/CategoryStrip";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { ContentBlockSection } from "@/components/sections/ContentBlockSection";
import { ImageTextBreakoutSection } from "@/components/sections/ImageTextBreakoutSection";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { Newsletter } from "@/components/sections/Newsletter";
import { HeroSection } from "@/components/sections/HeroSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { BlogCarouselSection } from "@/components/sections/BlogCarouselSection";
import { BrandsBannerSection } from "@/components/sections/BrandsBannerSection";
import { PromotionSlider } from "@/components/sections/PromotionSlider";
import { ContentGrid } from "@/components/sections/ContentGrid";
import { BrandSpotlight } from "@/components/sections/BrandSpotlight";
import { ServiceStrip } from "@/components/sections/ServiceStrip";
import { BulletColumnsSection } from "@/components/sections/BulletColumnsSection";
import { ValueCardsSection } from "@/components/sections/ValueCardsSection";
import type { PromotionSliderLabels } from "@/components/sections/PromotionSlider";

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "";

import type { BlogCarouselArticle } from "@/components/sections/BlogCarouselSection";

export interface HomePageSectionsProps {
  sections: HomepageSection[];
  locale: string;
  /** Resolved products for featured-products blocks, keyed by block key (id or type-index) */
  resolvedProducts?: Record<string, Product[]>;
  /** Resolved articles for blog-carousel blocks, keyed by block key */
  resolvedArticles?: Record<string, BlogCarouselArticle[]>;
  /** A11y labels for product cards (from dictionary). */
  productCardA11y: ProductCardA11yLabels;
  /** Promotion slider arrows / dots (from dictionary). */
  promoSliderLabels: PromotionSliderLabels;
}

export function HomePageSections({
  sections,
  locale,
  resolvedProducts = {},
  resolvedArticles = {},
  productCardA11y,
  promoSliderLabels,
}: HomePageSectionsProps) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((block, index) => {
        const key = (block as { id?: string }).id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case "hero": {
            const hero = block as import("@/lib/payload-homepage").HeroBlock;
            const bgUrl = resolvePayloadMediaUrl(hero.backgroundImage);
            const isFirstHero = sections.findIndex((b) => b.blockType === "hero") === index;
            return (
              <HeroSection
                key={key}
                heading={hero.heading}
                subheading={hero.subheading ?? undefined}
                backgroundImageUrl={bgUrl}
                cta={hero.cta}
                variant={hero.variant ?? "full"}
                textPosition={hero.textPosition ?? "center"}
                textColor={hero.textColor ?? "light"}
                headingLevel={isFirstHero ? 1 : 2}
                prioritizeAboveFold={index === 0}
                locale={locale}
              />
            );
          }

          case "featured-products": {
            const fp = block as import("@/lib/payload-homepage").FeaturedProductsBlock;
            const products = resolvedProducts[key] ?? [];
            const title = fp.heading ?? "Featured Products";
            const viewAll = fp.cta?.show ? { text: fp.cta.text ?? "View all", url: fp.cta.url ?? `/${locale}/categories` } : undefined;
            return (
              <FeaturedProducts
                key={key}
                title={title}
                products={products}
                locale={locale}
                viewAllLink={viewAll?.url}
                viewAllText={viewAll?.text}
                layout={fp.displayType === "grid" ? "grid" : "carousel"}
                backgroundColor="bg-background"
                productCardA11y={productCardA11y}
              />
            );
          }

          case "categories": {
            const cat = block as import("@/lib/payload-homepage").CategoriesBlock;
            const categories = (cat.categories ?? []).map((c) => {
              const img = c.image;
              const url = typeof img === "object" && img && "url" in img ? (img as PayloadMedia).url : "";
              const rawHref = c.url ?? (typeof c.category === "object" && c.category && "handle" in c.category ? `/categories/${(c.category as { handle?: string }).handle}` : "#");
              const href = rawHref.startsWith("/") ? rawHref : `/${rawHref}`;
              return {
                name: c.title,
                href,
                image: url?.startsWith("http") ? url : url ? `${PAYLOAD_URL.replace(/\/$/, "")}${url}` : undefined,
              };
            });
            if (categories.length === 0) return null;
            return (
              <CategoryStrip
                key={key}
                categories={categories}
                locale={locale}
              />
            );
          }

          case "testimonials": {
            const t = block as import("@/lib/payload-homepage").TestimonialsBlock;
            return (
              <TestimonialsSection
                key={key}
                heading={t.heading ?? "What our customers say"}
                testimonials={t.testimonials ?? []}
                displayType={t.displayType ?? "carousel"}
                locale={locale}
              />
            );
          }

          case "content-block": {
            const cb = block as import("@/lib/payload-homepage").ContentBlockBlock;
            const imgUrl = resolvePayloadMediaUrl(cb.image);
            const layout = cb.layout ?? "text-image";
            const isFullWidth = layout === "full-width";
            if (isFullWidth && (cb.heading || cb.cta?.text)) {
              return (
                <CampaignSection
                  key={key}
                  title={cb.heading ?? ""}
                  description={undefined}
                  image={imgUrl || undefined}
                  primaryCta={cb.cta?.show && cb.cta?.text ? { text: cb.cta.text, href: cb.cta.url ?? `/${locale}/categories` } : undefined}
                  locale={locale}
                  layout={imgUrl ? "background" : "centered"}
                />
              );
            }
            const contentHtml = lexicalToHtml(cb.content);
            const isTextOnly = layout === "text-only" || layout === "text-only-left";
            const hasContent = cb.heading || contentHtml || (imgUrl && !isTextOnly) || (cb.cta?.show && cb.cta?.text);
            if (!hasContent) return null;
            const contentLayout = layout === "text-only" ? "text-only" : layout === "text-only-left" ? "text-only-left" : layout === "image-text" ? "image-text" : "text-image";
            return (
              <ContentBlockSection
                key={key}
                heading={cb.heading ?? null}
                contentHtml={contentHtml}
                imageUrl={imgUrl || null}
                layout={contentLayout}
                backgroundColor={cb.backgroundColor ?? "white"}
                cta={cb.cta}
                locale={locale}
              />
            );
          }

          case "image-text-breakout": {
            const b = block as import("@/lib/payload-homepage").ImageTextBreakoutBlock;
            const useVideo = b.visualType === "video";
            const imgUrl = resolvePayloadMediaUrl(b.image);
            const videoUrl = useVideo ? resolvePayloadMediaUrl(b.video) : "";
            if (!b.heading) return null;
            if (useVideo) {
              if (!videoUrl) return null;
            } else if (!imgUrl) {
              return null;
            }
            return (
              <ImageTextBreakoutSection
                key={key}
                imageUrl={imgUrl || null}
                videoUrl={useVideo ? videoUrl : null}
                imagePosition={b.imagePosition === "right" ? "right" : "left"}
                heading={b.heading}
                body={b.body ?? null}
                ctaText={b.ctaText ?? "Shop nu"}
                ctaUrl={b.ctaUrl ?? "/categories"}
                imageColumnBackground={b.imageColumnBackground ?? "light-blue"}
                locale={locale}
              />
            );
          }

          case "newsletter": {
            const n = block as import("@/lib/payload-homepage").NewsletterBlock;
            return (
              <Newsletter
                key={key}
                locale={locale}
                title={n.heading ?? "Join our newsletter"}
                description={n.description ?? "Subscribe for exclusive offers and skincare tips."}
                placeholder={locale === "da" ? "Din e-mail" : "Your email"}
                submitLabel={locale === "da" ? "Tilmeld" : "Subscribe"}
              />
            );
          }

          case "blog-carousel": {
            const bc = block as import("@/lib/payload-homepage").BlogCarouselBlock;
            const articles = resolvedArticles[key] ?? [];
            return (
              <BlogCarouselSection
                key={key}
                heading={bc.heading ?? "From our blog"}
                subheading={bc.subheading}
                locale={locale}
                source={bc.source ?? "latest"}
                category={bc.category ?? undefined}
                limit={bc.limit ?? 4}
                cta={bc.cta?.show ? { text: bc.cta.text ?? "Read more", url: bc.cta.url ?? `/${locale}/blog` } : undefined}
                articles={articles}
              />
            );
          }

          case "brands-banner": {
            const bb = block as import("@/lib/payload-homepage").BrandsBannerBlock;
            return (
              <BrandsBannerSection
                key={key}
                heading={bb.heading ?? "Our brands"}
                brands={bb.brands ?? []}
                displayType={bb.displayType ?? "scroll"}
                locale={locale}
                payloadBaseUrl={PAYLOAD_URL.replace(/\/$/, "")}
              />
            );
          }

          case "promotion-slider": {
            const ps = block as import("@/lib/payload-homepage").PromotionSliderBlock;
            const slides = (ps.slides ?? [])
              .map((s, i) => {
                const desktopUrl = resolvePayloadMediaUrl(s.imageDesktop);
                if (!desktopUrl) return null;
                return {
                  id: `slide-${i}`,
                  imageDesktopUrl: desktopUrl,
                  imageTabletUrl: resolvePayloadMediaUrl(s.imageTablet) || undefined,
                  imageMobileUrl: resolvePayloadMediaUrl(s.imageMobile) || undefined,
                  href: (s.href && String(s.href).trim()) ? String(s.href).trim() : undefined,
                };
              })
              .filter((s): s is NonNullable<typeof s> => s != null);
            if (slides.length === 0) return null;
            return (
              <PromotionSlider key={key} slides={slides} locale={locale} labels={promoSliderLabels} />
            );
          }

          case "inspiration-guides": {
            const ig = block as import("@/lib/payload-homepage").InspirationGuidesBlock;
            const cards = (ig.cards ?? []).map((c, i) => {
              const img = c.image;
              const imageUrl = typeof img === "object" && img && "url" in img ? (img as PayloadMedia).url : "";
              const href = (c.url ?? "").replace(/^\//, "").replace(/^(da|en)\//, "");
              return {
                id: `ig-${key}-${i}`,
                title: c.title,
                image: imageUrl?.startsWith("http") ? imageUrl : imageUrl ? `${PAYLOAD_URL.replace(/\/$/, "")}${imageUrl}` : "",
                href,
                label: c.label ?? undefined,
                excerpt: c.excerpt ?? undefined,
              };
            });
            if (cards.length === 0) return null;
            return (
              <ContentGrid
                key={key}
                title={ig.heading ?? "Inspiration & Guides"}
                subtitle={ig.subheading ?? undefined}
                content={cards}
                locale={locale}
                layout={ig.layout === "grid" ? "grid" : "carousel"}
              />
            );
          }

          case "brand-spotlight": {
            const bs = block as import("@/lib/payload-homepage").BrandSpotlightBlock;
            const brandName = bs.title ?? (typeof bs.brand === "object" && bs.brand && "name" in bs.brand ? (bs.brand as { name?: string }).name : null) ?? "Brand";
            const brandKey = typeof bs.brand === "object" && bs.brand && "brandKey" in bs.brand ? (bs.brand as { brandKey?: string }).brandKey : undefined;
            const brandPagePath = (bs.ctaUrl ?? (brandKey ? `brands/${brandKey}` : "brands")).replace(/^\//, "");
            const products = resolvedProducts[key] ?? [];
            const imageUrl = resolvePayloadMediaUrl(bs.image);
            return (
              <BrandSpotlight
                key={key}
                brandName={brandName}
                description={bs.description ?? ""}
                brandImage={imageUrl || undefined}
                products={products}
                brandPageLink={brandPagePath}
                locale={locale}
                backgroundColor="bg-gradient-to-b from-surface-muted/20 to-surface-muted/30"
                productCardA11y={productCardA11y}
              />
            );
          }

          case "service-strip": {
            const ss = block as import("@/lib/payload-homepage").ServiceStripBlock;
            const cmsItems = (ss.items ?? []).map((item) => {
              const rawUrl = item.url ?? undefined;
              const url = !rawUrl ? undefined : rawUrl.startsWith("http") ? rawUrl : rawUrl.startsWith(`/${locale}/`) || rawUrl.startsWith(`${locale}/`) ? (rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`) : `/${locale}/${rawUrl.replace(/^\//, "")}`;
              return {
                iconType: item.iconType ?? undefined,
                iconImageUrl: item.iconImage ? resolvePayloadMediaUrl(item.iconImage) || undefined : undefined,
                title: item.title,
                subtitle: item.subtitle ?? undefined,
                url,
              };
            });
            if (cmsItems.length === 0) return null;
            return (
              <ServiceStrip
                key={key}
                cmsItems={cmsItems}
                variant={ss.variant === "cards" ? "cards" : "minimal"}
                backgroundColor={ss.backgroundColor === "white" ? "bg-background" : "bg-surface-muted/30"}
              />
            );
          }

          case "bullet-columns": {
            const bc = block as import("@/lib/payload-homepage").BulletColumnsBlock;
            const columns = bc.columns ?? [];
            if (columns.length === 0) return null;
            return (
              <BulletColumnsSection
                key={key}
                heading={bc.heading ?? null}
                columns={columns}
                backgroundColor={bc.backgroundColor ?? "white"}
              />
            );
          }

          case "value-cards": {
            const vc = block as import("@/lib/payload-homepage").ValueCardsBlock;
            const cards = vc.cards ?? [];
            if (cards.length === 0) return null;
            return (
              <ValueCardsSection
                key={key}
                heading={vc.heading ?? null}
                cards={cards}
                backgroundColor={vc.backgroundColor ?? "white"}
              />
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
