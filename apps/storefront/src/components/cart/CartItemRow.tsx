"use client";

import { formatPrice } from "@/lib/format";
import {
  getLineOriginalTotal,
  getLineTotal,
  getLineDiscount,
  isLineDiscounted,
} from "@/lib/cart-display";
import { Minus, Plus, X, ChevronDown, RotateCw } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CartItem } from "./CartItems";

const CYCLE_OPTIONS = [4, 8, 12] as const;

interface CartItemRowProps {
  item: CartItem;
  locale: string;
  dict: Dictionary;
  isPending: boolean;
  onRemove: (lineItemId: string) => void;
  onQuantityChange: (
    lineItemId: string,
    newQuantity: number,
    metadata?: Record<string, unknown>
  ) => void;
  onSubscriptionToggle: (item: CartItem, cycleWeeks: number | null) => void;
  onCycleChange: (item: CartItem, weeks: number) => void;
}

export function CartItemRow({
  item,
  locale,
  dict,
  isPending,
  onRemove,
  onQuantityChange,
  onSubscriptionToggle,
  onCycleChange,
}: CartItemRowProps) {
  const thumbnail = item.thumbnail || item.variant?.product?.thumbnail;
  const title = item.product_title || item.title || "Product";
  const variantTitle = (item.variant_title || item.variant?.title) ?? "";
  const quantity = item.quantity ?? 1;
  const cycle = typeof item.metadata?.subscription_cycle === "number"
    ? item.metadata.subscription_cycle
    : 0;
  const isSubscription = cycle > 0;

  const lineTotalOriginal = getLineOriginalTotal(item);
  const lineTotal = getLineTotal(item);
  const discountAmount = getLineDiscount(item);
  const showDiscounted = isLineDiscounted(item);

  return (
    <div className="py-4 sm:py-5 first:pt-0 last:pb-0">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] shrink-0 rounded-lg overflow-hidden bg-surface border border-border">
          {thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              {locale === "da" ? "Intet billede" : "No image"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                {title}
              </h3>
              {variantTitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{variantTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={isPending}
              className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-40"
              aria-label={dict.cart.remove}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={() => onSubscriptionToggle(item, isSubscription ? null : 4)}
                disabled={isPending}
                className="sr-only peer"
              />
              <span className="relative flex items-center justify-center w-4 h-4 rounded-[3px] border-[1.5px] border-border bg-background peer-checked:bg-primary peer-checked:border-primary transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1">
                {isSubscription && (
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6.5L4.5 9L10 3" />
                  </svg>
                )}
              </span>
              <RotateCw className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[13px] text-foreground group-hover:text-primary transition-colors leading-none">
                {dict.cart.subscribeAndSave}
              </span>
            </label>

            {isSubscription && discountAmount > 0 && (
              <p className="ml-6 text-xs text-success mt-0.5">
                {dict.cart.youSave.replace("{{amount}}", discountAmount.toFixed(2).replace(".", ","))}
              </p>
            )}

            {isSubscription && (
              <div className="mt-1.5 ml-6 inline-flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{dict.cart.deliveryLabel}</span>
                <div className="relative">
                  <select
                    value={cycle}
                    onChange={(e) => onCycleChange(item, Number(e.target.value))}
                    disabled={isPending}
                    className="text-xs font-medium bg-surface border border-border rounded-md pl-2 pr-6 py-1 appearance-none cursor-pointer hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                  >
                    {CYCLE_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {dict.cart.everyXWeeks.replace("{{weeks}}", String(w))}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between gap-3 mt-auto pt-2.5">
            <div className="inline-flex items-center rounded-md border border-border bg-background h-8">
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, quantity - 1, item.metadata)}
                disabled={isPending || quantity <= 1}
                className="flex items-center justify-center w-8 h-full hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-l-md"
                aria-label={dict.cart.decreaseQuantity}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex items-center justify-center w-8 h-full text-[13px] font-medium text-foreground border-x border-border tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, quantity + 1, item.metadata)}
                disabled={isPending}
                className="flex items-center justify-center w-8 h-full hover:bg-surface transition-colors rounded-r-md"
                aria-label={dict.cart.increaseQuantity}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="text-right shrink-0">
              {showDiscounted ? (
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatPrice(lineTotal, locale)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(lineTotalOriginal, locale)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatPrice(lineTotalOriginal, locale)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
