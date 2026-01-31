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

        {/* Filters and Sort */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border-2 border-border bg-background px-4 py-2 text-sm hover:bg-surface focus-visible:border-primary focus-visible:outline-none"
            >
              {dict.products.filters}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeFilters.skinType && (
              <span className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-sm text-foreground">
                {activeFilters.skinType}
                <button type="button" className="ml-1 text-muted-foreground hover:text-primary">×</button>
              </span>
            )}
          </div>
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
