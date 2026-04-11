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
  fetchCategoryByHandle,
  fetchPayloadCategoryByHandle,
  type PayloadCategoryEnrichment,
} from "@/lib/medusa-categories";
import { fetchProductsByCategory } from "@/lib/medusa-products";
import { lexicalToHtml } from "@/lib/lexical-to-html";
import { resolvePayloadMediaUrl } from "@/lib/payload-media-url";
import { categoryPlpFiltersEnabled } from "@/lib/feature-flags";
import { PLPSortSelect } from "./PLPSortSelect";

interface CategoryPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** One fetch per request for metadata + page (Medusa is source of truth for valid handles). */
const loadCategoryPageData = cache(async (handle: string, locale: string) =>
  Promise.all([fetchCategoryByHandle(handle), fetchPayloadCategoryByHandle(handle, locale)] as const)
);

/** Hardcoded facet data for FilterSystem; kept when PLP filters are disabled via env (see feature-flags). */
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
        { value: "300+ kr", count: 267 },
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

/** Avoid duplicate "| Guapo" when editors paste full SEO title from SERP preview. */
function stripTrailingBrandSuffix(title: string): string {
  return title.replace(/\s*\|\s*Guapo\s*$/i, "").trim();
}

function CategorySeoBelowProducts({
  payloadCat,
  locale,
}: {
  payloadCat: PayloadCategoryEnrichment | null;
  locale: string;
}) {
  const meta = payloadCat?.meta;
  const rawTitle = meta?.title?.trim();
  const rawDesc = meta?.description?.trim();
  if (!rawTitle && !rawDesc) return null;

  const heading = rawTitle ? stripTrailingBrandSuffix(rawTitle) : null;
  const sectionLabel =
    locale === "da" ? "Kategoribeskrivelse" : "Category description";

  return (
    <section
      className="mt-12 border-t border-border pt-8"
      aria-labelledby={heading ? "category-plp-seo-heading" : undefined}
      aria-label={heading ? undefined : sectionLabel}
    >
      {heading ? (
        <h2 id="category-plp-seo-heading" className="text-lg font-semibold text-foreground mb-3">
          {heading}
        </h2>
      ) : null}
      {rawDesc ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{rawDesc}</p>
      ) : null}
    </section>
  );
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const [medusaCat, payloadCat] = await loadCategoryPageData(handle, locale);
  if (!medusaCat) notFound();

  const displayName = payloadCat?.name ?? medusaCat.name ?? medusaCat.handle;
  const metaTitle = payloadCat?.meta?.title?.trim();
  const metaDesc = payloadCat?.meta?.description?.trim();
  const ogImage = resolvePayloadMediaUrl(
    payloadCat?.meta?.image as Parameters<typeof resolvePayloadMediaUrl>[0],
  );

  return {
    // Use absolute when SEO title is set so root layout template "%s | Guapo" does not double the suffix.
    title: metaTitle ? { absolute: metaTitle } : displayName,
    description: metaDesc || undefined,
    alternates: {
      canonical: `/${locale}/categories/${handle}`,
    },
    openGraph: {
      title: metaTitle || displayName,
      description: metaDesc || undefined,
      url: `/${locale}/categories/${handle}`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    ...(ogImage
      ? { twitter: { card: "summary_large_image" as const, images: [ogImage] } }
      : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, handle } = await params;
  const filters = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const productCardA11y = productCardA11yFromDict(dict);

  const sort = (filters.sort as string) || "featured";

  const [medusaCat, payloadCat] = await loadCategoryPageData(handle, locale);
  if (!medusaCat) notFound();

  const categoryName = payloadCat?.name ?? medusaCat.name ?? medusaCat.handle;
  const introHtml = lexicalToHtml(payloadCat?.body);

  const { products, count: total } = await fetchProductsByCategory(medusaCat.id, sort);

  const subcategories = medusaCat.category_children ?? [];

  return (
    <div className="min-h-full bg-white">
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Breadcrumbs: Guapo / Skincare (uden "Kategorier" da vi kun har én topkategori) */}
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{categoryName}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold text-primary mb-2">
            {categoryName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} {locale === "da" ? "produkter" : "products"}
          </p>
        </div>

        {introHtml ? (
          <div
            className="mb-8 prose prose-neutral dark:prose-invert max-w-none text-sm [&_a]:text-primary [&_a]:underline [&_p]:mb-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : null}

        {/* Subcategories (when category has children from Medusa) */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              {locale === "da" ? "Underkategorier" : "Subcategories"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/${locale}/categories/${sub.handle}`}
                  className="rounded-full bg-surface-muted px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {sub.name ?? sub.handle}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar + sort, eller kun sort når NEXT_PUBLIC_ENABLE_CATEGORY_PLP_FILTERS ikke er true */}
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

        {/* Product Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} locale={locale} labels={productCardA11y} />
          ))}
        </div>

        <CategorySeoBelowProducts payloadCat={payloadCat} locale={locale} />

        {/* Empty state */}
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
                href={`/${locale}/categories/${handle}`}
                className="font-medium text-primary hover:underline"
              >
                {dict.products.clearFilters}
              </Link>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
