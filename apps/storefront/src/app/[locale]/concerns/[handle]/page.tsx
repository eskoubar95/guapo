import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface ConcernPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

const concernNames: Record<string, { da: string; en: string }> = {
  acne: { da: "Acne", en: "Acne" },
  dryness: { da: "Tørhed", en: "Dryness" },
  sensitivity: { da: "Følsom hud", en: "Sensitivity" },
  redness: { da: "Rødme", en: "Redness" },
  hyperpigmentation: { da: "Pigmentforandringer", en: "Hyperpigmentation" },
  dullness: { da: "Mat hud", en: "Dullness" },
};

const placeholderProducts = [
  { id: "1", title: "Gentle Cleanser", price: "189" },
  { id: "2", title: "Niacinamide Serum", price: "249" },
  { id: "3", title: "Hydrating Moisturizer", price: "329" },
];

export async function generateMetadata({ params }: ConcernPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const name = concernNames[handle]?.[locale as "da" | "en"] || handle;
  
  return {
    title: `${locale === "da" ? "Produkter til" : "Products for"} ${name}`,
    alternates: {
      canonical: `/${locale}/concerns/${handle}`,
    },
  };
}

export default async function ConcernPage({ params }: ConcernPageProps) {
  const { locale, handle } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";
  const concernName = concernNames[handle]?.[localeKey] || handle;

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
              <Link href={`/${locale}/concerns`} className="hover:text-gray-900">
                {locale === "da" ? "Hudproblemer" : "Concerns"}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{concernName}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">
          {locale === "da" ? `Produkter til ${concernName.toLowerCase()}` : `Products for ${concernName}`}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {placeholderProducts.length} {locale === "da" ? "produkter" : "products"}
        </p>

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
      </main>
    </div>
  );
}
