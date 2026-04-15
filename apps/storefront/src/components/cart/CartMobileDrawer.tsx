"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trackCartViewed } from "@/lib/analytics/posthog-ecommerce";
import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { CartCheckoutGate } from "@/components/cart/CartCheckoutGate";
import type { AuthModalLabels } from "@/components/auth/AuthModal";

interface CartMobileDrawerProps {
  locale: string;
  total: number;
  /** Line-item quantity sum (for analytics when drawer opens) */
  lineItemCount?: number;
  itemTotalInclTax: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  qualifiesForFreeShipping: boolean;
  hasShippingMethod: boolean;
  hasSubscriptionItems: boolean;
  checkoutHref: string;
  continueShoppingHref: string;
  authLabels: AuthModalLabels;
  labels: {
    checkout: string;
    continueShopping: string;
    overview: string;
    itemsTotal: string;
    subscriptionDiscount: string;
    shipping: string;
    freeShippingLabel: string;
    totalInclVat: string;
  };
}

export function CartMobileDrawer({
  locale,
  total,
  lineItemCount = 0,
  itemTotalInclTax,
  discountTotal,
  shippingTotal,
  taxTotal,
  qualifiesForFreeShipping,
  hasShippingMethod,
  hasSubscriptionItems,
  checkoutHref,
  continueShoppingHref,
  authLabels,
  labels,
}: CartMobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerOpenTrackedRef = useRef(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      drawerOpenTrackedRef.current = false;
      return;
    }
    document.body.style.overflow = "hidden";
    if (lineItemCount >= 1 && !drawerOpenTrackedRef.current) {
      drawerOpenTrackedRef.current = true;
      trackCartViewed({
        surface: "mobile_drawer",
        item_count: lineItemCount,
        cart_value: total,
      });
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, lineItemCount, total]);

  return (
    <div className="lg:hidden">
      {/* Collapsed sticky bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 section-container">
          {/* Price */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-primary tabular-nums">
              {formatPrice(total, locale)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {locale === "da" ? "Inkl. moms" : "Incl. VAT"}
            </p>
          </div>

          {/* Chevron toggle */}
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background hover:bg-surface transition-colors"
            aria-label={locale === "da" ? "Se oversigt" : "View summary"}
            aria-expanded={isOpen}
          >
            <ChevronUp
              className={`h-4 w-4 text-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* CTA */}
          <CartCheckoutGate
            locale={locale}
            hasSubscriptionItems={hasSubscriptionItems}
            checkoutLabel={labels.checkout}
            checkoutHref={checkoutHref}
            authLabels={authLabels}
            compact
          />
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Drawer panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-drawer-up">
          <div className="bg-card rounded-t-2xl border-t border-border shadow-2xl max-h-[70vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <button
                type="button"
                onClick={close}
                className="w-10 h-1 rounded-full bg-border"
                aria-label={locale === "da" ? "Luk oversigt" : "Close summary"}
              />
            </div>

            {/* Summary content */}
            <div className="px-5 pb-2 space-y-2">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                {labels.overview}
              </h3>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labels.itemsTotal}</span>
                <span className="text-foreground tabular-nums">{formatPrice(itemTotalInclTax, locale)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{labels.subscriptionDiscount}</span>
                  <span className="text-success font-medium tabular-nums">
                    -{formatPrice(discountTotal, locale)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labels.shipping}</span>
                <span className="text-foreground">
                  {qualifiesForFreeShipping ? (
                    <span className="text-success font-medium">{labels.freeShippingLabel}</span>
                  ) : hasShippingMethod && shippingTotal > 0 ? (
                    <span className="tabular-nums">{formatPrice(shippingTotal, locale)}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {locale === "da" ? "Beregnes ved kassen" : "Calculated at checkout"}
                    </span>
                  )}
                </span>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">{labels.totalInclVat}</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatPrice(total, locale)}
                  </span>
                </div>
                {taxTotal > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{locale === "da" ? "Heraf moms (25%)" : "Incl. VAT (25%)"}</span>
                    <span className="tabular-nums">{formatPrice(taxTotal, locale)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pt-3 pb-6 space-y-2 border-t border-border mt-3">
              <CartCheckoutGate
                locale={locale}
                hasSubscriptionItems={hasSubscriptionItems}
                checkoutLabel={labels.checkout}
                checkoutHref={checkoutHref}
                authLabels={authLabels}
              />
              <Link
                href={continueShoppingHref}
                className="flex w-full items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-surface hover:border-primary/40 transition-colors"
              >
                {labels.continueShopping}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Spacer so sticky bar doesn't cover content */}
      <div className="h-[68px]" />
    </div>
  );
}
