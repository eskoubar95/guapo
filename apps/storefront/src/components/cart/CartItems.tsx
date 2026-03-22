"use client";

import { useTransition } from "react";
import { removeLineItem, updateLineItem, setLineItemSubscription } from "@/lib/cart";
import { lineAmountForDisplay } from "@/lib/cart-display";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import { CartItemRow } from "./CartItemRow";

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
      {items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          locale={locale}
          dict={dict}
          isPending={isPending}
          itemTotalInclTaxDisplay={itemTotalInclTaxDisplay}
          sumRawLineTotals={sumRawLineTotals}
          onRemove={handleRemove}
          onQuantityChange={handleQuantityChange}
          onSubscriptionToggle={handleSubscriptionToggle}
          onCycleChange={handleCycleChange}
        />
      ))}
    </div>
  );
}
