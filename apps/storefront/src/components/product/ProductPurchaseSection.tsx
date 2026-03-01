"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { SubscriptionSelector } from "@/components/SubscriptionSelector";

interface Variant {
  id: string;
  title: string;
  price: number;
}

interface SubscriptionConfig {
  basePrice: number;
  currency: string;
  locale: string;
}

interface ProductPurchaseSectionProps {
  variants: Variant[];
  sizeLabel: string;
  quantityLabel: string;
  addToCartLabel: string;
  addedLabel: string;
  decreaseQuantityAriaLabel?: string;
  increaseQuantityAriaLabel?: string;
  purchaseOptionsLabel?: string;
  subscriptionConfig?: SubscriptionConfig;
}

export function ProductPurchaseSection({
  variants,
  sizeLabel,
  quantityLabel,
  addToCartLabel,
  addedLabel,
  decreaseQuantityAriaLabel = "Decrease quantity",
  increaseQuantityAriaLabel = "Increase quantity",
  purchaseOptionsLabel = "Purchase options",
  subscriptionConfig,
}: ProductPurchaseSectionProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">("one-time");
  const [selectedCycle, setSelectedCycle] = useState(8);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedVariantPrice =
    variants.find((v) => v.id === selectedVariantId)?.price ??
    subscriptionConfig?.basePrice ??
    0;

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    setQuantity(newQuantity);
  };

  const handleSubscriptionSelect = (type: "one-time" | "subscription", cycle?: number) => {
    setPurchaseType(type);
    if (cycle) setSelectedCycle(cycle);
  };

  const handleAddToCart = () => {
    if (!selectedVariantId) return;
    setError(null);
    startTransition(async () => {
      try {
        const options =
          purchaseType === "subscription" && subscriptionConfig
            ? { subscription_cycle: selectedCycle }
            : undefined;
        await addToCart(selectedVariantId, quantity, options);
        setAdded(true);
        router.refresh();
        if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        addedTimerRef.current = setTimeout(() => setAdded(false), 2000);
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
              aria-label={decreaseQuantityAriaLabel}
            >
              <Minus className="h-4 w-4 text-foreground" />
            </button>
            <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 99}
              className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={increaseQuantityAriaLabel}
            >
              <Plus className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription selector (when subscriptionConfig provided) */}
      {subscriptionConfig && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-foreground">{purchaseOptionsLabel}</p>
          <SubscriptionSelector
            basePrice={selectedVariantPrice}
            currency={subscriptionConfig.currency}
            locale={subscriptionConfig.locale}
            onSelect={handleSubscriptionSelect}
          />
        </div>
      )}

      {/* Add to cart – uses shared Button (pill/rounded-full) */}
      <Button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending || !selectedVariantId}
        className="mt-6 w-full"
        size="lg"
      >
        {isPending ? "..." : added ? addedLabel : addToCartLabel}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}
