"use client";

import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getFreeShippingThresholdDkk } from "@/lib/shipping-config";
import type { AddToCartModalData } from "@/contexts/AddToCartModalContext";
import type { Dictionary } from "@/i18n/dictionaries";

/** Medusa cart amounts in this project are in DKK (not øre). */
interface AddToCartModalProps {
  data: AddToCartModalData;
  locale: string;
  dict: Dictionary;
  onClose: () => void;
}

export function AddToCartModal({ data, locale, dict, onClose }: AddToCartModalProps) {
  const base = `/${locale}`;
  const thresholdDkk = getFreeShippingThresholdDkk();
  const progress = Math.min(100, (data.cartTotal / thresholdDkk) * 100);
  const hasFreeShipping = data.cartTotal >= thresholdDkk;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 sm:p-8 shadow-2xl"
        role="dialog"
        aria-labelledby="add-to-cart-title"
      >
        <div className="flex items-center justify-between mb-5">
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
            aria-label="Luk"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Added product row */}
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
            <span className="flex items-center justify-center w-8 h-8 text-muted-foreground/80">
              <Minus className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center justify-center min-w-8 px-2 py-1.5 text-sm font-medium text-foreground border-x border-border/80 bg-background">
              {data.quantity}
            </span>
            <span className="flex items-center justify-center w-8 h-8 text-muted-foreground/80">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Cart total */}
        <p className="text-base font-semibold text-primary mt-4">
          {dict.cart.cartTotalCount.replace("{{count}}", String(data.itemCount))} : {formatPrice(data.cartTotal, locale)}
        </p>

        {/* Free shipping progress */}
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
            {dict.cart.freeShippingProgress}
          </p>
        </div>

        {/* Actions */}
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
    </>
  );
}
