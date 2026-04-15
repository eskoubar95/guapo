import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { getCustomerOrder } from "@/lib/orders";
import { OrderConfirmationContent } from "../OrderConfirmationContent";

interface OrderConfirmationPageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export async function generateMetadata({
  params,
}: OrderConfirmationPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Ordre bekræftet" : "Order confirmed",
    robots: { index: false },
  };
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { locale, orderId } = await params;
  const dict = await getDictionary(locale as Locale);

  const initialOrder = await getCustomerOrder(orderId);
  const oc = dict.orderConfirmation;

  return (
    <div className="min-h-full bg-muted/30">
      <main className="section-container py-10 sm:py-14">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {oc.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{oc.subtitle}</p>
        </div>

        <OrderConfirmationContent
          orderId={orderId}
          locale={locale}
          dict={dict}
          initialOrder={initialOrder}
        />
      </main>
    </div>
  );
}
