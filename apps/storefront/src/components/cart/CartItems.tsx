"use client";

import { useTransition } from "react";
import { removeLineItem, updateLineItem, setLineItemSubscription } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { lineAmountForDisplay } from "@/lib/cart-display";
import { useRouter } from "next/navigation";
import { Minus, Plus, X, ChevronDown, RotateCw } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

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
  discount_total?: number;
  original_total?: number;
  adjustments?: Array<{ code?: string; amount?: number }>;
  metadata?: Record<string, unknown>;
}

interface CartItemsProps {
  items: CartItem[];
  locale: string;
  dict: Dictionary;
  /** Cart-level item total incl. VAT (DKK). When set, each line shows its share so all prices are consumer-facing incl. VAT. */
  itemTotalInclTaxDisplay?: number;
}

export function CartItems({ items, locale, dict, itemTotalInclTaxDisplay }: CartItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sumRawLineTotals =
    itemTotalInclTaxDisplay != null
      ? items.reduce(
          (s, i) =>
            s +
            lineAmountForDisplay(
              i.total ?? i.original_total ?? (i.unit_price ?? 0) * (i.quantity ?? 1)
            ),
          0
        )
      : 0;

  const handleRemove = (lineItemId: string) => {
    startTransition(async () => {
      await removeLineItem(lineItemId);
      router.refresh();
    });
  };

  const handleQuantityChange = (
    lineItemId: string,
    newQuantity: number,
    metadata?: Record<string, unknown>
  ) => {
    if (newQuantity < 1) return;
    startTransition(async () => {
      await updateLineItem(lineItemId, newQuantity, metadata);
      router.refresh();
    });
  };

  const handleSubscriptionToggle = (item: CartItem, cycleWeeks: number | null) => {
    const variantId = item.variant_id ?? (item.variant as { id?: string } | undefined)?.id;
    if (!variantId) return;
    startTransition(async () => {
      await setLineItemSubscription(item.id, variantId, item.quantity ?? 1, cycleWeeks);
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
    <div className={`divide-y divide-border transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {items.map((item) => {
        const thumbnail = item.thumbnail || item.variant?.product?.thumbnail;
        const title = item.product_title || item.title || "Product";
        const variantTitle = (item.variant_title || item.variant?.title) ?? "";
        const quantity = item.quantity ?? 1;
        const cycle = typeof item.metadata?.subscription_cycle === "number"
          ? item.metadata.subscription_cycle
          : 0;
        const isSubscription = cycle > 0;
        const rawLineTotal = item.total ?? item.original_total ?? (item.unit_price ?? 0) * quantity;
        const rawLineOriginal = item.original_total ?? (item.unit_price ?? 0) * quantity;
        const discountAmountRaw = item.discount_total ?? 0;
        const discountAmount = lineAmountForDisplay(discountAmountRaw);
        const lineRawDisplay = lineAmountForDisplay(rawLineOriginal);
        const lineTotalOriginal =
          itemTotalInclTaxDisplay != null && sumRawLineTotals > 0
            ? Math.round((itemTotalInclTaxDisplay * (lineRawDisplay / sumRawLineTotals)) * 100) / 100
            : lineRawDisplay;
        const lineTotal =
          discountAmountRaw > 0
            ? item.total != null
              ? itemTotalInclTaxDisplay != null && sumRawLineTotals > 0
                ? Math.round((itemTotalInclTaxDisplay * (lineAmountForDisplay(item.total) / sumRawLineTotals)) * 100) / 100
                : lineAmountForDisplay(item.total)
              : lineTotalOriginal - discountAmount
            : lineTotalOriginal;

        return (
          <div key={item.id} className="py-4 sm:py-5 first:pt-0 last:pb-0">
            <div className="flex gap-3 sm:gap-4">
              {/* Thumbnail */}
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

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Title + remove */}
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
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-40"
                    aria-label={dict.cart.remove}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subscription toggle — compact row */}
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={isSubscription}
                      onChange={() => handleSubscriptionToggle(item, isSubscription ? null : 4)}
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
                          onChange={(e) => handleCycleChange(item, Number(e.target.value))}
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

                {/* Quantity + price — bottom row, pushed down */}
                <div className="flex items-end justify-between gap-3 mt-auto pt-2.5">
                  <div className="inline-flex items-center rounded-md border border-border bg-background h-8">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, quantity - 1, item.metadata)}
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
                      onClick={() => handleQuantityChange(item.id, quantity + 1, item.metadata)}
                      disabled={isPending}
                      className="flex items-center justify-center w-8 h-full hover:bg-surface transition-colors rounded-r-md"
                      aria-label={dict.cart.increaseQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    {isSubscription && discountAmount > 0 ? (
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
      })}
    </div>
  );
}
