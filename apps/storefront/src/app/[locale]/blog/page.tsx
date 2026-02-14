import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Blog" : "Blog",
    description: locale === "da"
      ? "Læs vores seneste artikler om hudpleje, ingredienser og tips."
      : "Read our latest articles about skincare, ingredients, and tips.",
  };
}

const placeholderArticles = [
  { slug: "skincare-routine-basics", title: { da: "Grundlæggende hudplejerutine", en: "Skincare Routine Basics" }, excerpt: { da: "Lær de vigtigste trin i en effektiv hudplejerutine.", en: "Learn the essential steps of an effective skincare routine." }, publishedAt: "2026-01-20", category: { da: "Guides", en: "Guides" } },
  { slug: "understanding-skin-types", title: { da: "Forstå din hudtype", en: "Understanding Your Skin Type" }, excerpt: { da: "Hvordan identificerer du din hudtype og vælger de rigtige produkter.", en: "How to identify your skin type and choose the right products." }, publishedAt: "2026-01-15", category: { da: "Tips", en: "Tips" } },
  { slug: "ingredient-spotlight-niacinamide", title: { da: "Ingrediens i fokus: Niacinamid", en: "Ingredient Spotlight: Niacinamide" }, excerpt: { da: "Alt du behøver at vide om niacinamid og dets fordele.", en: "Everything you need to know about niacinamide and its benefits." }, publishedAt: "2026-01-10", category: { da: "Ingredienser", en: "Ingredients" } },
];

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {locale === "da"
            ? "Udforsk vores artikler om hudpleje, ingredienser og tips til en sundere hud."
            : "Explore our articles about skincare, ingredients, and tips for healthier skin."}
        </p>
        <div className="mt-12 space-y-12">
          {placeholderArticles.map((article) => (
            <article key={article.slug} className="border-b border-border pb-12">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-surface-muted px-3 py-1">{article.category[localeKey]}</span>
                <span>·</span>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                <Link href={`/${locale}/blog/${article.slug}`} className="hover:text-primary">
                  {article.title[localeKey]}
                </Link>
              </h2>
              <p className="mt-3 text-muted-foreground">{article.excerpt[localeKey]}</p>
              <Link href={`/${locale}/blog/${article.slug}`} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                {locale === "da" ? "Læs mere →" : "Read more →"}
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
