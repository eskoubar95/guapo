import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import { fetchLatestArticles } from "@/lib/payload-articles";
import { getDictionary } from "@/i18n/dictionaries";
import { ArticleFeed } from "@/components/blog/ArticleFeed";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.blog.title,
    description: dict.blog.intro,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const dict = await getDictionary(validLocale);
  const articles = await fetchLatestArticles(validLocale, 50);

  return (
    <div className="min-h-full w-full bg-background min-w-0 overflow-x-clip">
      <main className="section-container py-8 sm:py-10 lg:py-12">
        <ArticleFeed articles={articles} locale={validLocale} dict={dict} />
      </main>
    </div>
  );
}
