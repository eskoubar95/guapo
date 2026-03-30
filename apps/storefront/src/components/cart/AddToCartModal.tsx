"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { StoreCart } from "@/lib/cart-data";
import {
  getCartItemsTotal,
  getLineUnitPrice,
} from "@/lib/cart-display";
import { getCartLineQuantityCap } from "@/lib/product-inventory";
import { getFreeShippingThresholdDkk } from "@/lib/shipping-config";
import { useFreeShippingStatus } from "@/hooks/useFreeShippingStatus";
import { useAddToCartModal } from "@/contexts/AddToCartModalContext";
import { useCart } from "@/contexts/CartContext";
import type { AddToCartModalData } from "@/contexts/AddToCartModalContext";
import { userMessageForLineItemError } from "@/lib/cart-errors";
import type { Dictionary } from "@/i18n/dictionaries";

interface AddToCartModalProps {
  data: AddToCartModalData;
  locale: string;
  dict: Dictionary;
  onClose: () => void;
}

export function AddToCartModal({ data, locale, dict, onClose }: AddToCartModalProps) {
  const { updateModalData } = useAddToCartModal();
  const { refreshCart, cart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [qtyError, setQtyError] = useState<string | null>(null);

  const lineFromCart = useMemo(
    () => cart?.items?.find((i) => i.id === data.lineItemId),
    [cart?.items, data.lineItemId]
  );
  const maxQty = lineFromCart ? getCartLineQuantityCap(lineFromCart) : 99;

  const fsStatus = useFreeShippingStatus(cart?.id, data.cartTotal);
  const thresholdDkk = fsStatus?.threshold ?? getFreeShippingThresholdDkk();
  const freeShippingEnabled = fsStatus?.enabled !== false;

  const base = `/${locale}`;
  const progress = Math.min(100, (data.cartTotal / thresholdDkk) * 100);
  const hasFreeShipping =
    freeShippingEnabled &&
    (fsStatus?.qualifies ?? data.cartTotal >= thresholdDkk);

  const canChangeQty = Boolean(data.lineItemId);

  const handleQuantityChange = async (delta: number) => {
    if (!data.lineItemId || updating) return;
    const newQty = Math.min(maxQty, Math.max(1, data.quantity + delta));
    if (newQty === data.quantity) return;
    setUpdating(true);
    setQtyError(null);
    try {
      const updateRes = await fetch("/api/cart/line-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItemId: data.lineItemId,
          quantity: newQty,
          metadata: data.metadata,
        }),
      });
      if (!updateRes.ok) {
        const errBody = (await updateRes.json().catch(() => ({}))) as { error?: string };
        setQtyError(
          userMessageForLineItemError(
            typeof errBody.error === "string" ? errBody.error : "",
            dict.cart.notEnoughStock,
            dict.cart.quantityUpdateFailed
          )
        );
        return;
      }
      const cartRes = await fetch("/api/cart");
      const nextCart = (await cartRes.json()) as StoreCart | null;
      if (nextCart?.items) {
        const item = nextCart.items.find((i) => i.id === data.lineItemId);
        updateModalData({
          quantity: item?.quantity ?? newQty,
          cartTotal: getCartItemsTotal(nextCart),
          itemCount: nextCart.items.length,
          ...(item ? { unitPrice: getLineUnitPrice(item) } : {}),
        });
      }
      await refreshCart();
    } catch {
      setQtyError(dict.cart.quantityUpdateFailed);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 flex w-full min-h-[70vh] max-h-[90vh] flex-col rounded-t-2xl border border-border border-b-0 bg-background shadow-2xl animate-drawer-up md:min-h-0 md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-h-none md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border-b md:animate-none"
        role="dialog"
        aria-labelledby="add-to-cart-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 py-3 md:border-0 md:px-6 md:pt-6 md:pb-5">
          <div className="flex items-center gap-2.5 text-green-600">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm font-bold">
              ✓
            </span>
            <h2 id="add-to-cart-title" className="text-lg font-semibold text-foreground">
              {dict.cart.addedToCart}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 hover:bg-surface rounded-lg transition-colors"
            aria-label={dict.cart.closeModal}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20 md:hidden" aria-hidden />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6 sm:pb-8 md:px-6 md:pb-8 md:pt-0">
        <div className="flex items-center gap-3 py-3 border-b border-border/80">
          <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-muted/80">
            {data.thumbnail ? (
              <img
                src={data.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{data.productTitle}</p>
            {data.variantTitle ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{data.variantTitle}</p>
            ) : null}
            <p className="text-sm font-semibold text-primary mt-1">
              {formatPrice(data.unitPrice, locale)}
            </p>
          </div>
          <div className="flex items-center rounded-md overflow-hidden border border-border/80 bg-muted/30 shrink-0">
            {canChangeQty ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={updating || data.quantity <= 1}
                  className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label={dict.cart.decreaseQuantity}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex items-center justify-center min-w-8 px-2 py-1.5 text-sm font-medium text-foreground border-x border-border/80 bg-background">
                  {data.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={updating || data.quantity >= maxQty}
                  className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label={dict.cart.increaseQuantity}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center justify-center w-8 h-8 text-muted-foreground/80">
                  <Minus className="h-3.5 w-3.5" />
                </span>
                <span className="flex items-center justify-center min-w-8 px-2 py-1.5 text-sm font-medium text-foreground border-x border-border/80 bg-background">
                  {data.quantity}
                </span>
                <span className="flex items-center justify-center w-8 h-8 text-muted-foreground/80">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </>
            )}
          </div>
        </div>
        {qtyError ? (
          <p className="text-sm text-destructive mt-2" role="alert">
            {qtyError}
          </p>
        ) : null}

        <p className="text-base font-semibold text-primary mt-4">
          {dict.cart.cartTotalCount.replace("{{count}}", String(data.itemCount))} : {formatPrice(data.cartTotal, locale)}
        </p>

        <div className="mt-5">
          <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
            <span>{formatPrice(0, locale)}</span>
            <span>{formatPrice(thresholdDkk, locale)}</span>
          </div>
          <div className="h-2.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${hasFreeShipping ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            {dict.cart.freeShippingProgress.replace("{{threshold}}", String(thresholdDkk))}
          </p>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            {dict.cart.shopVidere}
          </button>
          <Link
            href={`${base}/cart`}
            onClick={onClose}
            className="flex-1 py-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:opacity-90 transition-opacity"
          >
            {dict.cart.seKurv}
          </Link>
        </div>
        </div>
      </div>
    </>
  );
}
