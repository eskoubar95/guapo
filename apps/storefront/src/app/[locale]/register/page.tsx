import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ returnUrl?: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.auth.registerTitle,
    robots: { index: false },
  };
}

export default async function RegisterPage({ params, searchParams }: RegisterPageProps) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  const returnUrl = resolvedSearch?.returnUrl ?? "";
  const dict = await getDictionary(locale as Locale);

  const loginHref = returnUrl
    ? `/${locale}/login?${new URLSearchParams({ returnUrl }).toString()}`
    : `/${locale}/login`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-linear-to-br from-stone-100/90 via-stone-50/95 to-background">
      <Link
        href={`/${locale}`}
        className="mb-6 flex shrink-0"
        aria-label={locale === "da" ? "Guapo – forside" : "Guapo – home"}
      >
        <img
          src="/logos/GUAPO_default.svg"
          alt="Guapo"
          className="h-6 w-auto"
          width={856}
          height={157}
        />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg p-6 sm:p-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <span aria-hidden>←</span> {dict.auth.backLink}
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xl font-semibold text-foreground">
            {dict.auth.registerTitle}
          </p>
          <Link href={loginHref} className="text-sm font-medium text-primary hover:underline">
            {dict.auth.hasAccount} {dict.auth.loginLink}
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.auth.registerDescription}
        </p>
        <div className="mt-6">
          <RegisterForm locale={locale} labels={dict.auth} returnUrl={returnUrl || undefined} />
        </div>
      </div>
    </div>
  );
}
