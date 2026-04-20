import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { getStorefrontSiteUrl } from "@/lib/site-url";
import { buildLocaleAlternates } from "@/lib/seo-locale-alternates";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { fetchPayloadConcernByValue } from "@/lib/payload-concern";

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
  const localeKey = locale === "en" ? "en" : "da";
  const cmsConcern = await fetchPayloadConcernByValue(handle, locale);
  const fallbackLabel = concernNames[handle]?.[localeKey] ?? handle;
  const label = cmsConcern?.label?.trim() || fallbackLabel;
  const metaTitle = cmsConcern?.meta?.title?.trim();
  const metaDescription = cmsConcern?.meta?.description?.trim();
  const title =
    metaTitle ||
    `${localeKey === "da" ? "Produkter til" : "Products for"} ${label}`;
  const pathSuffix = `/concerns/${encodeURIComponent(handle)}`;
  const siteUrl = getStorefrontSiteUrl();

  return {
    title,
    description: metaDescription || undefined,
    alternates: await buildLocaleAlternates(locale, pathSuffix),
    openGraph: {
      type: "website",
      siteName: "Guapo",
      title,
      url: `${siteUrl}/${locale}${pathSuffix}`,
      locale,
    },
  };
}

export default async function ConcernPage({ params }: ConcernPageProps) {
  const { locale, handle } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale === "en" ? "en" : "da";
  const cmsConcern = await fetchPayloadConcernByValue(handle, locale);
  const fallbackLabel = concernNames[handle]?.[localeKey] ?? handle;
  const concernName = cmsConcern?.label?.trim() || fallbackLabel;
  const siteUrl = getStorefrontSiteUrl();
  const concernUrl = `${siteUrl}/${locale}/concerns/${encodeURIComponent(handle)}`;

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        <BreadcrumbJsonLd
          items={[
            { name: dict.common.breadcrumbRoot, url: `${siteUrl}/${locale}` },
            { name: concernName, url: concernUrl },
          ]}
        />
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
              <Link href={`/${locale}/concerns`} className="hover:text-primary">
                {locale === "da" ? "Hudproblemer" : "Concerns"}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{concernName}</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-foreground">
          {locale === "da" ? `Produkter til ${concernName.toLowerCase()}` : `Products for ${concernName}`}
        </h1>
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
