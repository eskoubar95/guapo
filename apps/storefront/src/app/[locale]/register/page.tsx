import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.auth.registerTitle,
    robots: { index: false },
  };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">{dict.auth.registerTitle}</h1>
      <RegisterForm locale={locale} labels={dict.auth} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {dict.auth.hasAccount}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
          {dict.auth.loginLink}
        </Link>
      </p>
    </div>
  );
}
