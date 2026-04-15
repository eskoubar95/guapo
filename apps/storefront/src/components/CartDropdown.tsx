"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { removeLineItem, updateLineItem, clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  getCartItemsOriginalTotal,
  getCartItemsTotal,
  getCartDiscountTotal,
  getLineOriginalTotal,
  getLineTotal,
  isLineDiscounted,
} from "@/lib/cart-display";
import { getFreeShippingThresholdDkk } from "@/lib/shipping-config";
import { useFreeShippingStatus } from "@/hooks/useFreeShippingStatus";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/components/cart/CartItems";
import type { Dictionary } from "@/i18n/dictionaries";
import { userMessageForLineItemError } from "@/lib/cart-errors";
import { getCartLineQuantityCap } from "@/lib/product-inventory";
import { getSubscriptionCycleWeeksFromMetadata } from "@/lib/subscription-cycle";

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  dict: Dictionary;
}

function CartDropdownItem({
  item,
  locale,
  dict,
  onRemove,
  onQuantityChange,
  isPending,
  quantityError,
}: {
  item: CartItem;
  locale: string;
  dict: Dictionary;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
  isPending: boolean;
  quantityError?: string | null;
}) {
  const thumbnail = item.thumbnail || item.variant?.product?.thumbnail;
  const title = item.product_title || item.title || "";
  const variantTitle = (item.variant_title || item.variant?.title) ?? "";
  const cycle = getSubscriptionCycleWeeksFromMetadata(
    item.metadata as Record<string, unknown> | undefined
  );
  const isSubscription = cycle > 0;
  const quantity = item.quantity ?? 1;
  const maxQty = getCartLineQuantityCap(item);

  const lineTotalOriginal = getLineOriginalTotal(item);
  const lineTotal = getLineTotal(item);
  const showDiscounted = isLineDiscounted(item);

  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-b-0">
      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {title}
        </p>
        {variantTitle && (
          <p className="text-xs text-muted-foreground truncate">{variantTitle}</p>
        )}
        {isSubscription && (
          <p className="text-xs text-green-600 mt-0.5">{dict.cart.youSavePerTime}</p>
        )}
        {isSubscription && (
          <p className="text-xs text-muted-foreground">{dict.cart.addedAsSubscription}</p>
        )}
        <div className="mt-1.5 flex flex-col gap-1">
          <div className="flex items-center border border-border rounded overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => onQuantityChange(quantity - 1)}
              disabled={isPending || quantity <= 1}
              className="p-1.5 hover:bg-surface disabled:opacity-40"
              aria-label={dict.cart.decreaseQuantity}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 py-1 text-xs font-medium min-w-6 text-center border-x border-border">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={isPending || quantity >= maxQty}
              className="p-1.5 hover:bg-surface disabled:opacity-40 disabled:pointer-events-none"
              aria-label={dict.cart.increaseQuantity}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {quantityError ? (
            <p className="text-xs text-destructive leading-snug" role="alert">
              {quantityError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          type="button"
          onClick={onRemove}
          disabled={isPending}
          className="p-1 hover:bg-surface rounded text-muted-foreground hover:text-foreground"
          aria-label={dict.cart.remove}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-right">
          {showDiscounted ? (
            <>
              <p className="text-sm font-semibold text-foreground">
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
  );
}

export function CartDropdown({ isOpen, onClose, locale, dict }: CartDropdownProps) {
  const { cart, refreshCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [isClearing, setIsClearing] = useState(false);
  const [qtyError, setQtyError] = useState<{ lineId: string; message: string } | null>(null);
  const router = useRouter();
  const base = `/${locale}`;
  const items = (cart?.items ?? []) as CartItem[];

  const subtotalInclVat = getCartItemsOriginalTotal(cart);
  const discountTotal = getCartDiscountTotal(cart);
  const totalInclVat = getCartItemsTotal(cart);
  const taxTotal = cart?.tax_total ?? 0;

  const fsStatus = useFreeShippingStatus(cart?.id, totalInclVat);
  const freeShippingThresholdDkk = fsStatus?.threshold ?? getFreeShippingThresholdDkk();
  const hasFreeShipping =
    fsStatus?.enabled !== false &&
    (fsStatus?.qualifies ?? totalInclVat >= freeShippingThresholdDkk);

  const handleRemove = (lineItemId: string) => {
    setQtyError(null);
    startTransition(async () => {
      await removeLineItem(lineItemId);
      router.refresh();
      await refreshCart();
    });
  };

  const handleQuantityChange = (
    lineItemId: string,
    newQty: number,
    metadata?: Record<string, unknown>
  ) => {
    if (newQty < 1) return;
    const item = items.find((i) => i.id === lineItemId);
    if (item && newQty > getCartLineQuantityCap(item)) return;
    setQtyError(null);
    startTransition(async () => {
      try {
        await updateLineItem(lineItemId, newQty, metadata);
        router.refresh();
        await refreshCart();
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
        await refreshCart();
      }
    });
  };

  const handleClearCart = () => {
    if (items.length === 0) return;
    setQtyError(null);
    setIsClearing(true);
    startTransition(async () => {
      await clearCart();
      await refreshCart();
      router.refresh();
      onClose();
      setIsClearing(false);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,380px)] max-h-[min(85vh,520px)] flex flex-col bg-background rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
        onMouseLeave={onClose}
        role="dialog"
        aria-label={dict.cart.itemsInCart}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="font-semibold text-primary">{dict.cart.itemsInCart}</h3>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={handleClearCart}
              disabled={isClearing || isPending}
              className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors disabled:opacity-50"
              aria-label={dict.cart.clearCart}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{dict.cart.clearCart}</span>
            </button>
          ) : null}
        </div>

        {items.length > 0 ? (
          <>
            <div className="overflow-y-auto flex-1 px-4 py-2 max-h-[280px]">
              {items.map((item) => (
                <CartDropdownItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  dict={dict}
                  onRemove={() => handleRemove(item.id)}
                  onQuantityChange={(qty) => handleQuantityChange(item.id, qty, item.metadata)}
                  isPending={isPending}
                  quantityError={qtyError?.lineId === item.id ? qtyError.message : null}
                />
              ))}
            </div>

            <div className="border-t border-border px-4 py-3 space-y-1.5 shrink-0 bg-surface/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict.cart.subtotal}</span>
                <span className="text-foreground">{formatPrice(subtotalInclVat, locale)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dict.cart.totalDiscount}</span>
                  <span className="text-destructive font-medium">
                    -{formatPrice(discountTotal, locale)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict.cart.shipping}</span>
                {hasFreeShipping ? (
                  <span className="text-green-600 font-medium text-xs dark:text-green-400">
                    {dict.cart.freeShippingLabel}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {locale === "da" ? "Beregnes ved kassen" : "Calculated at checkout"}
                  </span>
                )}
              </div>
              <div className="border-t border-border pt-2 mt-1">
                <div className="flex justify-between text-sm items-center">
                  <span className="font-medium text-foreground">{dict.cart.totalInclVat}</span>
                  <span className="font-semibold text-primary">
                    {formatPrice(totalInclVat, locale)}
                  </span>
                </div>
                {taxTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>{locale === "da" ? "Heraf moms (25%)" : "Incl. VAT (25%)"}</span>
                    <span>{formatPrice(taxTotal, locale)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 shrink-0">
              <Link
                href={`${base}/cart`}
                onClick={onClose}
                className="block w-full py-3 rounded-lg bg-primary text-primary-foreground text-center text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {dict.cart.goToCart}
              </Link>
            </div>
          </>
        ) : (
          <div className="px-4 py-10 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">{dict.cart.empty}</p>
            <Link
              href={`${base}/categories`}
              onClick={onClose}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              {dict.cart.goToShop}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
