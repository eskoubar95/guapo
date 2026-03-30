import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { AuthRequiredBanner } from "./AuthRequiredBanner";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ returnUrl?: string; reason?: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.auth.loginTitle,
    robots: { index: false },
  };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  const returnUrl = resolvedSearch?.returnUrl ?? "";
  const reason = resolvedSearch?.reason ?? "";
  const dict = await getDictionary(locale as Locale);

  const registerHref = returnUrl
    ? `/${locale}/register?${new URLSearchParams({ returnUrl }).toString()}`
    : `/${locale}/register`;

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
        <p className="text-xl font-semibold text-foreground">
          {dict.auth.loginTitle}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {dict.auth.loginDescription}
        </p>
        {reason === "auth_required" && (
          <AuthRequiredBanner message={dict.auth.authRequiredMessage ?? ""} />
        )}
        <div className="mt-6">
          <LoginForm locale={locale} labels={dict.auth} returnUrl={returnUrl || undefined} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {dict.auth.noAccount}{" "}
          <Link href={registerHref} className="font-medium text-primary hover:underline">
            {dict.auth.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
