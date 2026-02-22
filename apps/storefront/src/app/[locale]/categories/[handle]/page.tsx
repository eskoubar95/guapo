import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FilterSystem, type FilterCategory } from "@/components/FilterSystem";
import { ProductCard } from "@/components/ProductCard";
import {
  fetchCategoryByHandle,
  fetchPayloadCategoryByHandle,
} from "@/lib/medusa-categories";
import { fetchProductsByCategory } from "@/lib/medusa-products";
import { getProductsForCategory } from "@/lib/plp-products";
import { PLPSortSelect } from "./PLPSortSelect";

interface CategoryPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const fallbackCategoryNames: Record<string, { da: string; en: string }> = {
  skincare: { da: "Skincare", en: "Skincare" },
  cleansers: { da: "Rensere", en: "Cleansers" },
  serums: { da: "Serum", en: "Serums" },
  moisturizers: { da: "Fugtighedscremer", en: "Moisturizers" },
  spf: { da: "Solbeskyttelse", en: "Sun Protection" },
};

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

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const [medusaCat, payloadCat] = await Promise.all([
    fetchCategoryByHandle(handle),
    fetchPayloadCategoryByHandle(handle, locale),
  ]);
  const name =
    payloadCat?.name ?? medusaCat?.name ?? fallbackCategoryNames[handle]?.[locale as "da" | "en"] ?? handle;

  return {
    title: name,
    alternates: {
      canonical: `/${locale}/categories/${handle}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, handle } = await params;
  const filters = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  const sort = (filters.sort as string) || "featured";

  // Fetch from Medusa + Payload
  const [medusaCat, payloadCat] = await Promise.all([
    fetchCategoryByHandle(handle),
    fetchPayloadCategoryByHandle(handle, locale),
  ]);

  const categoryName =
    payloadCat?.name ?? medusaCat?.name ?? fallbackCategoryNames[handle]?.[localeKey] ?? handle;

  let products: Awaited<ReturnType<typeof getProductsForCategory>>["products"];
  let total: number;

  if (medusaCat?.id) {
    const res = await fetchProductsByCategory(medusaCat.id, sort);
    products = res.products;
    total = res.count;
  } else {
    const res = getProductsForCategory(handle, undefined, sort);
    products = res.products;
    total = res.total;
  }

  const subcategories = medusaCat?.category_children ?? [];

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

        {/* Filter bar + sort (samme række), uden redundans "Viser X produkter" */}
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
              <Suspense fallback={<div className="h-10 w-40 rounded-lg border border-border bg-surface-muted" />}>
                <PLPSortSelect
                  locale={locale}
                  currentSort={sort}
                  dictSort={dict.products.sort}
                  options={[
                    { value: "featured", label: locale === "da" ? "Anbefalet" : "Featured" },
                    {
                      value: "price-asc",
                      label: locale === "da" ? "Pris: Lav til høj" : "Price: Low to high",
                    },
                    {
                      value: "price-desc",
                      label: locale === "da" ? "Pris: Høj til lav" : "Price: High to low",
                    },
                    { value: "newest", label: locale === "da" ? "Nyeste" : "Newest" },
                  ]}
                />
              </Suspense>
            }
          />
        </Suspense>

        {/* Product Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              {locale === "da"
                ? "Ingen produkter matcher dine filtre"
                : "No products match your filters"}
            </p>
            <Link
              href={`/${locale}/categories/${handle}`}
              className="font-medium text-primary hover:underline"
            >
              {dict.products.clearFilters}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
