import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

const brandNames: Record<string, string> = {
  "the-ordinary": "The Ordinary",
  "cerave": "CeraVe",
  "paula-choice": "Paula's Choice",
  "la-roche-posay": "La Roche-Posay",
  "cosrx": "COSRX",
  "drunk-elephant": "Drunk Elephant",
};

const placeholderProducts = [
  { id: "1", title: "Gentle Cleanser", price: "189" },
  { id: "2", title: "Niacinamide Serum", price: "249" },
  { id: "3", title: "Hydrating Moisturizer", price: "329" },
  { id: "4", title: "Daily SPF 50", price: "279" },
];

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const brandName = brandNames[handle] || handle;
  
  return {
    title: brandName,
    alternates: {
      canonical: `/${locale}/brands/${handle}`,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, handle } = await params;
  const dict = await getDictionary(locale as Locale);
  const brandName = brandNames[handle] || handle;

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/${locale}/brands`} className="hover:text-primary">
                {locale === "da" ? "Mærker" : "Brands"}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{brandName}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-foreground">{brandName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
                <h3 className="text-sm font-medium text-foreground group-hover:text-muted-foreground">
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
