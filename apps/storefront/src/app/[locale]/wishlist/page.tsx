import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { WishlistPageContent } from "./WishlistPageContent";

interface WishlistPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: WishlistPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.wishlist.title,
    robots: { index: false },
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return <WishlistPageContent locale={locale} dict={dict} />;
}
