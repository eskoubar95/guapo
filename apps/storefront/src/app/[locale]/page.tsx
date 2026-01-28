import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import Link from "next/link";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-white">
      {/* Header placeholder */}
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/${locale}`} className="text-xl font-semibold text-gray-900">
              {dict.common.brand}
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${locale}/search`} className="text-sm text-gray-600 hover:text-gray-900">
                {dict.common.search}
              </Link>
              <Link href={`/${locale}/cart`} className="text-sm text-gray-600 hover:text-gray-900">
                {dict.common.cart}
              </Link>
              <Link href={`/${locale}/account`} className="text-sm text-gray-600 hover:text-gray-900">
                {dict.common.account}
              </Link>
              {/* Language switcher */}
              <div className="flex items-center gap-2 text-sm">
                <Link 
                  href="/da" 
                  className={locale === "da" ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}
                >
                  DA
                </Link>
                <span className="text-gray-300">|</span>
                <Link 
                  href="/en" 
                  className={locale === "en" ? "font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}
                >
                  EN
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main>
        <section className="relative bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                {dict.home.hero.title}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
                {dict.home.hero.subtitle}
              </p>
              <div className="mt-10">
                <Link
                  href={`/${locale}/categories`}
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  {dict.home.hero.cta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured products placeholder */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">{dict.home.featured.title}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {/* Product cards will be rendered here */}
              <div className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        </section>

        {/* New arrivals placeholder */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">{dict.home.newArrivals.title}</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {/* Product cards will be rendered here */}
              <div className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
              <div className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{dict.footer.support}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href={`/${locale}/support/faq`} className="text-sm text-gray-600 hover:text-gray-900">FAQ</Link></li>
                <li><Link href={`/${locale}/support/contact`} className="text-sm text-gray-600 hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{dict.footer.policies}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href={`/${locale}/policies/terms`} className="text-sm text-gray-600 hover:text-gray-900">Terms</Link></li>
                <li><Link href={`/${locale}/policies/privacy`} className="text-sm text-gray-600 hover:text-gray-900">Privacy</Link></li>
                <li><Link href={`/${locale}/policies/returns`} className="text-sm text-gray-600 hover:text-gray-900">Returns</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-8 text-center">
            <p className="text-sm text-gray-500">{dict.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
