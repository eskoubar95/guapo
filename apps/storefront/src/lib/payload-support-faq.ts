import { parseSupportFaqCategories, type FaqPageContent } from "@/lib/faq-content-types";
import { supportFaqFallback } from "@/lib/faq-fallback-content";

const cmsBase = (process.env.PAYLOAD_API_URL ?? process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? "").replace(/\/$/, "");

export async function resolveSupportFaqContent(locale: "da" | "en"): Promise<FaqPageContent> {
  const fallback = supportFaqFallback[locale] ?? supportFaqFallback.da;
  if (!cmsBase) return fallback;

  try {
    const params = new URLSearchParams({ locale });
    const res = await fetch(`${cmsBase}/api/storefront/globals/support-faq?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 120 },
    });
    if (!res.ok) return fallback;
    const raw = (await res.json()) as { pageTitle?: unknown; categories?: unknown };
    const categories = parseSupportFaqCategories(raw.categories);
    if (!categories?.length) return fallback;
    const pageTitle =
      typeof raw.pageTitle === "string" && raw.pageTitle.trim() ? raw.pageTitle.trim() : fallback.title;
    return { title: pageTitle, categories };
  } catch {
    return fallback;
  }
}
