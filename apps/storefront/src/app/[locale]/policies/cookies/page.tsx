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
    title: locale === "da" ? "Cookiepolitik" : "Cookie Policy",
  };
}

export default async function CookiesPage({ params }: PolicyPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const content = locale === "da" ? {
    title: "Cookiepolitik",
    lastUpdated: "Sidst opdateret: 27. januar 2026",
    intro: "Vi bruger cookies for at give dig den bedste oplevelse på vores hjemmeside.",
    sections: [
      {
        title: "Hvad er cookies?",
        content: "Cookies er små tekstfiler, der gemmes på din enhed, når du besøger en hjemmeside. De bruges til at huske dine præferencer og forbedre din oplevelse.",
      },
      {
        title: "Nødvendige cookies",
        content: "Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt. De kan ikke slås fra. De inkluderer funktioner som indkøbskurv og login.",
      },
      {
        title: "Analytics cookies",
        content: "Disse cookies hjælper os med at forstå, hvordan besøgende interagerer med vores hjemmeside. Vi bruger PostHog til analytics. Disse cookies kræver dit samtykke.",
      },
      {
        title: "Marketing cookies",
        content: "Disse cookies bruges til at vise relevante annoncer. Vi bruger Meta og Google Ads. Disse cookies kræver dit samtykke.",
      },
      {
        title: "Administrer dine præferencer",
        content: "Du kan til enhver tid ændre dine cookie-præferencer via vores cookie-banner eller ved at kontakte os.",
      },
    ],
  } : {
    title: "Cookie Policy",
    lastUpdated: "Last updated: January 27, 2026",
    intro: "We use cookies to provide you with the best experience on our website.",
    sections: [
      {
        title: "What are cookies?",
        content: "Cookies are small text files stored on your device when you visit a website. They are used to remember your preferences and improve your experience.",
      },
      {
        title: "Necessary cookies",
        content: "These cookies are necessary for the website to function properly. They cannot be turned off. They include features like shopping cart and login.",
      },
      {
        title: "Analytics cookies",
        content: "These cookies help us understand how visitors interact with our website. We use PostHog for analytics. These cookies require your consent.",
      },
      {
        title: "Marketing cookies",
        content: "These cookies are used to show relevant advertisements. We use Meta and Google Ads. These cookies require your consent.",
      },
      {
        title: "Manage your preferences",
        content: "You can change your cookie preferences at any time via our cookie banner or by contacting us.",
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
        <p className="mt-6 text-gray-600">{content.intro}</p>

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
