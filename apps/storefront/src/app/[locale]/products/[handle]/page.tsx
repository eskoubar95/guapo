import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPageTabs } from "@/components/ProductPageTabs";
import { KeyInformationCard } from "@/components/KeyInformationCard";
import { PDPTrustStrip } from "@/components/PDPTrustStrip";
import { ProductPurchaseSection } from "@/components/product/ProductPurchaseSection";
import { WishlistButton } from "@/components/product/WishlistButton";
import { fetchProductByHandle, fetchRecommendedProducts } from "@/lib/medusa-products";
import { fetchFreeShippingConfig } from "@/lib/free-shipping-config.server";
import { fetchPayloadProductByHandle } from "@/lib/payload-products";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";
import { getStorefrontSiteUrl, normalizeImageUrlForSharing } from "@/lib/site-url";
import { buildLocaleAlternates } from "@/lib/seo-locale-alternates";
import { stripHtmlToPlainText } from "@/lib/seo-text";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { productCardA11yFromDict } from "@/components/product-card-a11y";
import { ProductReviewsSection } from "@/components/ProductReviewsSection";
import { TrackProductView } from "@/components/analytics/TrackProductView";

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const [medusaProduct, payloadProduct] = await Promise.all([
    fetchProductByHandle(handle),
    fetchPayloadProductByHandle(handle, locale),
  ]);

  if (!medusaProduct) return { title: "Product Not Found" };

  const displayTitle =
    payloadProduct?.title ?? medusaProduct.title ?? handle;
  const metaTitle = payloadProduct?.meta?.title?.trim();
  const metaDesc = payloadProduct?.meta?.description?.trim();
  const siteUrl = getStorefrontSiteUrl();
  const pageUrl = `${siteUrl}/${locale}/products/${handle}`;
  const pathWithoutLocale = `/products/${encodeURIComponent(handle)}`;

  const payloadOgRaw = resolvePayloadMediaUrl(
    payloadProduct?.meta?.image as Parameters<typeof resolvePayloadMediaUrl>[0],
  );
  const medusaGallery = (medusaProduct.images ?? [])
    .map((img) => img.url)
    .filter((u): u is string => !!u);
  const medusaFallback =
    medusaGallery[0] ?? (medusaProduct.thumbnail ? medusaProduct.thumbnail : undefined);
  const ogImage =
    normalizeImageUrlForSharing(payloadOgRaw) ||
    (medusaFallback ? normalizeImageUrlForSharing(medusaFallback) : "");

  return {
    title: metaTitle ? { absolute: metaTitle } : displayTitle,
    description: metaDesc || undefined,
    alternates: await buildLocaleAlternates(locale, pathWithoutLocale),
    openGraph: {
      type: "website",
      siteName: "Guapo",
      title: metaTitle || displayTitle,
      description: metaDesc || undefined,
      url: pageUrl,
      locale,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(ogImage
      ? { twitter: { card: "summary_large_image" as const, images: [ogImage] } }
      : {}),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle } = await params;
  const dict = await getDictionary(locale as Locale);
  const productCardA11y = productCardA11yFromDict(dict);
  const localeKey = locale as "da" | "en";

  const [medusaProduct, payloadProduct, fsConfig] = await Promise.all([
    fetchProductByHandle(handle),
    fetchPayloadProductByHandle(handle, locale),
    fetchFreeShippingConfig(),
  ]);

  if (!medusaProduct) notFound();

  const title =
    payloadProduct?.title ?? medusaProduct.title ?? handle;
  const description =
    payloadProduct?.description ??
    (typeof medusaProduct.metadata?.description === "string"
      ? medusaProduct.metadata.description
      : "");

  const images = (medusaProduct.images ?? [])
    .map((img) => img.url)
    .filter((url): url is string => !!url);
  if (medusaProduct.thumbnail && !images.length) {
    images.push(medusaProduct.thumbnail);
  }

  const variants = (medusaProduct.variants ?? []).map((v) => {
    const priceObj = v.calculated_price;
    const amount = priceObj?.calculated_amount_with_tax ?? priceObj?.calculated_amount ?? 0;
    return {
      id: v.id ?? "",
      title: v.title ?? "",
      price: amount,
      manage_inventory: v.manage_inventory,
      inventory_quantity: v.inventory_quantity,
    };
  });

  // Medusa calculated_amount_with_tax is in major units (e.g. 150 = 150 kr inkl. moms).
  const basePrice = variants[0]?.price ?? 0;

  const skinTypes = payloadProduct?.skinTypes ?? [];
  const concerns = payloadProduct?.concerns ?? [];
  const keyIngredients = payloadProduct?.keyIngredients ?? [];

  const medusaVolume = typeof medusaProduct.metadata?.volume === "string" ? medusaProduct.metadata.volume : undefined;
  const specifications = {
    ...payloadProduct?.specifications,
    ...(medusaVolume && !payloadProduct?.specifications?.volume && { volume: medusaVolume }),
  };

  const category = medusaProduct.categories?.[0];
  const categoryId = category?.id;
  const categoryHandle = category?.handle;
  const categoryName = category?.name;
  const recommendedProducts = await fetchRecommendedProducts(
    medusaProduct.handle ?? handle,
    categoryId,
    6,
    medusaProduct.id
  );

  const siteUrl = getStorefrontSiteUrl();
  const pdpUrl = `${siteUrl}/${locale}/products/${encodeURIComponent(handle)}`;
  const imagesForLd = images.map((u) => normalizeImageUrlForSharing(u)).filter(Boolean);
  const availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock" = (
    medusaProduct.variants ?? []
  ).some(
    (variant) =>
      variant.manage_inventory === false || (variant.inventory_quantity ?? 0) > 0,
  )
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const brandNameLd =
    medusaProduct.brand?.name ??
    (typeof medusaProduct.metadata?.brand === "string" ? medusaProduct.metadata.brand : undefined) ??
    payloadProduct?.brandName ??
    undefined;

  return (
    <div className="min-h-full min-w-0 overflow-x-clip">
      <ProductJsonLd
        name={title}
        description={stripHtmlToPlainText(description)}
        images={imagesForLd}
        brandName={brandNameLd}
        sku={medusaProduct.id}
        productUrl={pdpUrl}
        price={basePrice}
        priceCurrency="DKK"
        availability={availability}
      />
      <BreadcrumbJsonLd
        items={[
          { name: dict.common.breadcrumbRoot, url: `${siteUrl}/${locale}` },
          ...(categoryHandle && categoryName
            ? [
                {
                  name: categoryName,
                  url: `${siteUrl}/${locale}/categories/${encodeURIComponent(categoryHandle)}`,
                },
              ]
            : []),
          { name: title, url: pdpUrl },
        ]}
      />
      <TrackProductView
        productId={medusaProduct.id}
        handle={handle}
        name={title}
        price={basePrice}
        currency="DKK"
        categoryName={categoryName}
      />
      <main className="section-container py-8">
        {/* Breadcrumb: Guapo > Category (if any) > Product */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.breadcrumbRoot}
              </Link>
            </li>
            {categoryHandle && categoryName && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/${locale}/categories/${categoryHandle}`}
                    className="hover:text-primary"
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="truncate text-foreground" title={title}>
              {title}
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left: Product images + Key Information (design reference layout) */}
          <div className="space-y-6">
            <ProductGallery images={images} alt={title} />
            <KeyInformationCard
              ingredients={keyIngredients.map((ing) => ({
                name: ing.name,
                description: ing.benefit,
              }))}
              skinType={skinTypes.map((t) => t[localeKey]).join(", ") || dict.products.notSpecified}
              benefits={concerns.map((c) => c[localeKey]).join(", ") || dict.products.notSpecified}
              ingredientsLabel={dict.products.keyIngredients}
              skinTypeLabel={dict.products.skinTypes}
              benefitsLabel={dict.products.targets}
            />
          </div>

          {/* Right: Product details + purchase flow */}
          <div className="mt-8 lg:mt-0">
            {payloadProduct?.brandName && (
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {payloadProduct.brandName}
              </p>
            )}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              <WishlistButton
                productId={handle}
                addLabel={dict.wishlist?.addToWishlist ?? "Tilføj til ønskeliste"}
                removeLabel={dict.wishlist?.removeFromWishlist ?? "Fjern fra ønskeliste"}
              />
            </div>
            {payloadProduct?.subtitle && (
              <p className="mt-2 text-muted-foreground">{payloadProduct.subtitle}</p>
            )}

            {/* Prominent price */}
            <p className="mt-4 text-2xl font-semibold text-foreground">
              {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: "DKK",
                minimumFractionDigits: 0,
              }).format(basePrice)}
            </p>

            <ProductPurchaseSection
              variants={variants}
              sizeLabel={dict.products.size}
              quantityLabel={dict.products.quantity}
              addToCartLabel={dict.products.addToCart}
              addedLabel={dict.products.added}
              decreaseQuantityAriaLabel={dict.products.decreaseQuantity}
              increaseQuantityAriaLabel={dict.products.increaseQuantity}
              purchaseOptionsLabel={dict.products.purchaseOptions}
              outOfStockLabel={dict.products.outOfStock}
              lowStockWithCountLabel={dict.products.lowStockWithCount}
              subscriptionConfig={{ basePrice, currency: "DKK", locale }}
              analyticsContext={{
                medusaProductId: medusaProduct.id,
                handle,
                title,
                currency: "DKK",
                ...(categoryName ? { categoryName } : {}),
              }}
            />

            <PDPTrustStrip labels={{
              ...dict.products.trustStrip,
              freeShipping: dict.products.trustStrip.freeShipping.replace("{{threshold}}", String(fsConfig.threshold)),
            }} />

            {/* Product tabs */}
            <ProductPageTabs
              locale={locale}
              labels={{
                description: dict.products.tabs.description,
                ingredients: dict.products.tabs.ingredients,
                specifications: dict.products.tabs.specifications,
              }}
              description={description}
              skinTypes={skinTypes}
              concerns={concerns}
              keyIngredients={keyIngredients.map((ing) => ({
                name: ing.name,
                benefit: { da: ing.benefit, en: ing.benefit },
              }))}
              ingredients={payloadProduct?.ingredients ?? []}
              specifications={Object.keys(specifications).length > 0 ? specifications : undefined}
              keyIngredientsLabel={dict.products.keyIngredients}
              skinTypesLabel={dict.products.skinTypes}
              targetsLabel={dict.products.targets}
              volumeLabel={dict.products.volume}
            />
          </div>
        </div>

        <ProductReviewsSection
          productId={medusaProduct.id}
          locale={locale}
          labels={dict.products.reviews}
        />

        {recommendedProducts.length > 0 && (
          <FeaturedProducts
            title={dict.products.relatedTitle}
            products={recommendedProducts}
            locale={locale}
            layout="carousel"
            productCardA11y={productCardA11y}
          />
        )}
      </main>
    </div>
  );
}
