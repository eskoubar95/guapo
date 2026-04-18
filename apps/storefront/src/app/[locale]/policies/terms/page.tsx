import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";
import { isCheckoutKlarnaEnabled } from "@/lib/checkout-klarna-flag";

interface PolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Handelsbetingelser" : "Terms of Service",
  };
}

export default async function TermsPage({ params }: PolicyPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const klarnaEnabled = isCheckoutKlarnaEnabled();

  const content = locale === "da" ? {
    title: "Handelsbetingelser",
    lastUpdated: "Sidst opdateret: 27. januar 2026",
    sections: [
      {
        title: "1. Generelt",
        content: "Disse handelsbetingelser gælder for alle køb foretaget på guapo.dk. Ved at handle hos os accepterer du disse betingelser.",
      },
      {
        title: "2. Priser",
        content: "Alle priser er angivet i danske kroner (DKK) og inkluderer moms. Vi forbeholder os ret til at ændre priser uden varsel.",
      },
      {
        title: "3. Betaling",
        content: klarnaEnabled
          ? "Vi accepterer betaling med kreditkort (Visa, Mastercard), MobilePay og Klarna."
          : "Vi accepterer betaling med kreditkort (Visa, Mastercard) og MobilePay.",
      },
      {
        title: "4. Levering",
        content: "Vi leverer til pakkeshops i Danmark via GLS og DAO. Standardlevering koster 39 DKK og tager normalt 1-3 hverdage.",
      },
      {
        title: "5. Returret",
        content: "Du har 14 dages returret fra modtagelse af din ordre. Produkter skal returneres uåbnede og i original emballage. Du betaler selv for returfragt.",
      },
      {
        title: "6. Abonnementer",
        content: "Abonnementer fornyes automatisk med den valgte frekvens (4, 8 eller 12 uger). Du kan pause, skippe eller annullere dit abonnement via din konto efter minimum 2 leveringer.",
      },
      {
        title: "7. Reklamationsret",
        content: "Du har 2 års reklamationsret fra købsdatoen i henhold til dansk lovgivning. Kontakt os inden for rimelig tid efter du opdager en fejl.",
      },
    ],
  } : {
    title: "Terms of Service",
    lastUpdated: "Last updated: January 27, 2026",
    sections: [
      {
        title: "1. General",
        content: "These terms of service apply to all purchases made on guapo.dk. By shopping with us, you accept these terms.",
      },
      {
        title: "2. Prices",
        content: "All prices are stated in Danish kroner (DKK) and include VAT. We reserve the right to change prices without notice.",
      },
      {
        title: "3. Payment",
        content: klarnaEnabled
          ? "We accept payment by credit card (Visa, Mastercard), MobilePay, and Klarna."
          : "We accept payment by credit card (Visa, Mastercard) and MobilePay.",
      },
      {
        title: "4. Delivery",
        content: "We deliver to parcel shops in Denmark via GLS and DAO. Standard delivery costs 39 DKK and typically takes 1-3 business days.",
      },
      {
        title: "5. Right of Return",
        content: "You have a 14-day right of return from receipt of your order. Products must be returned unopened and in original packaging. You pay for return shipping.",
      },
      {
        title: "6. Subscriptions",
        content: "Subscriptions renew automatically at the selected frequency (4, 8, or 12 weeks). You can pause, skip, or cancel your subscription via your account after a minimum of 2 deliveries.",
      },
      {
        title: "7. Warranty",
        content: "You have a 2-year warranty from the purchase date in accordance with Danish law. Contact us within a reasonable time after discovering a defect.",
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
