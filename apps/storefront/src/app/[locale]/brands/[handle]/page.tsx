import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { Suspense, cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Product } from "@/components/ProductCard";
import { FilterSystem, type FilterCategory } from "@/components/FilterSystem";
import { ProductCard } from "@/components/ProductCard";
import { productCardA11yFromDict } from "@/components/product-card-a11y";
import {
  fetchMedusaBrandByHandle,
  fetchPayloadBrandByHandle,
  resolveBrandDisplayTitle,
} from "@/lib/medusa-brands";
import { fetchProductsByBrand } from "@/lib/medusa-products";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";
import { categoryPlpFiltersEnabled } from "@/lib/feature-flags";
import { PLPSortSelect } from "@/components/plp/PLPSortSelect";

interface BrandPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const loadBrandPageData = cache(async (handle: string, locale: string) => {
  const medusaBrand = await fetchMedusaBrandByHandle(handle);
  const payloadBrand =
    medusaBrand != null
      ? await fetchPayloadBrandByHandle(handle, locale, medusaBrand.id)
      : null;
  return [medusaBrand, payloadBrand] as const;
});

function getFilterCategories(locale: string): FilterCategory[] {
  const isDa = locale === "da";
  return [
    {
      id: "brands",
      label: isDa ? "Mærker" : "Brands",
      options: [
        { value: "The Ordinary", count: 245 },
        { value: "CeraVe", count: 189 },
        { value: "La Roche-Posay", count: 312 },
        { value: "Paula's Choice", count: 156 },
      ],
    },
    {
      id: "price",
      label: isDa ? "Pris" : "Price",
      options: [
        { value: isDa ? "0-99 kr" : "0-99 DKK", count: 428 },
        { value: isDa ? "100-199 kr" : "100-199 DKK", count: 892 },
        { value: isDa ? "200-299 kr" : "200-299 DKK", count: 534 },
        { value: "300+", count: 267 },
      ],
    },
    {
      id: "skin-type",
      label: isDa ? "Hudtype" : "Skin type",
      options: [
        { value: isDa ? "Normal" : "Normal", count: 3139 },
        { value: isDa ? "Tør" : "Dry", count: 1945 },
        { value: isDa ? "Fedtet" : "Oily", count: 897 },
        { value: isDa ? "Kombineret" : "Combination", count: 1406 },
        { value: isDa ? "Sensitiv" : "Sensitive", count: 1688 },
      ],
    },
    {
      id: "concerns",
      label: isDa ? "Specialebehov" : "Concerns",
      options: [
        { value: isDa ? "Akne" : "Acne", count: 654 },
        { value: isDa ? "Rynker" : "Wrinkles", count: 823 },
        { value: isDa ? "Hyperpigmentering" : "Hyperpigmentation", count: 412 },
        { value: isDa ? "Rødme" : "Redness", count: 567 },
        { value: isDa ? "Tør hud" : "Dry skin", count: 1234 },
      ],
    },
  ];
}

function getPlpSortOptions(locale: string) {
  return [
    { value: "featured", label: locale === "da" ? "Anbefalet" : "Featured" },
    { value: "price-asc", label: locale === "da" ? "Pris: Lav til høj" : "Price: Low to high" },
    { value: "price-desc", label: locale === "da" ? "Pris: Høj til lav" : "Price: High to low" },
    { value: "newest", label: locale === "da" ? "Nyeste" : "Newest" },
  ];
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const [medusaBrand, payloadBrand] = await loadBrandPageData(handle, locale);
  if (!medusaBrand) notFound();

  const displayName = resolveBrandDisplayTitle(payloadBrand, medusaBrand.name, medusaBrand.handle);
  const metaTitle = payloadBrand?.meta?.title?.trim();
  const metaDesc = payloadBrand?.meta?.description?.trim();
  const ogImage = resolvePayloadMediaUrl(
    payloadBrand?.meta?.image as Parameters<typeof resolvePayloadMediaUrl>[0],
  );

  return {
    title: metaTitle ? { absolute: metaTitle } : displayName,
    description: metaDesc || undefined,
    alternates: {
      canonical: `/${locale}/brands/${handle}`,
    },
    openGraph: {
      title: metaTitle || displayName,
      description: metaDesc || undefined,
      url: `/${locale}/brands/${handle}`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(ogImage
      ? { twitter: { card: "summary_large_image" as const, images: [ogImage] } }
      : {}),
  };
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { locale, handle } = await params;
  const filters = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const productCardA11y = productCardA11yFromDict(dict);

  const sort = (filters.sort as string) || "featured";

  const [medusaBrand, payloadBrand] = await loadBrandPageData(handle, locale);
  if (!medusaBrand) notFound();

  const brandName = resolveBrandDisplayTitle(payloadBrand, medusaBrand.name, medusaBrand.handle);
  const introHtml = lexicalToHtml(payloadBrand?.body);

  const { products, count: total } = await fetchProductsByBrand(handle, sort);

  return (
    <div className="min-h-full bg-white">
      <main className="container mx-auto px-4 py-6 lg:py-8">
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{brandName}</li>
          </ol>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold text-primary mb-2">{brandName}</h1>
          <p className="text-sm text-muted-foreground">
            {total} {locale === "da" ? "produkter" : "products"}
          </p>
        </div>

        {categoryPlpFiltersEnabled ? (
          <Suspense fallback={<div className="border-b border-border py-3" />}>
            <FilterSystem
              categories={getFilterCategories(locale)}
              labels={{
                filters: dict.products.filters,
                clearFilters: dict.products.clearFilters,
                activeFilters: dict.products.activeFilters,
              }}
              className="mt-6"
              trailingSlot={
                <Suspense
                  fallback={<div className="h-10 w-40 rounded-lg border border-border bg-surface-muted" />}
                >
                  <PLPSortSelect
                    locale={locale}
                    currentSort={sort}
                    dictSort={dict.products.sort}
                    options={getPlpSortOptions(locale)}
                  />
                </Suspense>
              }
            />
          </Suspense>
        ) : (
          <div className="mt-6">
            <div className="sticky top-0 z-30 border-b border-border bg-white">
              <div className="flex items-center justify-end gap-3 overflow-x-auto py-3 scrollbar-hide">
                <Suspense
                  fallback={<div className="h-10 w-40 rounded-lg border border-border bg-surface-muted" />}
                >
                  <PLPSortSelect
                    locale={locale}
                    currentSort={sort}
                    dictSort={dict.products.sort}
                    options={getPlpSortOptions(locale)}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} locale={locale} labels={productCardA11y} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              {categoryPlpFiltersEnabled
                ? locale === "da"
                  ? "Ingen produkter matcher dine filtre"
                  : "No products match your filters"
                : dict.products.noResults}
            </p>
            {categoryPlpFiltersEnabled ? (
              <Link
                href={`/${locale}/brands/${handle}`}
                className="font-medium text-primary hover:underline"
              >
                {dict.products.clearFilters}
              </Link>
            ) : null}
          </div>
        )}

        {introHtml ? (
          <div
            className="mt-12 border-t border-border pt-8 prose prose-neutral dark:prose-invert max-w-none text-sm [&_a]:text-primary [&_a]:underline [&_p]:mb-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : null}
      </main>
    </div>
  );
}
