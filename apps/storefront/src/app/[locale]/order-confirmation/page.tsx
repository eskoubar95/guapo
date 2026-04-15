import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { OrderConfirmationComplete } from "./OrderConfirmationComplete";

interface OrderConfirmationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cart_id?: string }>;
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
  searchParams,
}: OrderConfirmationPageProps) {
  const { locale } = await params;
  const { cart_id } = await searchParams;
  const dict = await getDictionary(locale as Locale);

  return (
    <OrderConfirmationComplete
      locale={locale}
      cartId={cart_id}
      dict={dict.orderConfirmation}
    />
  );
}
