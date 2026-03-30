"use client";

import Link from "next/link";
import Image from "next/image";
import { RotateCw } from "lucide-react";
import { useCheckoutCart } from "@/contexts/CheckoutCartContext";
import { formatPrice } from "@/lib/format";
import {
  getCartItemsOriginalTotal,
  getCartItemsTotal,
  getCartDiscountTotal,
  getLineOriginalTotal,
  getLineTotal,
  isLineDiscounted,
  normalizeShippingForDisplay,
} from "@/lib/cart-display";
import type { CartItem } from "@/components/cart/CartItems";
import type { Dictionary } from "@/i18n/dictionaries";

/** Share of gross price that is VAT when prices are quoted incl. 25% moms (DK). */
const VAT_SHARE_OF_GROSS_25 = 25 / 125;

export function CheckoutOrderSummary({
  locale,
  dict,
  hasSubscriptionItems,
}: {
  locale: string;
  dict: Dictionary;
  hasSubscriptionItems: boolean;
}) {
  const { cart, selectedShippingAmount } = useCheckoutCart();
  if (!cart?.items?.length) return null;
  const items = cart.items as CartItem[];

  const itemsOriginalTotal = getCartItemsOriginalTotal(cart);
  const discountTotal = getCartDiscountTotal(cart);
  const itemsTotal = getCartItemsTotal(cart);

  const cartHasShippingMethod = (cart?.shipping_methods?.length ?? 0) > 0;
  const cartShippingTotal =
    cartHasShippingMethod && cart?.shipping_total != null
      ? normalizeShippingForDisplay(cart.shipping_total)
      : null;

  const shippingCommitted =
    cartShippingTotal != null || selectedShippingAmount != null;
  /**
   * Do not prefer `cart.shipping_total` over `selectedShippingAmount`.
   * When the customer qualifies for free shipping, `CheckoutWithStripe` sets
   * `selectedShippingAmount` to 0 while Medusa may still report the raw option
   * price until the free-shipping subscriber / refresh catches up — `??` would
   * keep 51 because it is not null.
   */
  const shippingTotal =
    selectedShippingAmount === 0 || cartShippingTotal === 0
      ? 0
      : selectedShippingAmount != null
        ? selectedShippingAmount
        : cartShippingTotal ?? 0;

  const effectiveTotal = shippingCommitted
    ? itemsTotal + shippingTotal
    : itemsTotal;

  const vatTotalDisplay =
    Math.round(
      (itemsTotal * VAT_SHARE_OF_GROSS_25 +
        shippingTotal * VAT_SHARE_OF_GROSS_25) *
        100
    ) / 100;
  const shippingIsFree = shippingCommitted && shippingTotal === 0;

  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
          {dict.checkout.yourOrder}
        </h2>
        <Link
          href={`/${locale}/cart`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {dict.checkout.editInfo}
        </Link>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const rawCycle = (item.metadata as Record<string, unknown> | undefined)
            ?.subscription_cycle;
          const parsedCycle =
            typeof rawCycle === "number"
              ? rawCycle
              : typeof rawCycle === "string"
                ? Number.parseInt(rawCycle, 10)
                : 0;
          const cycle = Number.isFinite(parsedCycle) ? parsedCycle : 0;
          const isSubscription = cycle > 0;
          const lineTotalOriginal = getLineOriginalTotal(item);
          const lineTotal = getLineTotal(item);
          const showDiscounted = isLineDiscounted(item);

          return (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface border border-border">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title ?? ""}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground" />
                )}
                {isSubscription && (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <RotateCw className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 min-w-0 flex-col justify-center">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
                  {item.title ?? item.product_title ?? ""}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.variant_title && (
                    <span className="text-xs text-muted-foreground">
                      {item.variant_title}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    x{item.quantity}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col justify-center">
                {showDiscounted ? (
                  <>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatPrice(lineTotal, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground line-through tabular-nums">
                      {formatPrice(lineTotalOriginal, locale)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-foreground tabular-nums">
                    {formatPrice(lineTotalOriginal, locale)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex justify-between text-sm">
          <dt className="text-muted-foreground">{dict.cart.subtotal}</dt>
          <dd className="text-foreground tabular-nums">
            {formatPrice(itemsOriginalTotal, locale)}
          </dd>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">
              {dict.cart.subscriptionDiscount}
            </dt>
            <dd className="text-success font-medium tabular-nums">
              -{formatPrice(discountTotal, locale)}
            </dd>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <dt className="text-muted-foreground">{dict.cart.shipping}</dt>
          <dd className="text-foreground">
            {shippingIsFree ? (
              <span className="text-success font-medium">
                {dict.cart.freeShippingLabel}
              </span>
            ) : shippingCommitted ? (
              <span className="tabular-nums">
                {formatPrice(shippingTotal, locale)}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {dict.checkout.calculatedWhenDeliverySelected}
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <dt className="text-sm font-semibold text-foreground">
            {dict.cart.totalInclVat}
          </dt>
          <dd className="text-base font-bold text-primary tabular-nums">
            {formatPrice(effectiveTotal, locale)}
          </dd>
        </div>
        {effectiveTotal > 0 && vatTotalDisplay > 0 && (
          <div className="flex justify-between">
            <dt className="text-xs text-muted-foreground">
              {dict.checkout.vatIncludedBreakdown}
            </dt>
            <dd className="text-xs text-muted-foreground tabular-nums">
              {formatPrice(vatTotalDisplay, locale)}
            </dd>
          </div>
        )}
      </dl>

      {hasSubscriptionItems && (
        <p className="mt-3 rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
          <RotateCw className="inline h-3 w-3 mr-1 text-primary" />
          {dict.checkout.subscriptionNote}
        </p>
      )}
    </div>
  );
}
