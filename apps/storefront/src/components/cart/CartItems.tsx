"use client";

import { useState, useTransition } from "react";
import { removeLineItem, updateLineItem, setLineItemSubscription } from "@/lib/cart";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import { userMessageForLineItemError } from "@/lib/cart-errors";
import { getCartLineQuantityCap } from "@/lib/product-inventory";
import { CartItemRow } from "./CartItemRow";

export interface CartItem {
  id: string;
  variant_id?: string;
  product_id?: string;
  thumbnail?: string;
  product_title?: string;
  title?: string;
  variant_title?: string;
  variant?: {
    id?: string;
    product?: { thumbnail?: string; title?: string };
    title?: string;
    manage_inventory?: boolean;
    inventory_quantity?: number | null;
  };
  unit_price?: number;
  quantity?: number;
  subtotal?: number;
  tax_total?: number;
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
}

export function CartItems({ items, locale, dict }: CartItemsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qtyError, setQtyError] = useState<{ lineId: string; message: string } | null>(null);

  const handleRemove = (lineItemId: string) => {
    setQtyError(null);
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
    const item = items.find((i) => i.id === lineItemId);
    if (item && newQuantity > getCartLineQuantityCap(item)) return;
    setQtyError(null);
    startTransition(async () => {
      try {
        await updateLineItem(lineItemId, newQuantity, metadata);
        router.refresh();
      } catch (e) {
        const raw = e instanceof Error ? e.message : "";
        setQtyError({
          lineId: lineItemId,
          message: userMessageForLineItemError(
            raw,
            dict.cart.notEnoughStock,
            dict.cart.quantityUpdateFailed
          ),
        });
      }
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
          onRemove={handleRemove}
          onQuantityChange={handleQuantityChange}
          onSubscriptionToggle={handleSubscriptionToggle}
          onCycleChange={handleCycleChange}
          quantityError={qtyError?.lineId === item.id ? qtyError.message : null}
        />
      ))}
    </div>
  );
}
