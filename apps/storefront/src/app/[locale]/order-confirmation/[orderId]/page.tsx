import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
interface OrderConfirmationPageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export async function generateMetadata({ params }: OrderConfirmationPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Ordre bekræftet" : "Order confirmed",
    robots: { index: false },
  };
}

// Placeholder: will be replaced by Medusa order fetch
function getOrderById(orderId: string) {
  return {
    id: orderId,
    date: new Date().toISOString().slice(0, 10),
    status: "confirmed",
    subtotal: 42555,
    shipping: 0,
    total: 42555,
    items: [
      { title: "Gentle Cleanser", quantity: 1, unitPrice: 18900 },
      { title: "Niacinamide Serum", quantity: 1, unitPrice: 23655, isSubscription: true },
    ],
  };
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { locale, orderId } = await params;
  const dict = await getDictionary(locale as Locale);

  const order = getOrderById(orderId);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {dict.orderConfirmation.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{dict.orderConfirmation.subtitle}</p>

          <p className="mt-6 text-sm font-medium text-foreground">
            {dict.orderConfirmation.orderNumber}: <span className="font-mono">{order.id}</span>
          </p>

          {/* Order summary */}
          <div className="mt-8 text-left">
            <h2 className="text-lg font-semibold text-foreground">
              {dict.orderConfirmation.summary}
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between py-3">
                  <span className="text-sm text-foreground">
                    {item.quantity}× {item.title}
                    {item.isSubscription && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({locale === "da" ? "Abonnement" : "Subscription"})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{dict.orderConfirmation.subtotal}</dt>
                <dd className="font-medium text-foreground">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{dict.orderConfirmation.shipping}</dt>
                <dd className="font-medium text-foreground">
                  {order.shipping === 0
                    ? locale === "da"
                      ? "Gratis"
                      : "Free"
                    : formatPrice(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-medium">
                <dt className="text-foreground">{dict.orderConfirmation.total}</dt>
                <dd className="text-foreground">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/account/orders`}
              className="inline-flex justify-center rounded-full border border-input bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {dict.orderConfirmation.viewOrder}
            </Link>
            <Link
              href={`/${locale}/categories`}
              className="inline-flex justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {dict.orderConfirmation.continueShopping}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
