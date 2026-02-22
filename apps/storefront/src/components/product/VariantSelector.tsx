"use client";

import { useState } from "react";

interface Variant {
  id: string;
  title: string;
  price: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  sizeLabel?: string;
  onSelect?: (variantId: string) => void;
}

export function VariantSelector({ variants, sizeLabel = "Størrelse", onSelect }: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  if (variants.length <= 1) return null;

  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-foreground">{sizeLabel}</label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedId === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => handleSelect(variant.id)}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/70"
              }`}
            >
              {variant.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
