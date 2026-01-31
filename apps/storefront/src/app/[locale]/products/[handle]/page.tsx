import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { SubscriptionSelector } from "@/components/SubscriptionSelector";

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

// Placeholder product data (will come from Medusa + Payload)
const products: Record<string, {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants: { id: string; title: string; price: number }[];
  // Payload CMS guidance fields
  guidance: {
    skinTypes: { da: string; en: string }[];
    concerns: { da: string; en: string }[];
    keyIngredients: { name: string; benefit: { da: string; en: string } }[];
    howToUse: { da: string; en: string };
    whenToUse: "AM" | "PM" | "AM/PM";
    pairWith: string[];
  };
}> = {
  "gentle-cleanser": {
    title: "Gentle Cleanser",
    description: "A mild, pH-balanced cleanser suitable for all skin types. Removes impurities without stripping the skin's natural moisture barrier.",
    price: 18900,
    currency: "DKK",
    images: [],
    variants: [
      { id: "v1", title: "150ml", price: 18900 },
      { id: "v2", title: "300ml", price: 29900 },
    ],
    guidance: {
      skinTypes: [
        { da: "Normal", en: "Normal" },
        { da: "Tør", en: "Dry" },
        { da: "Sensitiv", en: "Sensitive" },
      ],
      concerns: [
        { da: "Tørhed", en: "Dryness" },
        { da: "Følsom hud", en: "Sensitivity" },
      ],
      keyIngredients: [
        { name: "Ceramides", benefit: { da: "Styrker hudbarrieren", en: "Strengthens skin barrier" } },
        { name: "Glycerin", benefit: { da: "Hydrerer dybt", en: "Deep hydration" } },
      ],
      howToUse: {
        da: "Påfør på fugtig hud, massér i cirkulære bevægelser, og skyl grundigt af med lunkent vand.",
        en: "Apply to damp skin, massage in circular motions, and rinse thoroughly with lukewarm water.",
      },
      whenToUse: "AM/PM",
      pairWith: ["niacinamide-serum", "hydrating-moisturizer"],
    },
  },
  "niacinamide-serum": {
    title: "Niacinamide Serum 10%",
    description: "A concentrated serum with 10% Niacinamide to minimize pores, reduce redness, and even out skin tone.",
    price: 24900,
    currency: "DKK",
    images: [],
    variants: [
      { id: "v1", title: "30ml", price: 24900 },
    ],
    guidance: {
      skinTypes: [
        { da: "Fedtet", en: "Oily" },
        { da: "Kombineret", en: "Combination" },
        { da: "Normal", en: "Normal" },
      ],
      concerns: [
        { da: "Store porer", en: "Large pores" },
        { da: "Rødme", en: "Redness" },
        { da: "Ujævn hudtone", en: "Uneven skin tone" },
      ],
      keyIngredients: [
        { name: "Niacinamide 10%", benefit: { da: "Minimerer porer, reducerer rødme", en: "Minimizes pores, reduces redness" } },
        { name: "Zinc", benefit: { da: "Regulerer talg", en: "Regulates sebum" } },
      ],
      howToUse: {
        da: "Påfør 2-3 dråber på renset hud før fugtighedscreme. Undgå at kombinere med ren C-vitamin.",
        en: "Apply 2-3 drops to cleansed skin before moisturizer. Avoid combining with pure Vitamin C.",
      },
      whenToUse: "AM/PM",
      pairWith: ["gentle-cleanser", "hydrating-moisturizer"],
    },
  },
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const product = products[handle];
  
  if (!product) {
    return { title: "Product Not Found" };
  }
  
  return {
    title: product.title,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle } = await params;
  const dict = await getDictionary(locale as Locale);
  const localeKey = locale as "da" | "en";
  
  const product = products[handle];
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{locale === "da" ? "Produkt ikke fundet" : "Product not found"}</p>
      </div>
    );
  }

  const { guidance } = product;

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}`} className="hover:text-primary">
                {dict.common.brand}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{product.title}</li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Product images */}
          <div>
            <div className="aspect-square w-full rounded-lg bg-gray-100" />
            {/* Thumbnail gallery placeholder */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-8 lg:mt-0">
            <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
            <p className="mt-4 text-muted-foreground">{product.description}</p>

            {/* Variant selector */}
            {product.variants.length > 1 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Størrelse" : "Size"}
                </p>
                <div className="flex gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:border-gray-900"
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase options (one-time vs subscription) */}
            <div className="mt-8">
              <SubscriptionSelector
                basePrice={product.price}
                currency={product.currency}
                locale={locale}
                onSelect={(type, cycle) => {
                  console.log("Selected:", type, cycle);
                }}
              />
            </div>

            {/* Add to cart button */}
            <button className="mt-6 w-full rounded-full bg-gray-900 px-8 py-4 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
              {dict.products.addToCart}
            </button>

            {/* Product guidance (from Payload CMS) */}
            <div className="mt-12 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                {locale === "da" ? "Produktguide" : "Product Guide"}
              </h2>

              {/* Skin types */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Hudtyper" : "Skin Types"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guidance.skinTypes.map((type, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {type[localeKey]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Målretter" : "Targets"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {guidance.concerns.map((concern, i) => (
                    <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {concern[localeKey]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key ingredients */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Nøgleingredienser" : "Key Ingredients"}
                </h3>
                <ul className="space-y-2">
                  {guidance.keyIngredients.map((ingredient, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-foreground">{ingredient.name}</span>
                      <span className="text-muted-foreground"> — {ingredient.benefit[localeKey]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to use */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Sådan bruger du det" : "How to Use"}
                </h3>
                <p className="text-sm text-muted-foreground">{guidance.howToUse[localeKey]}</p>
              </div>

              {/* When to use */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {locale === "da" ? "Hvornår" : "When"}
                </h3>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {guidance.whenToUse}
                </span>
              </div>

              {/* Pair with */}
              {guidance.pairWith.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {locale === "da" ? "Kombiner med" : "Pair With"}
                  </h3>
                  <div className="flex gap-4">
                    {guidance.pairWith.slice(0, 2).map((productHandle) => (
                      <Link
                        key={productHandle}
                        href={`/${locale}/products/${productHandle}`}
                        className="group flex items-center gap-2"
                      >
                        <div className="h-12 w-12 rounded-lg bg-gray-100" />
                        <span className="text-sm text-muted-foreground group-hover:text-primary">
                          {products[productHandle]?.title || productHandle}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
