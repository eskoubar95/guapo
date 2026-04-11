/**
 * Payload CMS — Homepage global for storefront.
 * Fetches from PAYLOAD_API_URL/api/storefront/globals/homepage.
 */

import { getCached, setCache } from "@/lib/server-cache";

const PAYLOAD_URL = process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

/** Populated media from Payload (simplified for storefront). */
export interface PayloadMedia {
  id?: number;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Base block with discriminant. */
export interface HomepageBlockBase {
  id?: string | null;
  blockName?: string | null;
  blockType: string;
}

export interface HeroBlock extends HomepageBlockBase {
  blockType: "hero";
  variant?: "full" | "split" | "video" | null;
  heading: string;
  subheading?: string | null;
  backgroundImage?: PayloadMedia | number | null;
  videoUrl?: string | null;
  cta?: { text?: string | null; url?: string | null };
  textPosition?: "left" | "center" | "right" | null;
  textColor?: "light" | "dark" | null;
}

export interface FeaturedProductsBlock extends HomepageBlockBase {
  blockType: "featured-products";
  heading?: string | null;
  subheading?: string | null;
  displayType?: "grid" | "carousel" | null;
  products?: Array<{ id?: number; handle?: string; title?: string } | number> | null;
  productHandles?: { handle: string }[] | null;
  cta?: { show?: boolean | null; text?: string | null; url?: string | null };
}

export interface CategoriesBlockItem {
  category?: { handle?: string; name?: string } | number | null;
  title: string;
  image: PayloadMedia | number;
  url?: string | null;
  description?: string | null;
}

export interface CategoriesBlock extends HomepageBlockBase {
  blockType: "categories";
  heading?: string | null;
  layout?: "grid" | "featured" | "scroll" | null;
  categories?: CategoriesBlockItem[] | null;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  location?: string | null;
  rating?: number | null;
  product?: { handle?: string } | number | null;
  productHandle?: string | null;
  image?: PayloadMedia | number | null;
}

export interface TestimonialsBlock extends HomepageBlockBase {
  blockType: "testimonials";
  heading?: string | null;
  displayType?: "carousel" | "grid" | null;
  testimonials?: TestimonialItem[] | null;
}

export interface ContentBlockBlock extends HomepageBlockBase {
  blockType: "content-block";
  layout?: "text-image" | "image-text" | "text-only" | "text-only-left" | "full-width" | null;
  heading?: string | null;
  content?: unknown;
  image?: PayloadMedia | number | null;
  cta?: { show?: boolean | null; text?: string | null; url?: string | null };
  backgroundColor?: "white" | "gray" | "brand-light" | null;
}

export interface ImageTextBreakoutBlock extends HomepageBlockBase {
  blockType: "image-text-breakout";
  visualType?: "image" | "video" | null;
  image?: PayloadMedia | number | null;
  video?: PayloadMedia | number | null;
  imagePosition?: "left" | "right" | null;
  heading?: string | null;
  body?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  imageColumnBackground?: "light-blue" | "light-gray" | "white" | null;
}

export interface NewsletterBlock extends HomepageBlockBase {
  blockType: "newsletter";
  heading?: string | null;
  description?: string | null;
  backgroundColor?: "brand" | "dark" | "light" | null;
  incentive?: string | null;
}

export interface BlogCarouselBlock extends HomepageBlockBase {
  blockType: "blog-carousel";
  heading?: string | null;
  subheading?: string | null;
  source?: "latest" | "category" | "manual" | null;
  category?: string | null;
  articles?: Array<{ id?: number; slug?: string; title?: string } | number> | null;
  limit?: number | null;
  cta?: { show?: boolean | null; text?: string | null; url?: string | null };
}

export interface BrandsBannerBrandItem {
  brand?: { brandKey?: string; name?: string } | number | null;
  name?: string | null;
  logo?: PayloadMedia | number | null;
  url?: string | null;
}

export interface BrandsBannerBlock extends HomepageBlockBase {
  blockType: "brands-banner";
  heading?: string | null;
  displayType?: "scroll" | "grid" | null;
  brands?: BrandsBannerBrandItem[] | null;
}

export interface PromotionSliderSlide {
  imageDesktop?: PayloadMedia | number | null;
  imageTablet?: PayloadMedia | number | null;
  imageMobile?: PayloadMedia | number | null;
  href?: string | null;
}

export interface PromotionSliderBlock extends HomepageBlockBase {
  blockType: "promotion-slider";
  slides?: PromotionSliderSlide[] | null;
}

export interface PromoBarsBlock extends HomepageBlockBase {
  blockType: "promo-bars";
  bar1?: { text: string; subtext?: string | null };
  bar2?: { text: string; subtext?: string | null };
}

export interface InspirationGuidesCard {
  title: string;
  label?: string | null;
  excerpt?: string | null;
  image: PayloadMedia | number;
  url?: string | null;
}

export interface InspirationGuidesBlock extends HomepageBlockBase {
  blockType: "inspiration-guides";
  heading?: string | null;
  subheading?: string | null;
  layout?: "carousel" | "grid" | null;
  cards?: InspirationGuidesCard[] | null;
}

export interface BrandSpotlightBlock extends HomepageBlockBase {
  blockType: "brand-spotlight";
  brand?: { brandKey?: string; name?: string } | number | null;
  title?: string | null;
  description?: string | null;
  image?: PayloadMedia | number | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  productHandles?: { handle: string }[] | null;
}

export interface ServiceStripItem {
  iconType?: string | null;
  iconImage?: PayloadMedia | number | null;
  title: string;
  subtitle?: string | null;
  url?: string | null;
}

export interface ServiceStripBlock extends HomepageBlockBase {
  blockType: "service-strip";
  variant?: "minimal" | "cards" | null;
  backgroundColor?: "muted" | "white" | null;
  items?: ServiceStripItem[] | null;
}

export interface BulletColumnsColumn {
  columnHeading?: string | null;
  items?: { text: string }[] | null;
}

export interface BulletColumnsBlock extends HomepageBlockBase {
  blockType: "bullet-columns";
  heading?: string | null;
  columns?: BulletColumnsColumn[] | null;
  backgroundColor?: "white" | "gray" | "brand-light" | null;
}

export interface ValueCardsBlock extends HomepageBlockBase {
  blockType: "value-cards";
  heading?: string | null;
  cards?: { title: string; body: string }[] | null;
  backgroundColor?: "white" | "gray" | "brand-light" | null;
}

export type HomepageSection =
  | HeroBlock
  | FeaturedProductsBlock
  | CategoriesBlock
  | TestimonialsBlock
  | ContentBlockBlock
  | ImageTextBreakoutBlock
  | NewsletterBlock
  | BlogCarouselBlock
  | BrandsBannerBlock
  | PromotionSliderBlock
  | InspirationGuidesBlock
  | BrandSpotlightBlock
  | ServiceStripBlock
  | BulletColumnsBlock
  | ValueCardsBlock;

export interface PayloadHomepageMeta {
  title?: string | null;
  description?: string | null;
  image?: PayloadMedia | number | null;
}

export interface PayloadHomepage {
  id?: number;
  meta?: PayloadHomepageMeta;
  sections?: HomepageSection[] | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface FetchHomepageOptions {
  draft?: boolean;
}

/** Page document from Payload Pages collection (by path). */
export interface PayloadPage {
  id?: number;
  title?: string | null;
  slug?: string | null;
  path?: string | null;
  pageType?: "default" | "homepage" | "landing" | "blog-index" | null;
  meta?: PayloadHomepageMeta;
  content?: unknown;
  sections?: HomepageSection[] | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface FetchPageByPathOptions {
  draft?: boolean;
}

/**
 * Fetch a single page by path from Payload Pages collection.
 * Used for homepage (path "home"), landing pages, and content pages.
 */
export async function fetchPageByPath(
  path: string,
  locale: string,
  options: FetchPageByPathOptions = {}
): Promise<PayloadPage | null> {
  if (!PAYLOAD_URL) return null;

  const { draft = false } = options;
  const key = `payload:page:${path}:${locale}:${draft}`;
  const cached = getCached<PayloadPage | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      path,
      locale,
      "fallback-locale": "da",
    });
    if (draft) params.set("draft", "true");

    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/pages?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale === "da" ? "da,en" : "en,da",
        },
        next: { revalidate: 10 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PayloadPage;
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch Homepage global from Payload. Returns null if CMS not configured or request fails.
 */
export async function fetchHomepage(
  locale: string,
  options: FetchHomepageOptions = {}
): Promise<PayloadHomepage | null> {
  if (!PAYLOAD_URL) return null;

  const { draft = false } = options;
  const key = `payload:homepage:${locale}:${draft}`;
  const cached = getCached<PayloadHomepage | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      locale,
      "fallback-locale": "da",
    });
    if (draft) params.set("draft", "true");

    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/globals/homepage?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale === "da" ? "da,en" : "en,da",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PayloadHomepage;
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}
