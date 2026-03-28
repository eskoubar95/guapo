import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { AccountOrdersClient } from "@/components/account/AccountOrdersClient";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mine ordrer" : "My Orders",
    robots: { index: false },
  };
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return (
    <AccountOrdersClient
      locale={locale}
      accountTitle={dict.account.title}
      ordersTitle={dict.account.orders}
      renewalLabel={dict.account.orderRenewalLabel}
      orderDetailLabels={{
        summary: dict.orderConfirmation.summary,
        items: dict.orderConfirmation.items,
        subtotal: dict.orderConfirmation.subtotal,
        shipping: dict.orderConfirmation.shipping,
        total: dict.orderConfirmation.total,
        freeShipping: dict.orderConfirmation.freeShipping,
      }}
    />
  );
}
