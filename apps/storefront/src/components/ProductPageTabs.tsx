"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductSpecifications } from "@/lib/payload-products";

export interface ProductPageTabsProps {
  locale: string;
  labels: {
    description: string;
    ingredients: string;
    specifications: string;
  };
  description: string;
  skinTypes: { da: string; en: string }[];
  concerns: { da: string; en: string }[];
  keyIngredients: { name: string; benefit: { da: string; en: string } }[];
  ingredients: { name: string; inciName?: string }[];
  specifications?: ProductSpecifications;
  keyIngredientsLabel: string;
  skinTypesLabel: string;
  targetsLabel: string;
  volumeLabel: string;
}

export function ProductPageTabs({
  locale,
  labels,
  description,
  skinTypes,
  concerns,
  keyIngredients,
  ingredients,
  specifications,
  keyIngredientsLabel,
  skinTypesLabel,
  targetsLabel,
  volumeLabel,
}: ProductPageTabsProps) {
  const localeKey = locale as "da" | "en";

  return (
    <Tabs defaultValue="description" className="mt-12 w-full border-t border-border pt-8">
      <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger
          value="description"
          className="min-w-0 flex-1 shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 pb-3 pt-0 font-semibold uppercase tracking-wide text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
        >
          {labels.description}
        </TabsTrigger>
        <TabsTrigger
          value="ingredients"
          className="min-w-0 flex-1 shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 pb-3 pt-0 font-semibold uppercase tracking-wide text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
        >
          {labels.ingredients}
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="min-w-0 flex-1 shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 pb-3 pt-0 font-semibold uppercase tracking-wide text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground"
        >
          {labels.specifications}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <div className="whitespace-pre-line text-muted-foreground">{description || (localeKey === "da" ? "Ingen beskrivelse angivet." : "No description available.")}</div>
      </TabsContent>

      <TabsContent value="ingredients" className="mt-6 space-y-6">
        {keyIngredients.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">{keyIngredientsLabel}</h3>
            <ul className="space-y-2">
              {keyIngredients.map((ingredient, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-foreground">{ingredient.name}</span>
                  {ingredient.benefit[localeKey] && (
                    <span className="text-muted-foreground"> — {ingredient.benefit[localeKey]}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {ingredients.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              {localeKey === "da" ? "Fuld ingrediensliste (INCI)" : "Full ingredient list (INCI)"}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {ingredients.map((i) => (i.inciName || i.name).trim()).filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        {keyIngredients.length === 0 && ingredients.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {localeKey === "da" ? "Ingen ingredienser angivet." : "No ingredients specified."}
          </p>
        )}
      </TabsContent>

      <TabsContent value="specifications" className="mt-6 space-y-4">
        <dl className="space-y-4">
          {specifications?.volume && (
            <div>
              <dt className="mb-1 text-sm font-medium text-foreground">{volumeLabel}</dt>
              <dd className="text-sm text-muted-foreground">{specifications.volume}</dd>
            </div>
          )}
          {specifications?.sku && (
            <div>
              <dt className="mb-1 text-sm font-medium text-foreground">
                {localeKey === "da" ? "SKU" : "SKU"}
              </dt>
              <dd className="text-sm text-muted-foreground">{specifications.sku}</dd>
            </div>
          )}
          {specifications?.ean && (
            <div>
              <dt className="mb-1 text-sm font-medium text-foreground">
                {localeKey === "da" ? "EAN" : "EAN"}
              </dt>
              <dd className="text-sm text-muted-foreground">{specifications.ean}</dd>
            </div>
          )}
          {specifications?.manufacturer && (
            <div>
              <dt className="mb-1 text-sm font-medium text-foreground">
                {localeKey === "da" ? "Producent" : "Manufacturer"}
              </dt>
              <dd className="text-sm text-muted-foreground">{specifications.manufacturer}</dd>
            </div>
          )}
        </dl>
        {!specifications?.volume &&
          !specifications?.sku &&
          !specifications?.ean &&
          !specifications?.manufacturer && (
            <p className="text-sm text-muted-foreground">
              {localeKey === "da" ? "Ingen specifikationer angivet." : "No specifications available."}
            </p>
          )}
      </TabsContent>
    </Tabs>
  );
}
