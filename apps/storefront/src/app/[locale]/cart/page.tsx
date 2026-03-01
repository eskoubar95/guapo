import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { CartDiscountCode } from "@/components/CartDiscountCode";
import { getCart } from "@/lib/cart";
import { cartHasSubscriptionItems } from "@/lib/cart-utils";
import { formatPrice } from "@/lib/format";
import { CartItems } from "@/components/cart/CartItems";
import { CartCheckoutGate } from "@/components/cart/CartCheckoutGate";
import type { CartItem } from "@/components/cart/CartItems";

const SUBSCRIPTION_DISCOUNT_PERCENT = 20;

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Indkøbskurv" : "Shopping Cart",
    robots: { index: false },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const cart = await getCart();

  const items = (cart?.items ?? []) as CartItem[];
  const hasSubscriptionItems = cartHasSubscriptionItems(cart);

  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping_total ?? 0;
  const total = cart?.total ?? subtotal + shipping;

  const subscriptionDiscountAmount = items.reduce((sum, item) => {
    const cycle = typeof (item.metadata as Record<string, unknown> | undefined)?.subscription_cycle === "number"
      ? (item.metadata as Record<string, unknown>).subscription_cycle as number
      : 0;
    if (cycle === 0) return sum;
    const unitPrice = item.unit_price ?? 0;
    const qty = item.quantity ?? 1;
    return sum + (unitPrice * qty * SUBSCRIPTION_DISCOUNT_PERCENT) / 100;
  }, 0);

  const displayTotal = Math.max(0, total - subscriptionDiscountAmount);

  return (
    <div className="min-h-full bg-muted/40">
      <main className="container mx-auto px-4 py-6 lg:py-10">
        <h1 className="text-2xl lg:text-3xl font-semibold text-primary mb-6">
          {dict.cart.title}
        </h1>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8">
              <div className="bg-card rounded-lg border border-border p-4 lg:p-5">
                <h2 className="font-medium text-primary mb-4">
                  {dict.cart.products}
                </h2>
                <CartItems items={items} locale={locale} dict={dict} />
              </div>

              <section className="mt-8">
                <Link
                  href={`/${locale}/categories`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {locale === "da" ? "Se alle produkter →" : "Browse all products →"}
                </Link>
              </section>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-card rounded-lg border border-border p-5 lg:p-6 sticky top-24 space-y-4">
                <h2 className="font-medium text-primary">
                  {dict.cart.deliveryAndPickup}
                </h2>

                <CartDiscountCode
                  label={dict.cart.discountCodeLabel}
                  placeholder={dict.cart.discountCodePlaceholder}
                  applyLabel={dict.cart.apply}
                  appliedLabel={dict.cart.discountApplied}
                  className="pb-4 border-b border-border"
                />

                <div className="text-xs space-y-1.5 pb-4 border-b border-border text-muted-foreground">
                  <Link href={`/${locale}/faq`} className="block text-primary hover:underline">
                    {locale === "da" ? "Hvad koster forsendelse?" : "What does shipping cost?"}
                  </Link>
                  <Link href={`/${locale}/faq`} className="block text-primary hover:underline">
                    {locale === "da" ? "Kan jeg bruge rabatkode?" : "Can I use a discount code?"}
                  </Link>
                  <Link href={`/${locale}/faq`} className="block text-primary hover:underline">
                    {locale === "da" ? "Kan jeg hente i butik?" : "Can I pick up in store?"}
                  </Link>
                  <Link href={`/${locale}/faq`} className="block text-primary hover:underline">
                    {locale === "da" ? "Hvordan returnerer jeg?" : "How do I return items?"}
                  </Link>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-primary mb-3">
                    {dict.cart.overview}
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dict.cart.itemsTotal}</span>
                    <span className="text-foreground">{formatPrice(subtotal, locale)}</span>
                  </div>
                  {subscriptionDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{dict.cart.subscriptionDiscount}</span>
                      <span className="text-destructive font-medium">
                        -{formatPrice(subscriptionDiscountAmount, locale)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{dict.cart.shipping}</span>
                    <span className="text-foreground">
                      {shipping === 0 ? (
                        <span className="text-green-600 font-medium dark:text-green-400">
                          {dict.cart.freeShippingLabel}
                        </span>
                      ) : (
                        formatPrice(shipping, locale)
                      )}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">
                        {dict.cart.totalInclVat}
                      </span>
                      <span className="text-lg font-semibold text-primary">
                        {formatPrice(displayTotal, locale)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <CartCheckoutGate
                    locale={locale}
                    hasSubscriptionItems={hasSubscriptionItems}
                    checkoutLabel={dict.cart.checkout}
                    checkoutHref={`/${locale}/checkout`}
                    authLabels={dict.auth}
                  />
                  <Link
                    href={`/${locale}/categories`}
                    className="flex w-full items-center justify-center rounded-full border border-border bg-background px-8 py-4 text-sm font-medium text-foreground hover:bg-surface hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {dict.cart.continueShoppingButton}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">{dict.cart.empty}</p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {dict.cart.goToShop}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
