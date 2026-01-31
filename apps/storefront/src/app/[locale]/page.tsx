import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-full">
      {/* Hero section — token-driven */}
      <section className="relative bg-surface">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {dict.home.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              {dict.home.hero.subtitle}
            </p>
            <div className="mt-10">
              <Link
                href={`/${locale}/categories`}
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 h-12 px-8 text-base font-medium border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
              >
                {dict.home.hero.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products — Card + tokens */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground">
            {dict.home.featured.title}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-surface-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 w-3/4 rounded bg-surface-muted animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-surface-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground">
            {dict.home.newArrivals.title}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-surface-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 w-3/4 rounded bg-surface-muted animate-pulse" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-surface-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
