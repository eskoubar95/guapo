export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  name: string;
  faqs: FaqItem[];
}

export interface FaqPageContent {
  title: string;
  categories: FaqCategory[];
}

export function parseSupportFaqCategories(raw: unknown): FaqCategory[] | null {
  if (!Array.isArray(raw)) return null;
  const out: FaqCategory[] = [];
  for (const cat of raw) {
    if (!cat || typeof cat !== "object") continue;
    const c = cat as Record<string, unknown>;
    const name = typeof c.name === "string" ? c.name.trim() : "";
    const faqsRaw = c.faqs;
    if (!name || !Array.isArray(faqsRaw)) continue;
    const faqs: FaqItem[] = [];
    for (const f of faqsRaw) {
      if (!f || typeof f !== "object") continue;
      const fq = f as Record<string, unknown>;
      const question = typeof fq.question === "string" ? fq.question.trim() : "";
      const answer = typeof fq.answer === "string" ? fq.answer.trim() : "";
      if (!question || !answer) continue;
      faqs.push({ question, answer });
    }
    if (faqs.length) out.push({ name, faqs });
  }
  return out.length ? out : null;
}

export function faqPageJsonLdFromContent(content: FaqPageContent): Record<string, unknown> {
  const mainEntity = content.categories.flatMap((cat) =>
    cat.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  );
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}
