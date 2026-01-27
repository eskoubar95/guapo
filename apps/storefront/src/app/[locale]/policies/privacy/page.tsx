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
    title: locale === "da" ? "Privatlivspolitik" : "Privacy Policy",
  };
}

export default async function PrivacyPage({ params }: PolicyPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const content = locale === "da" ? {
    title: "Privatlivspolitik",
    lastUpdated: "Sidst opdateret: 27. januar 2026",
    sections: [
      {
        title: "Indsamling af data",
        content: "Vi indsamler persondata, som du frivilligt afgiver, når du opretter en konto, afgiver en ordre, eller kontakter os. Dette inkluderer navn, e-mail, adresse og betalingsoplysninger.",
      },
      {
        title: "Brug af data",
        content: "Vi bruger dine data til at behandle ordrer, levere produkter, kommunikere om dit køb, og forbedre vores tjenester. Vi deler ikke dine data med tredjeparter undtagen hvor det er nødvendigt for at levere vores tjenester.",
      },
      {
        title: "Cookies",
        content: "Vi bruger cookies for at forbedre din oplevelse på vores hjemmeside. Du kan administrere dine cookie-præferencer via vores cookie-banner.",
      },
      {
        title: "Dine rettigheder",
        content: "Du har ret til at få adgang til, rette eller slette dine persondata. Kontakt os på privacy@guapo.dk for at udøve disse rettigheder.",
      },
      {
        title: "Sikkerhed",
        content: "Vi beskytter dine data med industri-standard sikkerhedsforanstaltninger, herunder kryptering af følsomme data.",
      },
    ],
  } : {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 27, 2026",
    sections: [
      {
        title: "Data Collection",
        content: "We collect personal data that you voluntarily provide when you create an account, place an order, or contact us. This includes name, email, address, and payment information.",
      },
      {
        title: "Use of Data",
        content: "We use your data to process orders, deliver products, communicate about your purchase, and improve our services. We do not share your data with third parties except where necessary to provide our services.",
      },
      {
        title: "Cookies",
        content: "We use cookies to improve your experience on our website. You can manage your cookie preferences via our cookie banner.",
      },
      {
        title: "Your Rights",
        content: "You have the right to access, correct, or delete your personal data. Contact us at privacy@guapo.dk to exercise these rights.",
      },
      {
        title: "Security",
        content: "We protect your data with industry-standard security measures, including encryption of sensitive data.",
      },
    ],
  };

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
        <p className="mt-2 text-sm text-gray-500">{content.lastUpdated}</p>

        <div className="mt-12 space-y-8">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-3 text-gray-600">{section.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
