import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckoutWithStripe } from "@/components/CheckoutWithStripe";
import { CheckoutAuthGate } from "@/components/checkout/CheckoutAuthGate";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutCartProvider } from "@/contexts/CheckoutCartContext";
import { getCart } from "@/lib/cart-data";
import { cartHasSubscriptionItems } from "@/lib/cart-utils";
import type { CartItem } from "@/components/cart/CartItems";
import type { StoreCart } from "@/lib/cart-data";
import { ShoppingBag } from "lucide-react";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Kassen" : "Checkout",
    robots: { index: false },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const cart = await getCart();
  const cartId = cart?.id ?? null;
  const items = (cart?.items ?? []) as CartItem[];
  const hasSubscriptionItems = cartHasSubscriptionItems(cart);
  const c = cart as StoreCart | null;
  const itemCount = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  return (
    <div className="min-h-screen bg-surface/50">
      {/* Minimal checkout header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="section-container flex h-14 items-center justify-between">
          <div id="checkout-back-btn" className="w-20" />

          <Link href={`/${locale}`} aria-label="Guapo – forside">
            <img
              src="/logos/GUAPO_default.svg"
              alt="Guapo"
              className="h-5 w-auto"
              width={856}
              height={176}
            />
          </Link>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-20 justify-end">
            <ShoppingBag className="h-4 w-4" />
            <span className="tabular-nums">{itemCount}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <CheckoutCartProvider initialCart={c}>
          <CheckoutAuthGate locale={locale} hasSubscriptionItems={hasSubscriptionItems} authLabels={dict.auth}>
            <CheckoutWithStripe
              locale={locale}
              dict={dict}
              confirmationHref={`/${locale}/order-confirmation/placeholder`}
              cartId={cartId}
              hasSubscriptionItems={hasSubscriptionItems}
              items={items}
            />
          </CheckoutAuthGate>

          {items.length > 0 && (
            <CheckoutOrderSummary
              locale={locale}
              dict={dict}
              hasSubscriptionItems={hasSubscriptionItems}
            />
          )}
        </CheckoutCartProvider>
      </main>
    </div>
  );
}
