import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href={`/${locale}`} className="hover:text-gray-900">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/${locale}/categories`} className="hover:text-gray-900">
                {locale === "da" ? "Kategorier" : "Categories"}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{categoryName}</li>
          </ol>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
          <p className="text-sm text-gray-500">
            {placeholderProducts.length} {locale === "da" ? "produkter" : "products"}
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              {dict.products.filters}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Active filters */}
            {activeFilters.skinType && (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
                {activeFilters.skinType}
                <button className="ml-1 text-gray-500 hover:text-gray-900">×</button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{dict.products.sort}:</span>
            <select 
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
              className="group"
            >
              <div className="aspect-square w-full rounded-lg bg-gray-100 transition-colors group-hover:bg-gray-200" />
              <div className="mt-3">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600">
                  {product.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{product.price} DKK</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {placeholderProducts.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500">{dict.products.noResults}</p>
          </div>
        )}
      </main>
    </div>
  );
}
