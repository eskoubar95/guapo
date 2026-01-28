import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Indkøbskurv" : "Shopping Cart",
    robots: { index: false }, // Don't index cart page
  };
}

// Placeholder cart items (will come from Medusa)
const cartItems = [
  {
    id: "1",
    title: "Gentle Cleanser",
    variant: "150ml",
    price: 18900,
    quantity: 1,
    image: null,
    subscription: null,
  },
  {
    id: "2",
    title: "Niacinamide Serum",
    variant: "30ml",
    price: 23655, // 24900 * 0.95 (subscription price)
    quantity: 1,
    image: null,
    subscription: { cycle: 8 },
  },
];

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {dict.cart.title}
        </h1>

        {cartItems.length > 0 ? (
          <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-12">
            {/* Cart items */}
            <div className="lg:col-span-7">
              <ul className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex gap-4 py-6">
                    <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-gray-100" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">{item.variant}</p>
                          {item.subscription && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              {locale === "da" ? "Abonnement" : "Subscription"} - {item.subscription.cycle}{" "}
                              {locale === "da" ? "uger" : "weeks"}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{formatPrice(item.price)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button className="rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50">
                            -
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button className="rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50">
                            +
                          </button>
                        </div>
                        <button className="text-sm text-gray-500 hover:text-gray-900">
                          {locale === "da" ? "Fjern" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Order summary */}
            <div className="mt-8 lg:col-span-5 lg:mt-0">
              <div className="rounded-lg bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900">{dict.cart.summary}</h2>
                
                <dl className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">{dict.cart.subtotal}</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">{dict.cart.shipping}</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {shipping === 0 ? (locale === "da" ? "Gratis" : "Free") : formatPrice(shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{dict.cart.total}</dt>
                    <dd className="font-medium text-gray-900">{formatPrice(total)}</dd>
                  </div>
                </dl>

                <Link
                  href={`/${locale}/checkout`}
                  className="mt-6 block w-full rounded-full bg-gray-900 px-8 py-4 text-center text-sm font-medium text-white hover:bg-gray-800"
                >
                  {dict.cart.checkout}
                </Link>

                <p className="mt-4 text-center text-xs text-gray-500">
                  {locale === "da"
                    ? "Gratis levering på alle ordrer over 399 DKK"
                    : "Free shipping on all orders over 399 DKK"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-500">{dict.cart.empty}</p>
            <Link
              href={`/${locale}/categories`}
              className="mt-4 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              {locale === "da" ? "Gå til butikken" : "Go to shop"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
