import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { CartDiscountCode } from "@/components/CartDiscountCode";
import { getCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { CartItems } from "@/components/cart/CartItems";
import type { CartItem } from "@/components/cart/CartItems";

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

  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping_total ?? 0;
  const total = cart?.total ?? 0;

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{dict.cart.title}</h1>

        {items.length > 0 ? (
          <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <CartItems items={items} locale={locale} dict={dict} />

              <section className="mt-10 border-t border-border pt-8">
                <h2 className="text-lg font-semibold text-foreground">{dict.cart.continueShoppingTitle}</h2>
                <div className="mt-4">
                  <Link
                    href={`/${locale}/categories`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {locale === "da" ? "Se alle produkter →" : "Browse all products →"}
                  </Link>
                </div>
              </section>
            </div>
            <div className="mt-8 lg:col-span-5 lg:mt-0">
              <Card className="border-border bg-surface">
                <CardContent className="p-6">
                  <CartDiscountCode
                    label={dict.cart.discountCodeLabel}
                    placeholder={dict.cart.discountCodePlaceholder}
                    applyLabel={dict.cart.apply}
                    appliedLabel={dict.cart.discountApplied}
                    className="mb-4"
                  />
                  <h2 className="text-lg font-semibold text-foreground">{dict.cart.summary}</h2>
                  <dl className="mt-6 space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{dict.cart.subtotal}</dt>
                      <dd className="text-sm font-medium text-foreground">{formatPrice(subtotal, locale)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">{dict.cart.shipping}</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {shipping === 0 ? (locale === "da" ? "Beregnes" : "Calculated at checkout") : formatPrice(shipping, locale)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-4">
                      <dt className="font-medium text-foreground">{dict.cart.total}</dt>
                      <dd className="font-medium text-foreground">{formatPrice(total, locale)}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/${locale}/checkout`}
                    className="mt-6 block w-full rounded-lg bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
                  >
                    {dict.cart.checkout}
                  </Link>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    {locale === "da" ? "Gratis levering på alle ordrer over 399 DKK" : "Free shipping on all orders over 399 DKK"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">{dict.cart.empty}</p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
            >
              {locale === "da" ? "Gå til butikken" : "Go to shop"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
