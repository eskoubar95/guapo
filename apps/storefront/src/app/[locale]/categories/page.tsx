import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { fetchTopLevelCategories } from "@/lib/medusa-categories";

interface CategoriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Kategorier" : "Categories",
    description:
      locale === "da"
        ? "Udforsk vores hudplejekategorier - skincare og underkategorier."
        : "Explore our skincare categories and subcategories.",
  };
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const topCategories = await fetchTopLevelCategories();

  // If only one top-level category (e.g. "skincare"), redirect directly to it
  if (topCategories.length === 1) {
    redirect(`/${locale}/categories/${topCategories[0].handle}`);
  }

  // No categories from Medusa — use static fallback (Medusa may be offline)
  if (topCategories.length === 0) {
    const fallbackCategories = [
      { handle: "skincare", name: "Skincare", description: "" },
      { handle: "cleansers", name: "Rensere", description: "" },
      { handle: "serums", name: "Serum", description: "" },
      { handle: "moisturizers", name: "Fugtighedscremer", description: "" },
      { handle: "spf", name: "Solbeskyttelse", description: "" },
    ];
    return (
      <div className="min-h-full bg-white">
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
            {fallbackCategories.map((cat) => (
              <Link key={cat.handle} href={`/${locale}/categories/${cat.handle}`}>
                <Card className="h-full overflow-hidden border-border bg-white transition-colors hover:border-primary hover:bg-slate-50">
                  <div className="aspect-square w-full bg-surface-muted" />
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-foreground">{cat.name}</h2>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
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
          {topCategories.map((category) => (
            <Link key={category.id} href={`/${locale}/categories/${category.handle}`}>
              <Card className="h-full overflow-hidden border-border bg-white transition-colors hover:border-primary hover:bg-slate-50">
                <div className="aspect-square w-full bg-surface-muted" />
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {category.name || category.handle}
                  </h2>
                  {category.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  {category.category_children && category.category_children.length > 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {category.category_children.length}{" "}
                      {locale === "da" ? "underkategorier" : "subcategories"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
