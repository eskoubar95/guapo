import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface PolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Returpolitik" : "Returns Policy",
  };
}

export default async function ReturnsPage({ params }: PolicyPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const content = locale === "da" ? {
    title: "Returpolitik",
    lastUpdated: "Sidst opdateret: 27. januar 2026",
    sections: [
      {
        title: "14 dages returret",
        content: "Du har 14 dages fortrydelsesret fra den dag, du modtager din ordre. Du kan returnere produkter uden at angive en grund.",
      },
      {
        title: "Returkrav",
        content: "Produkter skal returneres uåbnede og i original emballage. Af hygiejniske årsager kan åbnede produkter ikke returneres, medmindre de er defekte.",
      },
      {
        title: "Returfragt",
        content: "Du betaler selv for returfragt. Vi anbefaler at bruge en sporbar forsendelsesmetode.",
      },
      {
        title: "Refusion",
        content: "Vi refunderer beløbet inden for 14 dage efter vi har modtaget og godkendt returneringen. Refusionen sker til den oprindelige betalingsmetode.",
      },
      {
        title: "Defekte produkter",
        content: "Hvis du modtager et defekt produkt, kontakt os straks. Vi dækker returfragt og sender en erstatning eller refunderer fuldt ud.",
      },
      {
        title: "Abonnementer",
        content: "Abonnementsordrer følger samme returpolitik. Hvis du returnerer en abonnementslevering, vil dit abonnement automatisk pauseres.",
      },
    ],
  } : {
    title: "Returns Policy",
    lastUpdated: "Last updated: January 27, 2026",
    sections: [
      {
        title: "14-Day Return Policy",
        content: "You have 14 days from the day you receive your order to return items. You can return products without stating a reason.",
      },
      {
        title: "Return Requirements",
        content: "Products must be returned unopened and in original packaging. For hygiene reasons, opened products cannot be returned unless defective.",
      },
      {
        title: "Return Shipping",
        content: "You are responsible for return shipping costs. We recommend using a trackable shipping method.",
      },
      {
        title: "Refunds",
        content: "We will refund the amount within 14 days after receiving and approving the return. Refunds are issued to the original payment method.",
      },
      {
        title: "Defective Products",
        content: "If you receive a defective product, contact us immediately. We will cover return shipping and send a replacement or issue a full refund.",
      },
      {
        title: "Subscriptions",
        content: "Subscription orders follow the same return policy. If you return a subscription delivery, your subscription will be automatically paused.",
      },
    ],
  };

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.lastUpdated}</p>
        <div className="mt-12 space-y-8">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 text-muted-foreground">{section.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
