import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartAndModalProviders } from "@/components/providers/CartAndModalProviders";
import { fetchNavigation, normalizeMenuSections } from "@/lib/payload-navigation";
import type { NavSection } from "@/lib/payload-navigation";
import { fetchFooter, resolveFooter } from "@/lib/payload-footer";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Guapo",
    default: "Guapo - Premium Skincare",
  },
  description:
    "Curated premium skincare for all skin types. Shop the best face care products with fast delivery in Denmark.",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function getFallbackSections(locale: string): NavSection[] {
  const base = `/${locale}`;
  return [
    {
      items: [
        { type: "link", label: "Forside", href: base, newTab: false },
        { type: "link", label: "Blog", href: `${base}/blog`, newTab: false },
      ],
    },
  ];
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);
  const nav = await fetchNavigation(locale);
  let menuSections = normalizeMenuSections(locale, nav);
  if (!menuSections.length) {
    menuSections = getFallbackSections(locale);
  }
  const footerData = await fetchFooter(locale);
  const footer = resolveFooter(locale, footerData);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-foreground flex min-h-screen flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CartAndModalProviders locale={locale} dict={dict}>
            <Header
              locale={locale}
              dict={dict}
              menuSections={menuSections}
              promotionBar={nav?.promotionBar ?? undefined}
              ctaButton={nav?.ctaButton ?? undefined}
            />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} footer={footer} />
          </CartAndModalProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
