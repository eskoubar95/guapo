import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { SubscriptionSelector } from "@/components/SubscriptionSelector";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPageTabs } from "@/components/ProductPageTabs";
import { KeyInformationCard } from "@/components/KeyInformationCard";
import { PDPTrustStrip } from "@/components/PDPTrustStrip";

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
            <ProductGallery images={product.images} alt={product.title} />
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

            {/* Key info: ingredients, skin type, benefits */}
            <KeyInformationCard
              className="mt-6"
              ingredients={guidance.keyIngredients.map((ing) => ({
                name: ing.name,
                description: ing.benefit[localeKey],
              }))}
              skinType={guidance.skinTypes.map((t) => t[localeKey]).join(", ")}
              benefits={guidance.concerns.map((c) => c[localeKey]).join(", ")}
              ingredientsLabel={dict.products.keyIngredients}
              skinTypeLabel={dict.products.skinTypes}
              benefitsLabel={dict.products.targets}
            />

            {/* Add to cart button */}
            <button className="mt-6 w-full rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              {dict.products.addToCart}
            </button>

            {/* Trust strip: delivery, returns, secure payment */}
            <PDPTrustStrip labels={dict.products.trustStrip} />

            {/* Product tabs: Description / Ingredients / Reviews */}
            <ProductPageTabs
              locale={locale}
              labels={{
                description: dict.products.tabs.description,
                ingredients: dict.products.tabs.ingredients,
                reviews: dict.products.tabs.reviews,
              }}
              description={product.description}
              skinTypes={guidance.skinTypes}
              concerns={guidance.concerns}
              keyIngredients={guidance.keyIngredients}
              howToUse={guidance.howToUse}
              whenToUse={guidance.whenToUse}
              pairWith={guidance.pairWith.slice(0, 2).map((handle) => ({
                handle,
                title: products[handle]?.title ?? handle,
              }))}
              whenLabel={dict.products.when}
              howToUseLabel={dict.products.howToUse}
              keyIngredientsLabel={dict.products.keyIngredients}
              skinTypesLabel={dict.products.skinTypes}
              targetsLabel={dict.products.targets}
              pairWithLabel={dict.products.pairWith}
              noReviewsLabel={dict.products.noReviews}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
