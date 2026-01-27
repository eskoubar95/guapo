import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  
  return {
    title: q 
      ? `${locale === "da" ? "Søgeresultater for" : "Search results for"} "${q}"`
      : (locale === "da" ? "Søg" : "Search"),
    robots: {
      index: false, // Don't index search result pages
    },
  };
}

// Placeholder search results
function searchProducts(query: string) {
  // In production, this would call Medusa API
  const allProducts = [
    { id: "1", title: "Gentle Cleanser", price: "189", category: "cleansers" },
    { id: "2", title: "Niacinamide Serum", price: "249", category: "serums" },
    { id: "3", title: "Hydrating Moisturizer", price: "329", category: "moisturizers" },
    { id: "4", title: "Daily SPF 50", price: "279", category: "spf" },
  ];

  if (!query) return allProducts;
  
  return allProducts.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase())
  );
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q: query, category } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  
  const results = searchProducts(query || "");
  const filteredResults = category 
    ? results.filter(p => p.category === category)
    : results;

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
        {/* Search form */}
        <form action={`/${locale}/search`} method="GET" className="mb-8">
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={locale === "da" ? "Søg efter produkter..." : "Search for products..."}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 pl-12 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        {/* Results header */}
        {query && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {locale === "da" ? "Søgeresultater for" : "Search results for"} "{query}"
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredResults.length} {locale === "da" ? "produkter fundet" : "products found"}
            </p>
          </div>
        )}

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className={`rounded-full px-4 py-2 text-sm ${
              !category ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {locale === "da" ? "Alle" : "All"}
          </Link>
          {["cleansers", "serums", "moisturizers", "spf"].map((cat) => (
            <Link
              key={cat}
              href={`/${locale}/search?${query ? `q=${encodeURIComponent(query)}&` : ""}category=${cat}`}
              className={`rounded-full px-4 py-2 text-sm capitalize ${
                category === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Results grid */}
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredResults.map((product) => (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{dict.products.noResults}</p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex text-sm font-medium text-gray-900 hover:text-gray-600"
            >
              {locale === "da" ? "Se alle kategorier →" : "Browse all categories →"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
