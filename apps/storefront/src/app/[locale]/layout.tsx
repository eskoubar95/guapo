import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { fetchNavigation, normalizeMainMenu } from "@/lib/payload-navigation";
import type { NavMenuItem } from "@/lib/payload-navigation";
import { fetchFooter, resolveFooter } from "@/lib/payload-footer";
import { Toaster } from "sonner";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Guapo",
    default: "Guapo - Premium Skincare",
  },
  description: "Curated premium skincare for all skin types. Shop the best face care products with fast delivery in Denmark.",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function getFallbackMenuItems(locale: string): NavMenuItem[] {
  const base = `/${locale}`;
  return [
    { type: "link", label: "Forside", href: base, newTab: false },
    { type: "link", label: "Blog", href: `${base}/blog`, newTab: false },
  ];
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const nav = await fetchNavigation(locale);
  let menuItems = normalizeMainMenu(locale, nav?.mainMenu);
  if (!menuItems.length) {
    menuItems = getFallbackMenuItems(locale);
  }

  const footerData = await fetchFooter(locale);
  const footer = resolveFooter(locale, footerData);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${lexend.variable} font-sans antialiased bg-white text-foreground flex min-h-screen flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <a href="#main" className="skip-link">
            {locale === "da" ? "Spring til indhold" : "Skip to main content"}
          </a>
          <Header
            locale={locale}
            menuItems={menuItems}
            ctaButton={nav?.ctaButton ?? undefined}
          />
          <main id="main" className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
          <Footer locale={locale} footer={footer} />
          <Toaster position="bottom-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
