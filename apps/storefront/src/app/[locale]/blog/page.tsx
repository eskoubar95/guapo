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

// Placeholder articles (will be fetched from CMS in production)
const placeholderArticles = [
  {
    slug: "skincare-routine-basics",
    title: { da: "Grundlæggende hudplejerutine", en: "Skincare Routine Basics" },
    excerpt: {
      da: "Lær de vigtigste trin i en effektiv hudplejerutine.",
      en: "Learn the essential steps of an effective skincare routine.",
    },
    publishedAt: "2026-01-20",
    category: { da: "Guides", en: "Guides" },
  },
  {
    slug: "understanding-skin-types",
    title: { da: "Forstå din hudtype", en: "Understanding Your Skin Type" },
    excerpt: {
      da: "Hvordan identificerer du din hudtype og vælger de rigtige produkter.",
      en: "How to identify your skin type and choose the right products.",
    },
    publishedAt: "2026-01-15",
    category: { da: "Tips", en: "Tips" },
  },
  {
    slug: "ingredient-spotlight-niacinamide",
    title: { da: "Ingrediens i fokus: Niacinamid", en: "Ingredient Spotlight: Niacinamide" },
    excerpt: {
      da: "Alt du behøver at vide om niacinamid og dets fordele.",
      en: "Everything you need to know about niacinamide and its benefits.",
    },
    publishedAt: "2026-01-10",
    category: { da: "Ingredienser", en: "Ingredients" },
  },
];

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        <p className="mt-4 text-lg text-gray-600">
          {locale === "da"
            ? "Udforsk vores artikler om hudpleje, ingredienser og tips til en sundere hud."
            : "Explore our articles about skincare, ingredients, and tips for healthier skin."}
        </p>

        {/* Articles grid */}
        <div className="mt-12 space-y-12">
          {placeholderArticles.map((article) => (
            <article key={article.slug} className="border-b border-gray-100 pb-12">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {article.category[localeKey]}
                </span>
                <span>·</span>
                <time dateTime={article.publishedAt}>
                  {(() => {
                    const [year, month, day] = article.publishedAt.split("-").map(Number);
                    const date = new Date(Date.UTC(year, month - 1, day));
                    return date.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    });
                  })()}
                </time>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                <Link
                  href={`/${locale}/blog/${article.slug}`}
                  className="hover:text-gray-600"
                >
                  {article.title[localeKey]}
                </Link>
              </h2>
              <p className="mt-3 text-gray-600">{article.excerpt[localeKey]}</p>
              <Link
                href={`/${locale}/blog/${article.slug}`}
                className="mt-4 inline-flex text-sm font-medium text-gray-900 hover:text-gray-600"
              >
                {locale === "da" ? "Læs mere →" : "Read more →"}
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
