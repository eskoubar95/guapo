import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

interface ConcernsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ConcernsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Shop efter hudproblem" : "Shop by Concern",
    description: locale === "da"
      ? "Find produkter målrettet dit specifikke hudproblem - acne, tørhed, rødme og mere."
      : "Find products targeted to your specific skin concern - acne, dryness, redness, and more.",
  };
}

const concerns = [
  { handle: "acne", name: { da: "Acne", en: "Acne" }, description: { da: "Produkter til uren hud og bumser", en: "Products for blemish-prone skin" } },
  { handle: "dryness", name: { da: "Tørhed", en: "Dryness" }, description: { da: "Intensiv hydrering til tør hud", en: "Intense hydration for dry skin" } },
  { handle: "sensitivity", name: { da: "Følsom hud", en: "Sensitivity" }, description: { da: "Milde formler til sensitiv hud", en: "Gentle formulas for sensitive skin" } },
  { handle: "redness", name: { da: "Rødme", en: "Redness" }, description: { da: "Beroligende produkter mod rødme", en: "Soothing products for redness" } },
  { handle: "hyperpigmentation", name: { da: "Pigmentforandringer", en: "Hyperpigmentation" }, description: { da: "Lysne mørke pletter og ujævn hudtone", en: "Brighten dark spots and uneven skin tone" } },
  { handle: "dullness", name: { da: "Mat hud", en: "Dullness" }, description: { da: "Giv huden glød og udstråling", en: "Restore glow and radiance" } },
];

export default async function ConcernsPage({ params }: ConcernsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">
          {locale === "da" ? "Shop efter hudproblem" : "Shop by Concern"}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === "da"
            ? "Find de produkter, der passer bedst til dit specifikke hudproblem."
            : "Find the products that best suit your specific skin concern."}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {concerns.map((concern) => (
            <Link key={concern.handle} href={`/${locale}/concerns/${concern.handle}`}>
              <Card className="h-full border-border bg-card transition-colors hover:border-primary hover:bg-surface">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    {concern.name[localeKey]}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{concern.description[localeKey]}</p>
                  <span className="mt-4 inline-flex text-sm font-medium text-primary">
                    {locale === "da" ? "Se produkter →" : "View products →"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
