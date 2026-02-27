import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutWithStripe } from "@/components/CheckoutWithStripe";
import { getCart, getCartId } from "@/lib/cart";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Betaling" : "Checkout",
    robots: { index: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const cart = await getCart();
  const cartId = await getCartId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (cart?.items ?? []) as any[];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping_total ?? 0;
  const total = cart?.total ?? 0;

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
            <CheckoutWithStripe
              locale={locale}
              dict={{ checkout: dict.checkout }}
              confirmationHref={`/${locale}/order-confirmation/placeholder`}
              cartId={cartId}
            />
          </div>

          {/* Order summary sidebar */}
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <div className="sticky top-8 rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="text-lg font-semibold text-foreground">{dict.cart.summary}</h2>

              <ul className="mt-4 divide-y divide-border">
                {items.map((item: { id: string; title: string; variant_title?: string; thumbnail?: string; quantity: number; total: number }) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.thumbnail ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      {item.variant_title && (
                        <p className="text-sm text-muted-foreground">{item.variant_title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{formatPrice(item.total)}</p>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">{dict.cart.subtotal}</dt>
                  <dd className="text-sm font-medium text-foreground">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">{dict.cart.shipping}</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {shipping === 0 ? dict.checkout.freeLabel : formatPrice(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="font-medium text-foreground">{dict.cart.total}</dt>
                  <dd className="font-medium text-foreground">{formatPrice(total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
