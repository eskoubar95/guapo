"use client";

import { useTransition } from "react";
import { removeLineItem, updateLineItem, setLineItemSubscription } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";
import { Minus, Plus, X, Check, ChevronDown } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

const SUBSCRIPTION_DISCOUNT_PERCENT = 20;
const CYCLE_OPTIONS = [4, 8, 12] as const;

export interface CartItem {
  id: string;
  variant_id?: string;
  thumbnail?: string;
  product_title?: string;
  title?: string;
  variant_title?: string;
  variant?: {
    product?: { thumbnail?: string; title?: string };
    title?: string;
  };
  unit_price?: number;
  quantity?: number;
  total?: number;
  metadata?: Record<string, unknown>;
}

interface CartItemsProps {
  items: CartItem[];
  locale: string;
  dict: Dictionary;
}

export function CartItems({ items, locale, dict }: CartItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = (lineItemId: string) => {
    startTransition(async () => {
      await removeLineItem(lineItemId);
      router.refresh();
    });
  };

  const handleQuantityChange = (lineItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    startTransition(async () => {
      await updateLineItem(lineItemId, newQuantity);
      router.refresh();
    });
  };

  const handleSubscriptionToggle = (item: CartItem, cycleWeeks: number | null) => {
    const variantId = item.variant_id ?? (item.variant as { id?: string } | undefined)?.id;
    if (!variantId) return;
    startTransition(async () => {
      await setLineItemSubscription(
        item.id,
        variantId,
        item.quantity ?? 1,
        cycleWeeks
      );
      router.refresh();
    });
  };

  const handleCycleChange = (item: CartItem, weeks: number) => {
    const variantId = item.variant_id ?? (item.variant as { id?: string } | undefined)?.id;
    if (!variantId) return;
    startTransition(async () => {
      await setLineItemSubscription(item.id, variantId, item.quantity ?? 1, weeks);
      router.refresh();
    });
  };

  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map((item) => {
        const thumbnail = item.thumbnail || item.variant?.product?.thumbnail;
        const title = item.product_title || item.title || "Product";
        const variantTitle = (item.variant_title || item.variant?.title) ?? "";
        const description = variantTitle || (locale === "da" ? "Produkt i kurv" : "Item in cart");
        const unitPrice = item.unit_price ?? 0;
        const quantity = item.quantity ?? 1;
        const cycle = typeof item.metadata?.subscription_cycle === "number"
          ? item.metadata.subscription_cycle
          : 0;
        const isSubscription = cycle > 0;
        const lineTotalOriginal = unitPrice * quantity;
        const discountAmount = isSubscription
          ? (lineTotalOriginal * SUBSCRIPTION_DISCOUNT_PERCENT) / 100
          : 0;
        const lineTotal = lineTotalOriginal - discountAmount;

        return (
          <div
            key={item.id}
            className="flex gap-3 lg:gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="w-20 h-20 lg:w-24 lg:h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
              {thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  {locale === "da" ? "Intet billede" : "No image"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {dict.common.brand}
                  </p>
                  <h3 className="text-sm font-medium text-foreground mt-0.5">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label={dict.cart.remove}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Subscription toggle */}
              <div className="mt-3 mb-3">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSubscription}
                      onChange={() =>
                        handleSubscriptionToggle(
                          item,
                          isSubscription ? null : 4
                        )
                      }
                      disabled={isPending}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 border-2 border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                      {isSubscription && (
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {dict.cart.subscribeAndSave}
                    </span>
                    {isSubscription && discountAmount > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        {dict.cart.youSave.replace("{{amount}}", discountAmount.toFixed(2))}
                      </p>
                    )}
                  </div>
                </label>

                {isSubscription && (
                  <div className="mt-2 ml-6 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {dict.cart.deliveryLabel}
                    </span>
                    <select
                      value={cycle}
                      onChange={(e) =>
                        handleCycleChange(item, Number(e.target.value))
                      }
                      disabled={isPending}
                      className="text-xs bg-background border border-border rounded px-2 py-1.5 pr-7 appearance-none cursor-pointer hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CYCLE_OPTIONS.map((w) => (
                        <option key={w} value={w}>
                          {dict.cart.everyXWeeks.replace("{{weeks}}", String(w))}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-3 w-3 text-muted-foreground pointer-events-none -ml-5" />
                  </div>
                )}
              </div>

              {/* Quantity & price row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, quantity - 1)}
                    disabled={isPending || quantity <= 1}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={dict.cart.decreaseQuantity}
                  >
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium text-foreground min-w-10 text-center border-x border-border">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, quantity + 1)}
                    disabled={isPending}
                    className="px-2.5 py-1.5 hover:bg-muted transition-colors"
                    aria-label={dict.cart.increaseQuantity}
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="text-right">
                  {isSubscription && discountAmount > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-destructive">
                        {formatPrice(lineTotal, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(lineTotalOriginal, locale)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(lineTotalOriginal, locale)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
