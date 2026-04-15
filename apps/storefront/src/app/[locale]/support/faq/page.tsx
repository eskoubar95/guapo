import Link from "next/link";
import type { Metadata } from "next";
import { FAQAccordion } from "@/components/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLdFromContent } from "@/lib/faq-content-types";
import { resolveSupportFaqContent } from "@/lib/payload-support-faq";

interface SupportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale === "en" ? "en" : "da";
  const content = await resolveSupportFaqContent(loc);
  return {
    title: content.title,
  };
}

export default async function FAQPage({ params }: SupportPageProps) {
  const { locale } = await params;
  const loc = locale === "en" ? "en" : "da";
  const content = await resolveSupportFaqContent(loc);

  return (
    <div className="min-h-full">
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <JsonLd data={faqPageJsonLdFromContent(content)} />
        <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
        <FAQAccordion categories={content.categories} />
        <div className="mt-16 border-t border-border pt-8">
          <p className="text-muted-foreground">
            {locale === "da" ? "Fandt du ikke svar på dit spørgsmål?" : "Didn't find the answer to your question?"}
          </p>
          <Link
            href={`/${locale}/support/contact`}
            className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            {locale === "da" ? "Kontakt os →" : "Contact us →"}
          </Link>
        </div>
      </main>
    </div>
  );
}
