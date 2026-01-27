import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Placeholder articles (will be fetched from CMS in production)
const articles: Record<string, {
  title: { da: string; en: string };
  content: { da: string; en: string };
  publishedAt: string;
  category: { da: string; en: string };
}> = {
  "skincare-routine-basics": {
    title: { da: "Grundlæggende hudplejerutine", en: "Skincare Routine Basics" },
    content: {
      da: `En god hudplejerutine behøver ikke at være kompliceret. Her er de grundlæggende trin:

## 1. Rens
Start med at rense din hud for at fjerne makeup, snavs og overskydende olie. Brug en mild rensegel eller -mælk, der passer til din hudtype.

## 2. Serum
Serum er koncentrerede produkter, der målretter specifikke hudproblemer. Vælg et serum baseret på dine behov - f.eks. C-vitamin til lysstyrke eller niacinamid til porer.

## 3. Fugtighedscreme
Fugt din hud med en creme, der passer til din hudtype. Selv fedtet hud har brug for fugt!

## 4. Solbeskyttelse (om morgenen)
SPF er afgørende for at beskytte din hud mod UV-skader og for tidlig ældning. Brug mindst SPF 30 hver dag.`,
      en: `A good skincare routine doesn't have to be complicated. Here are the basic steps:

## 1. Cleanse
Start by cleansing your skin to remove makeup, dirt, and excess oil. Use a gentle cleanser that suits your skin type.

## 2. Serum
Serums are concentrated products that target specific skin concerns. Choose a serum based on your needs - e.g., vitamin C for brightness or niacinamide for pores.

## 3. Moisturize
Hydrate your skin with a cream that suits your skin type. Even oily skin needs moisture!

## 4. Sun Protection (morning)
SPF is crucial for protecting your skin from UV damage and premature aging. Use at least SPF 30 every day.`,
    },
    publishedAt: "2026-01-20",
    category: { da: "Guides", en: "Guides" },
  },
  "understanding-skin-types": {
    title: { da: "Forstå din hudtype", en: "Understanding Your Skin Type" },
    content: {
      da: `At kende din hudtype er det første skridt mod en effektiv hudplejerutine.

## De fem hovedhudtyper

### Normal hud
Balanceret fugt, få urenheder, og ikke for følsom.

### Tør hud
Mangler fugt, kan føles stram og kan have flager.

### Fedtet hud
Producerer for meget talg, har tendens til store porer og akne.

### Kombinationshud
Fedtet T-zone (pande, næse, hage) men tør eller normal andre steder.

### Sensitiv hud
Reagerer let på produkter, kan blive rød eller irriteret.`,
      en: `Knowing your skin type is the first step toward an effective skincare routine.

## The Five Main Skin Types

### Normal Skin
Balanced moisture, few blemishes, and not too sensitive.

### Dry Skin
Lacks moisture, can feel tight and may have flaky patches.

### Oily Skin
Produces excess sebum, tends to have large pores and acne.

### Combination Skin
Oily T-zone (forehead, nose, chin) but dry or normal elsewhere.

### Sensitive Skin
Reacts easily to products, may become red or irritated.`,
    },
    publishedAt: "2026-01-15",
    category: { da: "Tips", en: "Tips" },
  },
  "ingredient-spotlight-niacinamide": {
    title: { da: "Ingrediens i fokus: Niacinamid", en: "Ingredient Spotlight: Niacinamide" },
    content: {
      da: `Niacinamid (B3-vitamin) er en af de mest alsidige hudplejeingredienserper.

## Fordele ved niacinamid

- **Minimerer porer**: Regulerer talgproduktion
- **Reducerer rødme**: Beroligende egenskaber
- **Lysner**: Udligner hudtonen
- **Styrker hudbarrieren**: Forbedrer hudens naturlige forsvar
- **Anti-aging**: Reducerer fine linjer

## Hvordan bruger man det?

Niacinamid kan bruges morgen og aften. Det fungerer godt med de fleste andre ingredienser.`,
      en: `Niacinamide (Vitamin B3) is one of the most versatile skincare ingredients.

## Benefits of Niacinamide

- **Minimizes pores**: Regulates sebum production
- **Reduces redness**: Soothing properties
- **Brightens**: Evens out skin tone
- **Strengthens skin barrier**: Improves skin's natural defenses
- **Anti-aging**: Reduces fine lines

## How to use it?

Niacinamide can be used morning and evening. It works well with most other ingredients.`,
    },
    publishedAt: "2026-01-10",
    category: { da: "Ingredienser", en: "Ingredients" },
  },
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = articles[slug];
  
  if (!article) {
    return { title: "Article Not Found" };
  }
  
  return {
    title: article.title[locale as "da" | "en"],
  };
}

export function generateStaticParams() {
  const slugs = Object.keys(articles);
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of ["da", "en"]) {
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  
  return params;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";
  
  const article = articles[slug];
  if (!article) {
    notFound();
  }

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

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href={`/${locale}`} className="hover:text-gray-900">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/${locale}/blog`} className="hover:text-gray-900">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{article.title[localeKey]}</li>
          </ol>
        </nav>

        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="rounded-full bg-gray-100 px-3 py-1">
              {article.category[localeKey]}
            </span>
            <span>·</span>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">
            {article.title[localeKey]}
          </h1>
        </div>

        {/* Article content */}
        <article className="prose prose-gray max-w-none">
          {article.content[localeKey].split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={i} className="mt-8 text-2xl font-bold text-gray-900">
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={i} className="mt-6 text-xl font-semibold text-gray-900">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("- ")) {
              return (
                <ul key={i} className="mt-4 list-disc pl-6 space-y-2 text-gray-600">
                  {paragraph.split("\n").map((item, j) => (
                    <li key={j}>{item.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "$1")}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="mt-4 text-gray-600">
                {paragraph}
              </p>
            );
          })}
        </article>

        {/* Back to blog */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <Link
            href={`/${locale}/blog`}
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            ← {locale === "da" ? "Tilbage til blog" : "Back to blog"}
          </Link>
        </div>
      </main>
    </div>
  );
}
