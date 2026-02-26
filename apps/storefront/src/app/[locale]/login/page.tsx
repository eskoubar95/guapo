import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.auth.loginTitle,
    robots: { index: false },
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">{dict.auth.loginTitle}</h1>
      <LoginForm locale={locale} labels={dict.auth} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {dict.auth.noAccount}{" "}
        <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
          {dict.auth.registerLink}
        </Link>
      </p>
    </div>
  );
}
