import type { FaqPageContent } from "@/lib/faq-content-types";

const klarnaEnabled = process.env.NEXT_PUBLIC_CHECKOUT_ENABLE_KLARNA === "true";

/** Used when Payload `support-faq` has no categories for the locale yet. */
export const supportFaqFallback: Record<"da" | "en", FaqPageContent> = {
  da: {
    title: "Ofte stillede spørgsmål",
    categories: [
      {
        name: "Bestilling & Betaling",
        faqs: [
          {
            question: "Hvilke betalingsmetoder accepterer I?",
            answer: klarnaEnabled
              ? "Vi accepterer Visa, Mastercard, MobilePay og Klarna."
              : "Vi accepterer Visa, Mastercard og MobilePay.",
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
            answer: klarnaEnabled
              ? "We accept Visa, Mastercard, MobilePay, and Klarna."
              : "We accept Visa, Mastercard, and MobilePay.",
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
