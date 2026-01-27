import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import type { Metadata } from "next";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Min konto" : "My Account",
    robots: { index: false },
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  // Navigation items for account area
  const navItems = [
    {
      href: `/${locale}/account/orders`,
      label: dict.account.orders,
      description: locale === "da" ? "Se dine tidligere ordrer" : "View your past orders",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: `/${locale}/account/subscriptions`,
      label: dict.account.subscriptions,
      description: locale === "da" ? "Administrer dine abonnementer" : "Manage your subscriptions",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      href: `/${locale}/account/profile`,
      label: dict.account.profile,
      description: locale === "da" ? "Opdater dine oplysninger" : "Update your information",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/account/addresses`,
      label: dict.account.addresses,
      description: locale === "da" ? "Administrer dine adresser" : "Manage your addresses",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{dict.account.title}</h1>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            {dict.account.signOut}
          </button>
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-2xl font-semibold text-gray-900">3</p>
            <p className="text-sm text-gray-600">
              {locale === "da" ? "Ordrer i år" : "Orders this year"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-2xl font-semibold text-gray-900">1</p>
            <p className="text-sm text-gray-600">
              {locale === "da" ? "Aktive abonnementer" : "Active subscriptions"}
            </p>
          </div>
        </div>

        {/* Navigation grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600">
                {item.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-gray-600">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Active subscription highlight */}
        <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-900">
                {locale === "da" ? "Næste levering" : "Next delivery"}
              </p>
              <p className="mt-1 text-sm text-green-700">
                Niacinamide Serum - {new Date("2026-02-12").toLocaleDateString(locale === "da" ? "da-DK" : "en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <Link
                href={`/${locale}/account/subscriptions`}
                className="mt-2 inline-flex text-sm font-medium text-green-700 hover:text-green-900"
              >
                {locale === "da" ? "Administrer →" : "Manage →"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
