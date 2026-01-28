import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

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

// Checkout flow steps
type CheckoutStep = "contact" | "shipping" | "payment";

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  // Placeholder order summary (will come from Medusa cart)
  const orderSummary = {
    items: 2,
    subtotal: 42555, // 189 + 249 * 0.95 (subscription)
    shipping: 0,
    total: 42555,
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
            <Link href={`/${locale}/cart`} className="text-sm text-gray-600 hover:text-gray-900">
              {locale === "da" ? "← Tilbage til kurv" : "← Back to cart"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Checkout form */}
          <div className="lg:col-span-7">
            <h1 className="text-2xl font-bold text-gray-900">{dict.checkout.title}</h1>

            {/* Progress steps */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-gray-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                  1
                </span>
                {dict.checkout.contact}
              </span>
              <span className="h-px flex-1 bg-gray-200" />
              <span className="flex items-center gap-2 text-gray-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">
                  2
                </span>
                {dict.checkout.shipping}
              </span>
              <span className="h-px flex-1 bg-gray-200" />
              <span className="flex items-center gap-2 text-gray-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs">
                  3
                </span>
                {dict.checkout.payment}
              </span>
            </div>

            {/* Contact information */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">{dict.checkout.contact}</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Email" : "Email"}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="marketing" className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="marketing" className="text-sm text-gray-600">
                    {locale === "da"
                      ? "Modtag nyheder og tilbud på email"
                      : "Receive news and offers by email"}
                  </label>
                </div>
              </div>
            </section>

            {/* Shipping address */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">
                {locale === "da" ? "Leveringsadresse" : "Shipping Address"}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Fornavn" : "First name"}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Efternavn" : "Last name"}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Adresse" : "Address"}
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Postnummer" : "Postal code"}
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "By" : "City"}
                  </label>
                  <input
                    type="text"
                    id="city"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {locale === "da" ? "Telefon" : "Phone"}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3"
                    placeholder="+45"
                  />
                </div>
              </div>
            </section>

            {/* Shipping method */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">
                {locale === "da" ? "Leveringsmetode" : "Shipping Method"}
              </h2>
              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-900 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" defaultChecked className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === "da" ? "Standardlevering" : "Standard Delivery"}
                      </p>
                      <p className="text-sm text-gray-500">2-4 {locale === "da" ? "hverdage" : "business days"}</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">
                    {locale === "da" ? "Gratis" : "Free"}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === "da" ? "Ekspreslevering" : "Express Delivery"}
                      </p>
                      <p className="text-sm text-gray-500">1-2 {locale === "da" ? "hverdage" : "business days"}</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">49 DKK</span>
                </label>
              </div>
            </section>

            {/* Payment (placeholder for Adyen) */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">{dict.checkout.payment}</h2>
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-500">
                  {locale === "da"
                    ? "Adyen betalingsmodul integreres her"
                    : "Adyen payment module will be integrated here"}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  {locale === "da"
                    ? "Understøtter kort, MobilePay, Apple Pay, Google Pay"
                    : "Supports cards, MobilePay, Apple Pay, Google Pay"}
                </p>
              </div>
            </section>

            {/* Continue button */}
            <button className="mt-8 w-full rounded-full bg-gray-900 px-8 py-4 text-sm font-medium text-white hover:bg-gray-800">
              {locale === "da" ? "Fortsæt til betaling" : "Continue to payment"}
            </button>
          </div>

          {/* Order summary sidebar */}
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <div className="sticky top-8 rounded-lg bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900">{dict.cart.summary}</h2>

              {/* Cart items preview */}
              <ul className="mt-4 divide-y divide-gray-200">
                <li className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200">
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                      1
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-gray-900">Gentle Cleanser</p>
                    <p className="text-sm text-gray-500">150ml</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(18900)}</p>
                </li>
                <li className="flex gap-4 py-4">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200">
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                      1
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-gray-900">Niacinamide Serum</p>
                    <p className="text-sm text-gray-500">30ml</p>
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      {locale === "da" ? "Abonnement" : "Subscription"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(23655)}</p>
                </li>
              </ul>

              <dl className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">{dict.cart.subtotal}</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatPrice(orderSummary.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">{dict.cart.shipping}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {locale === "da" ? "Gratis" : "Free"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <dt className="font-medium text-gray-900">{dict.cart.total}</dt>
                  <dd className="font-medium text-gray-900">{formatPrice(orderSummary.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
