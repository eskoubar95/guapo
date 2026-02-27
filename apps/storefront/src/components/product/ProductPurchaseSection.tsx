"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cart";

interface Variant {
  id: string;
  title: string;
  price: number;
}

interface ProductPurchaseSectionProps {
  variants: Variant[];
  sizeLabel: string;
  quantityLabel: string;
  addToCartLabel: string;
  addedLabel: string;
  children?: React.ReactNode;
}

export function ProductPurchaseSection({
  variants,
  sizeLabel,
  quantityLabel,
  addToCartLabel,
  addedLabel,
  children,
}: ProductPurchaseSectionProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!selectedVariantId) return;
    setError(null);
    startTransition(async () => {
      try {
        await addToCart(selectedVariantId, quantity);
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  };

  return (
    <>
      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <label className="mb-3 block text-sm font-medium text-foreground">{sizeLabel}</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
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
      )}

      {/* Quantity selector */}
      <div className="mt-6 flex flex-wrap items-end gap-6">
        <div>
          <label className="mb-3 block text-sm font-medium text-foreground">{quantityLabel}</label>
          <div className="flex w-fit items-center gap-3 rounded-lg bg-muted/50 p-2">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4 text-foreground" />
            </button>
            <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 99}
              className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription selector etc. (passed as children) */}
      {children}

      {/* Add to cart */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending || !selectedVariantId}
        className="mt-6 w-full rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "..." : added ? addedLabel : addToCartLabel}
      </button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}
