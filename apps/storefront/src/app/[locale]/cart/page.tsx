import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { CartDiscountCode } from "@/components/CartDiscountCode";
import { getCart } from "@/lib/cart-data";
import { cartHasSubscriptionItems } from "@/lib/cart-utils";
import { formatPrice } from "@/lib/format";
import { CartItems } from "@/components/cart/CartItems";
import { CartCheckoutGate } from "@/components/cart/CartCheckoutGate";
import { CartMobileDrawer } from "@/components/cart/CartMobileDrawer";
import type { CartItem } from "@/components/cart/CartItems";
import type { StoreCart } from "@/lib/cart-data";
import { lineAmountForDisplay } from "@/lib/cart-display";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Din indkøbskurv" : "Your Shopping Cart",
    robots: { index: false },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const cart = await getCart();

  const items = (cart?.items ?? []) as CartItem[];
  const hasSubscriptionItems = cartHasSubscriptionItems(cart);

  const c = cart as StoreCart | null;
  const originalItemTotal = c?.original_item_total ?? 0;
  const shippingTotal = c?.shipping_total ?? 0;
  const taxTotal = c?.tax_total ?? 0;
  const discountTotal = c?.discount_total ?? 0;
  const total = c?.total ?? 0;

  const itemTotalInclTax = originalItemTotal > 0
    ? originalItemTotal
    : (c?.subtotal ?? 0) + (c?.item_tax_total ?? 0);

  const itemCount = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  const displayItemTotal = lineAmountForDisplay(itemTotalInclTax);
  const displayDiscount = lineAmountForDisplay(discountTotal);
  // In cart no shipping method is chosen yet – total is items only; shipping is shown as "Beregnes ved kassen".
  const displayTotal = displayItemTotal - displayDiscount;
  const displayTax = Math.round((displayTotal - displayTotal / 1.25) * 100) / 100;

  return (
    <div className="min-h-full bg-surface/50">
      <main className="section-container py-6 lg:py-10">
        {/* Page heading — section-heading size, not full H1 */}
        <div className="mb-6 lg:mb-8">
          <h1 className="section-heading text-primary">
            {locale === "da" ? "Din indkøbskurv" : "Your Shopping Cart"}
          </h1>
          {items.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {itemCount} {locale === "da" ? (itemCount === 1 ? "vare" : "varer") : (itemCount === 1 ? "item" : "items")}
            </p>
          )}
        </div>

        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Products column */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
                      {dict.cart.products}
                    </h2>
                    <CartCheckoutGate
                      locale={locale}
                      hasSubscriptionItems={hasSubscriptionItems}
                      checkoutLabel={dict.cart.checkout}
                      checkoutHref={`/${locale}/checkout`}
                      authLabels={dict.auth}
                      compact
                    />
                  </div>
                  <div className="px-4 pt-2 pb-3 sm:px-5">
                    <CartItems
                      items={items}
                      locale={locale}
                      dict={dict}
                      itemTotalInclTaxDisplay={displayItemTotal}
                    />
                  </div>
                </div>

                {/* Discount code — own card below products */}
                <div className="bg-card rounded-lg border border-border p-4 sm:p-5 mt-4">
                  <CartDiscountCode
                    label={dict.cart.discountCodeLabel}
                    placeholder={dict.cart.discountCodePlaceholder}
                    applyLabel={dict.cart.apply}
                    appliedLabel={dict.cart.discountApplied}
                  />
                </div>
              </div>

              {/* Sidebar — hidden on mobile, shown via CartMobileDrawer instead */}
              <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
                <div className="bg-card rounded-lg border border-border sticky top-24">
                  <div className="p-4 sm:p-5 space-y-2">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
                      {dict.cart.overview}
                    </h3>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{dict.cart.itemsTotal}</span>
                        <span className="text-foreground tabular-nums">{formatPrice(displayItemTotal, locale)}</span>
                      </div>

                      {discountTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{dict.cart.subscriptionDiscount}</span>
                          <span className="text-success font-medium tabular-nums">
                            -{formatPrice(displayDiscount, locale)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{dict.cart.shipping}</span>
                        <span className="text-muted-foreground text-xs">
                          {locale === "da" ? "Beregnes ved kassen" : "Calculated at checkout"}
                        </span>
                      </div>

                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-semibold text-foreground">
                            {dict.cart.totalInclVat}
                          </span>
                          <span className="text-lg font-bold text-primary tabular-nums">
                            {formatPrice(displayTotal, locale)}
                          </span>
                        </div>
                        {displayTax > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{locale === "da" ? "Heraf moms (25%)" : "Incl. VAT (25%)"}</span>
                            <span className="tabular-nums">{formatPrice(displayTax, locale)}</span>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* Sidebar CTA */}
                  <div className="p-4 sm:p-5 border-t border-border space-y-2">
                    <CartCheckoutGate
                      locale={locale}
                      hasSubscriptionItems={hasSubscriptionItems}
                      checkoutLabel={dict.cart.checkout}
                      checkoutHref={`/${locale}/checkout`}
                      authLabels={dict.auth}
                    />
                    <Link
                      href={`/${locale}/categories`}
                      className="flex w-full items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-surface hover:border-primary/40 transition-colors"
                    >
                      {dict.cart.continueShoppingButton}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile bottom-sheet drawer — replaces static sticky bar */}
            <CartMobileDrawer
              locale={locale}
              total={displayTotal}
              itemTotalInclTax={displayItemTotal}
              discountTotal={displayDiscount}
              shippingTotal={0}
              taxTotal={displayTax}
              qualifiesForFreeShipping={false}
              hasShippingMethod={false}
              hasSubscriptionItems={hasSubscriptionItems}
              checkoutHref={`/${locale}/checkout`}
              continueShoppingHref={`/${locale}/categories`}
              authLabels={dict.auth}
              labels={{
                checkout: dict.cart.checkout,
                continueShopping: dict.cart.continueShoppingButton,
                overview: dict.cart.overview,
                itemsTotal: dict.cart.itemsTotal,
                subscriptionDiscount: dict.cart.subscriptionDiscount,
                shipping: dict.cart.shipping,
                freeShippingLabel: dict.cart.freeShippingLabel,
                totalInclVat: dict.cart.totalInclVat,
              }}
            />
          </>
        
        ) : (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">{dict.cart.empty}</p>
            <Link
              href={`/${locale}/categories`}
              className="mt-6 inline-flex rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              {dict.cart.goToShop}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
