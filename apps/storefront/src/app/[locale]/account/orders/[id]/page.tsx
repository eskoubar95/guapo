import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

interface OrderDetailRedirectProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: OrderDetailRedirectProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "da" ? "Ordrer" : "Orders",
    robots: { index: false },
  };
}

/**
 * Ordredetaljer vises kun via modal/sheet fra ordrelisten — ingen separat fuld side.
 */
export default async function OrderDetailRedirect({ params }: OrderDetailRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale as Locale}/account/orders`);
}
