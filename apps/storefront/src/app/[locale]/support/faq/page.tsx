import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface SupportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Ofte stillede spørgsmål" : "Frequently Asked Questions",
  };
}

const faqData = {
  da: {
    title: "Ofte stillede spørgsmål",
    categories: [
      {
        name: "Bestilling & Betaling",
        faqs: [
          {
            question: "Hvilke betalingsmetoder accepterer I?",
            answer: "Vi accepterer Visa, Mastercard, MobilePay, Apple Pay, Google Pay og Klarna.",
          },
          {
            question: "Kan jeg ændre min ordre efter jeg har betalt?",
            answer: "Kontakt os hurtigst muligt på support@guapo.dk. Vi kan kun ændre ordrer, der ikke er afsendt endnu.",
          },
          {
            question: "Hvordan bruger jeg en rabatkode?",
            answer: "Indtast din rabatkode i feltet ved checkout. Rabatten bliver automatisk trukket fra.",
          },
        ],
      },
      {
        name: "Levering",
        faqs: [
          {
            question: "Hvor lang tid tager levering?",
            answer: "Standardlevering til pakkeshop tager 1-3 hverdage. Du modtager en tracking-mail når din ordre er afsendt.",
          },
          {
            question: "Hvad koster levering?",
            answer: "Levering til pakkeshop koster 39 DKK. Ved køb over 399 DKK er levering gratis.",
          },
          {
            question: "Leverer I til udlandet?",
            answer: "Vi leverer primært til Danmark. Kontakt os for leveringsmuligheder til andre lande.",
          },
        ],
      },
      {
        name: "Abonnementer",
        faqs: [
          {
            question: "Hvordan virker et abonnement?",
            answer: "Vælg et produkt og en frekvens (4, 8 eller 12 uger). Du får automatisk tilsendt produktet og sparer 5% på alle fornyelser.",
          },
          {
            question: "Kan jeg pause mit abonnement?",
            answer: "Ja, du kan pause, skippe eller annullere dit abonnement via din konto efter minimum 2 leveringer.",
          },
          {
            question: "Hvad sker der hvis min betaling fejler?",
            answer: "Vi prøver automatisk igen 2 gange over 3 dage. Herefter sættes dit abonnement på pause, indtil du opdaterer din betalingsmetode.",
          },
        ],
      },
      {
        name: "Returneringer",
        faqs: [
          {
            question: "Hvordan returnerer jeg et produkt?",
            answer: "Send produktet til vores lageradresse inden for 14 dage. Produktet skal være uåbnet og i original emballage.",
          },
          {
            question: "Hvornår får jeg mine penge tilbage?",
            answer: "Vi refunderer inden for 14 dage efter vi har modtaget og godkendt din returnering.",
          },
          {
            question: "Kan jeg returnere åbnede produkter?",
            answer: "Af hygiejniske årsager kan vi kun acceptere uåbnede produkter, medmindre produktet er defekt.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Frequently Asked Questions",
    categories: [
      {
        name: "Orders & Payment",
        faqs: [
          {
            question: "What payment methods do you accept?",
            answer: "We accept Visa, Mastercard, MobilePay, Apple Pay, Google Pay, and Klarna.",
          },
          {
            question: "Can I change my order after payment?",
            answer: "Contact us as soon as possible at support@guapo.dk. We can only change orders that have not been shipped yet.",
          },
          {
            question: "How do I use a discount code?",
            answer: "Enter your discount code in the field at checkout. The discount will be automatically applied.",
          },
        ],
      },
      {
        name: "Delivery",
        faqs: [
          {
            question: "How long does delivery take?",
            answer: "Standard delivery to parcel shop takes 1-3 business days. You will receive a tracking email when your order is shipped.",
          },
          {
            question: "How much does delivery cost?",
            answer: "Delivery to parcel shop costs 39 DKK. Orders over 399 DKK qualify for free delivery.",
          },
          {
            question: "Do you deliver internationally?",
            answer: "We primarily deliver to Denmark. Contact us for delivery options to other countries.",
          },
        ],
      },
      {
        name: "Subscriptions",
        faqs: [
          {
            question: "How does a subscription work?",
            answer: "Choose a product and a frequency (4, 8, or 12 weeks). You will automatically receive the product and save 5% on all renewals.",
          },
          {
            question: "Can I pause my subscription?",
            answer: "Yes, you can pause, skip, or cancel your subscription via your account after a minimum of 2 deliveries.",
          },
          {
            question: "What happens if my payment fails?",
            answer: "We will automatically retry 2 times over 3 days. After that, your subscription will be paused until you update your payment method.",
          },
        ],
      },
      {
        name: "Returns",
        faqs: [
          {
            question: "How do I return a product?",
            answer: "Send the product to our warehouse address within 14 days. The product must be unopened and in original packaging.",
          },
          {
            question: "When will I receive my refund?",
            answer: "We will refund within 14 days after receiving and approving your return.",
          },
          {
            question: "Can I return opened products?",
            answer: "For hygiene reasons, we can only accept unopened products, unless the product is defective.",
          },
        ],
      },
    ],
  },
};

export default async function FAQPage({ params }: SupportPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const content = faqData[locale as "da" | "en"];

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

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>

        <div className="mt-12 space-y-12">
          {content.categories.map((category, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                {category.name}
              </h2>
              <dl className="mt-6 space-y-6">
                {category.faqs.map((faq, j) => (
                  <div key={j}>
                    <dt className="font-medium text-gray-900">{faq.question}</dt>
                    <dd className="mt-2 text-gray-600">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-gray-100 pt-8">
          <p className="text-gray-600">
            {locale === "da"
              ? "Fandt du ikke svar på dit spørgsmål?"
              : "Didn't find the answer to your question?"}
          </p>
          <Link
            href={`/${locale}/support/contact`}
            className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            {locale === "da" ? "Kontakt os →" : "Contact us →"}
          </Link>
        </div>
      </main>
    </div>
  );
}
