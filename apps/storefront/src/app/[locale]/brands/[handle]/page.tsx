import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchMedusaBrandByHandle } from "@/lib/medusa-brands";
import { fetchProductsByBrand } from "@/lib/medusa-products";
import { ProductCard } from "@/components/ProductCard";

interface BrandPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const brand = await fetchMedusaBrandByHandle(handle);
  const brandName = brand?.name ?? handle;

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
  const brand = await fetchMedusaBrandByHandle(handle);
  const brandName = brand?.name ?? handle;
  const { products, count } = await fetchProductsByBrand(handle);

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
          {count} {locale === "da" ? "produkter" : "products"}
        </p>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </main>
    </div>
  );
}
