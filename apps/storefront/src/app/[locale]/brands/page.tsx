import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface BrandsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BrandsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mærker" : "Brands",
    description: locale === "da"
      ? "Udforsk vores kuraterede udvalg af premium hudplejemærker."
      : "Explore our curated selection of premium skincare brands.",
  };
}

// Placeholder brands (will come from Medusa/CMS)
const brands = [
  { handle: "the-ordinary", name: "The Ordinary", productCount: 24 },
  { handle: "cerave", name: "CeraVe", productCount: 18 },
  { handle: "paula-choice", name: "Paula's Choice", productCount: 15 },
  { handle: "la-roche-posay", name: "La Roche-Posay", productCount: 22 },
  { handle: "cosrx", name: "COSRX", productCount: 16 },
  { handle: "drunk-elephant", name: "Drunk Elephant", productCount: 12 },
];

export default async function BrandsPage({ params }: BrandsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

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

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {locale === "da" ? "Mærker" : "Brands"}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {locale === "da"
            ? "Vi har kurateret de bedste hudplejemærker til dig."
            : "We've curated the best skincare brands for you."}
        </p>

        {/* Alphabetical brand list */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.handle}
              href={`/${locale}/brands/${brand.handle}`}
              className="group flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200 hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900 group-hover:text-gray-600">
                {brand.name}
              </span>
              <span className="text-sm text-gray-500">
                {brand.productCount} {locale === "da" ? "produkter" : "products"}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
