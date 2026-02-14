"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProductPageTabsProps {
  locale: string;
  labels: {
    description: string;
    ingredients: string;
    reviews: string;
  };
  description: string;
  skinTypes: { da: string; en: string }[];
  concerns: { da: string; en: string }[];
  keyIngredients: { name: string; benefit: { da: string; en: string } }[];
  howToUse: { da: string; en: string };
  whenToUse: string;
  pairWith: { handle: string; title: string }[];
  whenLabel: string;
  howToUseLabel: string;
  keyIngredientsLabel: string;
  skinTypesLabel: string;
  targetsLabel: string;
  pairWithLabel: string;
  noReviewsLabel: string;
}

export function ProductPageTabs({
  locale,
  labels,
  description,
  skinTypes,
  concerns,
  keyIngredients,
  howToUse,
  whenToUse,
  pairWith,
  whenLabel,
  howToUseLabel,
  keyIngredientsLabel,
  skinTypesLabel,
  targetsLabel,
  pairWithLabel,
  noReviewsLabel,
}: ProductPageTabsProps) {
  const localeKey = locale as "da" | "en";

  return (
    <Tabs defaultValue="description" className="mt-12 w-full border-t border-border pt-8">
      <TabsList className="w-full justify-start rounded-xl bg-muted p-1">
        <TabsTrigger value="description" className="flex-1 sm:flex-none">
          {labels.description}
        </TabsTrigger>
        <TabsTrigger value="ingredients" className="flex-1 sm:flex-none">
          {labels.ingredients}
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex-1 sm:flex-none">
          {labels.reviews}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <p className="text-sm text-muted-foreground">{description}</p>
      </TabsContent>

      <TabsContent value="ingredients" className="mt-6 space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{skinTypesLabel}</h3>
          <div className="flex flex-wrap gap-2">
            {skinTypes.map((type, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                )}
              >
                {type[localeKey]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{targetsLabel}</h3>
          <div className="flex flex-wrap gap-2">
            {concerns.map((concern, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                )}
              >
                {concern[localeKey]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{keyIngredientsLabel}</h3>
          <ul className="space-y-2">
            {keyIngredients.map((ingredient, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-foreground">{ingredient.name}</span>
                <span className="text-muted-foreground"> — {ingredient.benefit[localeKey]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{howToUseLabel}</h3>
          <p className="text-sm text-muted-foreground">{howToUse[localeKey]}</p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">{whenLabel}</h3>
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {whenToUse}
          </span>
        </div>
        {pairWith.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">{pairWithLabel}</h3>
            <div className="flex gap-4">
              {pairWith.slice(0, 2).map(({ handle, title }) => (
                <Link
                  key={handle}
                  href={`/${locale}/products/${handle}`}
                  className="group flex items-center gap-2"
                >
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
                  <span className="text-sm text-muted-foreground group-hover:text-primary">
                    {title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <p className="text-sm text-muted-foreground">{noReviewsLabel}</p>
      </TabsContent>
    </Tabs>
  );
}
