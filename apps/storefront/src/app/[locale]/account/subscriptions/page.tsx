import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { AccountSubscriptionsClient } from "@/components/account/AccountSubscriptionsClient";

interface SubscriptionsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SubscriptionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Mine abonnementer" : "My Subscriptions",
    robots: { index: false },
  };
}

export default async function SubscriptionsPage({ params }: SubscriptionsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return (
    <AccountSubscriptionsClient
      locale={locale}
      accountTitle={dict.account.title}
      subscriptionsTitle={dict.account.subscriptions}
      renewalLabel={
        dict.account.orderRenewalLabel ??
        (locale === "da" ? "Abonnementsfornyelse" : "Subscription renewal")
      }
      backLabel={dict.auth.backLink ?? (locale === "da" ? "Tilbage" : "Back")}
      orderDetailLabels={{
        summary: dict.orderConfirmation.summary,
        items: dict.orderConfirmation.items,
        subtotal: dict.orderConfirmation.subtotal,
        shipping: dict.orderConfirmation.shipping,
        total: dict.orderConfirmation.total,
        freeShipping: dict.orderConfirmation.freeShipping,
      }}
      dict={{
        skipNext: dict.subscriptionDetail.skipNext,
        pause: dict.subscriptionDetail.pause,
        resume: dict.subscriptionDetail.resume,
        cancel: dict.subscriptionDetail.cancel,
        viewDetails: dict.subscriptionDetail.viewDetails,
        cancelConfirm: dict.subscriptionDetail.cancelConfirm,
        cancelConfirmTitle: dict.subscriptionDetail.cancelConfirmTitle,
        cancelAfter: dict.subscriptionDetail.cancelAfter,
        cancelKeepButton: dict.subscriptionDetail.cancelKeepButton,
        cancelSubmitButton: dict.subscriptionDetail.cancelSubmitButton,
        cancelLoadingLabel: dict.subscriptionDetail.cancelLoadingLabel,
        cancelSuccessTitle: dict.subscriptionDetail.cancelSuccessTitle,
        cancelSuccessBody: dict.subscriptionDetail.cancelSuccessBody,
        cancelCloseButton: dict.subscriptionDetail.cancelCloseButton,
        cancelTryAgain: dict.subscriptionDetail.cancelTryAgain,
        subscriptionLinesTitle: dict.subscriptionDetail.subscriptionLinesTitle,
        orderHistoryTitle: dict.subscriptionDetail.orderHistoryTitle,
        discountIncluded: dict.subscriptionDetail.discountIncluded,
        openOrderHistory: dict.subscriptionDetail.openOrderHistory,
      }}
    />
  );
}
