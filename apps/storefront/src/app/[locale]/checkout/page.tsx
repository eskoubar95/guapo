import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/CheckoutSteps";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Betaling" : "Checkout",
    robots: { index: false }, // Don't index checkout page
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const orderSummary = {
    items: 2,
    subtotal: 426,
    shipping: 0,
    total: 426,
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-full">
      <main className="container mx-auto px-4 py-8">
        <Link
          href={`/${locale}/cart`}
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-primary"
        >
          ← {dict.checkout.backToCart}
        </Link>
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h1 className="text-2xl font-bold text-foreground">{dict.checkout.title}</h1>
            <CheckoutSteps
              locale={locale}
              dict={{ checkout: dict.checkout }}
              confirmationHref={`/${locale}/order-confirmation/placeholder`}
            />
          </div>

          {/* Order summary sidebar */}
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <div className="sticky top-8 rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="text-lg font-semibold text-foreground">{dict.cart.summary}</h2>

              <ul className="mt-4 divide-y divide-border">
                <li className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-lg bg-muted" />
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-foreground">Gentle Cleanser</p>
                    <p className="text-sm text-muted-foreground">150ml</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">{formatPrice(189)}</p>
                </li>
                <li className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-lg bg-muted" />
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-foreground">Niacinamide Serum</p>
                    <p className="text-sm text-muted-foreground">30ml</p>
                    <span className="mt-1 inline-flex w-fit rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      {locale === "da" ? "Abonnement" : "Subscription"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{formatPrice(237)}</p>
                </li>
              </ul>

              <dl className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">{dict.cart.subtotal}</dt>
                  <dd className="text-sm font-medium text-foreground">{formatPrice(orderSummary.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">{dict.cart.shipping}</dt>
                  <dd className="text-sm font-medium text-foreground">{dict.checkout.freeLabel}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="font-medium text-foreground">{dict.cart.total}</dt>
                  <dd className="font-medium text-foreground">{formatPrice(orderSummary.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
