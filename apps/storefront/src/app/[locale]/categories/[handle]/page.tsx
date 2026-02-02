import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { FilterSystem, type FilterCategory } from "@/components/FilterSystem";

interface CategoryPageProps {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Placeholder product data
const placeholderProducts = [
  { id: "1", title: "Gentle Cleanser", price: "189", image: null },
  { id: "2", title: "Niacinamide Serum", price: "249", image: null },
  { id: "3", title: "Hydrating Moisturizer", price: "329", image: null },
  { id: "4", title: "Daily SPF 50", price: "279", image: null },
];

const categoryNames: Record<string, { da: string; en: string }> = {
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
  const name = categoryNames[handle]?.[locale as "da" | "en"] || handle;
  
  return {
    title: name,
    // Canonical URL to base category (without filters)
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
  const categoryName = categoryNames[handle]?.[localeKey] || handle;

  // Parse filter params
  const activeFilters = {
    skinType: filters.skinType as string | undefined,
    priceRange: filters.price as string | undefined,
    sort: (filters.sort as string) || "featured",
  };

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/${locale}/categories`} className="hover:text-primary">
                {locale === "da" ? "Kategorier" : "Categories"}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{categoryName}</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{categoryName}</h1>
          <p className="text-sm text-muted-foreground">
            {placeholderProducts.length} {locale === "da" ? "produkter" : "products"}
          </p>
        </div>

        {/* Filter bar + sheet (syncs with URL) */}
        <Suspense fallback={<div className="border-b border-border py-3" />}>
          <FilterSystem
            categories={getFilterCategories(locale)}
            labels={{
              filters: dict.products.filters,
              clearFilters: dict.products.clearFilters,
              activeFilters: dict.products.activeFilters,
            }}
            className="mt-6"
          />
        </Suspense>

        {/* Sort */}
        <div className="mt-4 flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{dict.products.sort}:</span>
            <select
              className="rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              defaultValue={activeFilters.sort}
            >
              <option value="featured">{locale === "da" ? "Anbefalet" : "Featured"}</option>
              <option value="price-asc">{locale === "da" ? "Pris: Lav til høj" : "Price: Low to high"}</option>
              <option value="price-desc">{locale === "da" ? "Pris: Høj til lav" : "Price: High to low"}</option>
              <option value="newest">{locale === "da" ? "Nyeste" : "Newest"}</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {placeholderProducts.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/products/${product.id}`}
              className="group rounded-lg border border-border bg-card overflow-hidden hover:border-primary transition-colors focus-visible:border-primary focus-visible:outline-none"
            >
              <div className="aspect-square w-full bg-surface-muted transition-colors group-hover:bg-surface" />
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
                  {product.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.price} DKK</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
