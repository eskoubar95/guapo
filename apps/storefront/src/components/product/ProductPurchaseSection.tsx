"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "@/lib/cart";
import {
  getCartItemsTotal,
  getLineUnitPrice,
} from "@/lib/cart-display";
import type { StoreCart } from "@/lib/cart-data";
import { fetchClientStoreCart, resolveAddedLineItem } from "@/lib/fetch-client-cart";
import { Button } from "@/components/ui/button";
import { SubscriptionSelector } from "@/components/SubscriptionSelector";
import { useAddToCartModal } from "@/contexts/AddToCartModalContext";
import { useCart } from "@/contexts/CartContext";
import {
  formatLowStockLabel,
  getVariantStockInfo,
} from "@/lib/product-inventory";

interface Variant {
  id: string;
  title: string;
  price: number;
  manage_inventory?: boolean;
  inventory_quantity?: number | null;
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
  outOfStockLabel: string;
  lowStockWithCountLabel: string;
}

function firstInStockVariantId(vs: Variant[]): string {
  for (const v of vs) {
    const s = getVariantStockInfo(v.manage_inventory, v.inventory_quantity);
    if (s.inStock) return v.id;
  }
  return vs[0]?.id ?? "";
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
  outOfStockLabel,
  lowStockWithCountLabel,
}: ProductPurchaseSectionProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(() =>
    firstInStockVariantId(variants)
  );
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">("one-time");
  const [selectedCycle, setSelectedCycle] = useState(8);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openModal } = useAddToCartModal();
  const { refreshCart } = useCart();

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const stock = useMemo(
    () =>
      getVariantStockInfo(
        selectedVariant?.manage_inventory,
        selectedVariant?.inventory_quantity
      ),
    [selectedVariant?.manage_inventory, selectedVariant?.inventory_quantity]
  );

  const maxSelectable =
    stock.maxQuantity != null && stock.maxQuantity > 0
      ? Math.min(99, stock.maxQuantity)
      : stock.inStock
        ? 99
        : 1;

  useEffect(() => {
    if (variants.length === 0) return;
    const stillThere = variants.some((v) => v.id === selectedVariantId);
    if (!stillThere) {
      setSelectedVariantId(firstInStockVariantId(variants));
    }
  }, [variants, selectedVariantId]);

  useEffect(() => {
    setQuantity((q) => {
      if (!stock.inStock) return q;
      const cap = stock.maxQuantity != null ? Math.min(99, stock.maxQuantity) : 99;
      return Math.min(Math.max(1, q), cap);
    });
  }, [selectedVariantId, stock.inStock, stock.maxQuantity]);

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
    if (newQuantity < 1 || newQuantity > maxSelectable) return;
    setQuantity(newQuantity);
  };

  const handleSubscriptionSelect = (type: "one-time" | "subscription", cycle?: number) => {
    setPurchaseType(type);
    if (cycle) setSelectedCycle(cycle);
  };

  const handleAddToCart = () => {
    if (!selectedVariantId || !stock.inStock) return;
    setError(null);
    startTransition(async () => {
      try {
        const options =
          purchaseType === "subscription" && subscriptionConfig
            ? { subscription_cycle: selectedCycle }
            : undefined;
        const addCart = (await addToCart(selectedVariantId, quantity, options)) as
          | StoreCart
          | undefined;
        setAdded(true);
        router.refresh();
        await refreshCart();
        if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        addedTimerRef.current = setTimeout(() => setAdded(false), 2000);

        const cart = (await fetchClientStoreCart()) ?? addCart;
        const last = resolveAddedLineItem(cart, addCart, selectedVariantId);
        if (cart?.items?.length && last) {
          openModal({
            productTitle: last.product_title ?? last.title ?? "",
            variantTitle: last.variant_title ?? last.variant?.title,
            thumbnail: last.thumbnail ?? last.variant?.product?.thumbnail,
            quantity: last.quantity ?? quantity,
            unitPrice: getLineUnitPrice(last) || selectedVariantPrice,
            cartTotal: getCartItemsTotal(cart),
            itemCount: cart.items.length,
            lineItemId: last.id,
            metadata: last.metadata,
          });
        }
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
              const vStock = getVariantStockInfo(
                variant.manage_inventory,
                variant.inventory_quantity
              );
              const disabled = !vStock.inStock;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                    disabled
                      ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground line-through opacity-70"
                      : isSelected
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

      {!stock.inStock && (
        <p className="mt-6 text-sm font-medium text-destructive" role="status">
          {outOfStockLabel}
        </p>
      )}
      {stock.inStock && stock.isLowStock && stock.availableQuantity != null && (
        <p
          className={`text-sm font-medium text-amber-900 dark:text-amber-200 ${variants.length > 1 ? "mt-4" : "mt-6"}`}
          role="status"
        >
          {formatLowStockLabel(lowStockWithCountLabel, stock.availableQuantity)}
        </p>
      )}

      {/* Quantity selector */}
      {stock.inStock && (
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
                disabled={quantity >= maxSelectable}
                className="rounded p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={increaseQuantityAriaLabel}
              >
                <Plus className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription selector (when subscriptionConfig provided) */}
      {stock.inStock && subscriptionConfig && (
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
        disabled={isPending || !selectedVariantId || !stock.inStock}
        className="mt-6 w-full"
        size="lg"
      >
        {isPending ? "..." : added ? addedLabel : addToCartLabel}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}
