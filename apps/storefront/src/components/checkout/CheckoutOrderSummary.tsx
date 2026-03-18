"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import { useCheckoutCart } from "@/contexts/CheckoutCartContext";
import { formatPrice } from "@/lib/format";
import {
  lineAmountForDisplay,
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
  const items = (cart?.items ?? []) as CartItem[];
  if (items.length === 0) return null;

  const c = cart as Record<string, unknown> | null | undefined;
  const num = (key: string, alt?: string) =>
    (c && (Number(c[key]) ?? Number(alt && c[alt]))) || 0;

  const originalItemTotal = num("original_item_total", "originalItemTotal");
  const discountTotalRaw = num("discount_total", "discountTotal");
  const subtotal = num("subtotal");
  const itemTaxTotal = num("item_tax_total", "itemTaxTotal");
  const itemTotalInclTaxRaw =
    originalItemTotal > 0 ? originalItemTotal : subtotal + itemTaxTotal;
  const displayItemTotalInclTax = lineAmountForDisplay(itemTotalInclTaxRaw);
  const discountTotal = lineAmountForDisplay(discountTotalRaw);
  /** Fragt inkl. moms (provider / Medusa i øre eller DKK). */
  const shippingCommitted = selectedShippingAmount != null && selectedShippingAmount > 0;
  const shippingTotal = shippingCommitted
    ? normalizeShippingForDisplay(selectedShippingAmount)
    : 0;
  /**
   * Total inkl. moms: varer (allerede inkl. moms) − rabat + fragt (inkl. moms).
   * cart.tax_total must NOT be added — it is the VAT portion already inside those amounts.
   */
  const itemsAfterDiscount = displayItemTotalInclTax - discountTotal;
  const effectiveTotal = shippingCommitted
    ? itemsAfterDiscount + shippingTotal
    : itemsAfterDiscount;
  /** Moms i alt (25% inkl.): andel af varer efter rabat + andel af fragt. */
  const vatTotalDisplay =
    Math.round(
      (itemsAfterDiscount * VAT_SHARE_OF_GROSS_25 +
        shippingTotal * VAT_SHARE_OF_GROSS_25) *
        100
    ) / 100;
  const shippingIsFree = shippingCommitted && shippingTotal === 0;

  const sumRawLineTotals = items.reduce((s, item) => {
    const q = item.quantity ?? 1;
    const raw =
      item.total ??
      item.original_total ??
      (item.unit_price ?? 0) * q;
    return s + lineAmountForDisplay(raw);
  }, 0);

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
          const cycle =
            typeof (item.metadata as Record<string, unknown> | undefined)
              ?.subscription_cycle === "number"
              ? (item.metadata as Record<string, unknown>)
                  .subscription_cycle as number
              : 0;
          const isSubscription = cycle > 0;
          const qty = item.quantity ?? 1;
          const ext = item as CartItem & {
            subtotal?: number;
            tax_total?: number;
            original_total?: number;
            discount_total?: number;
          };
          const lineTotalOriginal =
            ext.original_total ?? (item.unit_price ?? 0) * qty;
          const lineDiscount = ext.discount_total ?? 0;
          const lineRawDisplay = lineAmountForDisplay(
            item.total ?? ext.original_total ?? (item.unit_price ?? 0) * qty
          );
          const lineTotalInclBase =
            ext.subtotal != null && ext.tax_total != null
              ? lineAmountForDisplay(ext.subtotal + ext.tax_total)
              : sumRawLineTotals > 0
                ? Math.round(
                    (displayItemTotalInclTax * (lineRawDisplay / sumRawLineTotals)) *
                      100
                  ) / 100
                : lineRawDisplay;
          const lineTotal =
            lineDiscount > 0 && item.total != null
              ? sumRawLineTotals > 0
                ? Math.round(
                    (displayItemTotalInclTax *
                      (lineAmountForDisplay(item.total) / sumRawLineTotals)) *
                      100
                  ) / 100
                : lineAmountForDisplay(item.total)
              : lineTotalInclBase - lineAmountForDisplay(lineDiscount);

          return (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface border border-border">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title ?? ""}
                    className="h-full w-full object-cover"
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
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {formatPrice(lineTotal, locale)}
                </p>
                {isSubscription && lineDiscount > 0 && (
                  <p className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(lineAmountForDisplay(lineTotalOriginal), locale)}
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
            {formatPrice(displayItemTotalInclTax, locale)}
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
                {locale === "da"
                  ? "Beregnes ved valg af levering"
                  : "Calculated when delivery method is selected"}
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
              {locale === "da" ? "Heraf moms (25%)" : "VAT included (25%)"}
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
