import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface CategoriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Kategorier" : "Categories",
    description: locale === "da"
      ? "Udforsk vores hudplejekategorier - rensere, serum, fugtighedscremer og solbeskyttelse."
      : "Explore our skincare categories - cleansers, serums, moisturizers, and sun protection.",
  };
}

// Placeholder categories (will come from Medusa)
const categories = [
  {
    handle: "cleansers",
    name: { da: "Rensere", en: "Cleansers" },
    description: {
      da: "Milde rensere til alle hudtyper",
      en: "Gentle cleansers for all skin types",
    },
    productCount: 12,
  },
  {
    handle: "serums",
    name: { da: "Serum", en: "Serums" },
    description: {
      da: "Koncentrerede behandlinger til specifikke hudproblemer",
      en: "Concentrated treatments for specific skin concerns",
    },
    productCount: 18,
  },
  {
    handle: "moisturizers",
    name: { da: "Fugtighedscremer", en: "Moisturizers" },
    description: {
      da: "Hydrering til alle hudtyper",
      en: "Hydration for all skin types",
    },
    productCount: 15,
  },
  {
    handle: "spf",
    name: { da: "Solbeskyttelse", en: "Sun Protection" },
    description: {
      da: "Daglig solbeskyttelse mod UV-stråler",
      en: "Daily sun protection against UV rays",
    },
    productCount: 8,
  },
];

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

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
          {locale === "da" ? "Kategorier" : "Categories"}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {locale === "da"
            ? "Udforsk vores kuraterede udvalg af premium hudplejeprodukter."
            : "Explore our curated selection of premium skincare products."}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.handle}
              href={`/${locale}/categories/${category.handle}`}
              className="group rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="aspect-square w-full rounded-lg bg-gray-100 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-gray-600">
                {category.name[localeKey]}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{category.description[localeKey]}</p>
              <p className="mt-3 text-sm text-gray-500">
                {category.productCount} {locale === "da" ? "produkter" : "products"}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
