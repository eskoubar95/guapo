import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

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

const categories = [
  { handle: "cleansers", name: { da: "Rensere", en: "Cleansers" }, description: { da: "Milde rensere til alle hudtyper", en: "Gentle cleansers for all skin types" }, productCount: 12 },
  { handle: "serums", name: { da: "Serum", en: "Serums" }, description: { da: "Koncentrerede behandlinger til specifikke hudproblemer", en: "Concentrated treatments for specific skin concerns" }, productCount: 18 },
  { handle: "moisturizers", name: { da: "Fugtighedscremer", en: "Moisturizers" }, description: { da: "Hydrering til alle hudtyper", en: "Hydration for all skin types" }, productCount: 15 },
  { handle: "spf", name: { da: "Solbeskyttelse", en: "Sun Protection" }, description: { da: "Daglig solbeskyttelse mod UV-stråler", en: "Daily sun protection against UV rays" }, productCount: 8 },
];

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">
          {locale === "da" ? "Kategorier" : "Categories"}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === "da"
            ? "Udforsk vores kuraterede udvalg af premium hudplejeprodukter."
            : "Explore our curated selection of premium skincare products."}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.handle} href={`/${locale}/categories/${category.handle}`}>
              <Card className="h-full overflow-hidden border-border bg-card transition-colors hover:border-primary hover:bg-surface">
                <div className="aspect-square w-full bg-surface-muted" />
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {category.name[localeKey]}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description[localeKey]}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {category.productCount} {locale === "da" ? "produkter" : "products"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
