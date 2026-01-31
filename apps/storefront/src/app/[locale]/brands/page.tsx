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
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">
          {locale === "da" ? "Mærker" : "Brands"}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === "da"
            ? "Vi har kurateret de bedste hudplejemærker til dig."
            : "We've curated the best skincare brands for you."}
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.handle}
              href={`/${locale}/brands/${brand.handle}`}
              className="flex items-center justify-between rounded-lg border-2 border-border bg-card p-4 transition-colors hover:border-primary hover:bg-surface focus-visible:border-primary focus-visible:outline-none"
            >
              <span className="font-medium text-foreground">{brand.name}</span>
              <span className="text-sm text-muted-foreground">
                {brand.productCount} {locale === "da" ? "produkter" : "products"}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
