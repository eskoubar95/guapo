import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const bgClassMap = {
  white: "bg-white",
  gray: "bg-muted",
  "brand-light": "bg-primary/5",
} as const;

export interface ContentBlockSectionProps {
  heading?: string | null;
  contentHtml: string;
  imageUrl?: string | null;
  layout: "text-image" | "image-text" | "text-only" | "text-only-left" | "full-width";
  backgroundColor?: "white" | "gray" | "brand-light" | null;
  cta?: { show?: boolean | null; text?: string | null; url?: string | null };
  locale: string;
}

export function ContentBlockSection({
  heading,
  contentHtml,
  imageUrl,
  layout,
  backgroundColor = "white",
  cta,
  locale,
}: ContentBlockSectionProps) {
  const bgClass = bgClassMap[backgroundColor ?? "white"] ?? "bg-white";
  const showCta = cta?.show === true && cta?.text;
  const ctaHref =
    showCta && cta?.url
      ? cta.url.startsWith("http")
        ? cta.url
        : `/${locale}${cta.url.startsWith("/") ? cta.url : `/${cta.url}`}`
      : undefined;

  const textBlock = (
    <div className="flex flex-col justify-center">
      {heading && (
        <h2 className="section-heading text-text-primary mb-4">
          {heading}
        </h2>
      )}
      {contentHtml && (
        <div
          className="prose prose-neutral max-w-none text-text-muted prose-p:mb-3 prose-headings:font-semibold prose-headings:text-text-primary break-words"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )}
      {showCta && ctaHref && (
        <div className="mt-6">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 h-11 px-6 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {cta.text}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );

  const imageBlock = imageUrl ? (
    <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] min-h-[200px]">
      <ImageWithFallback
        src={imageUrl}
        alt={heading ?? ""}
        className="w-full h-full object-cover"
      />
    </div>
  ) : null;

  if (layout === "text-only") {
    return (
      <section className={`py-8 sm:py-10 lg:py-14 ${bgClass}`}>
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            {textBlock}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "text-only-left") {
    return (
      <section className={`py-8 sm:py-10 lg:py-14 ${bgClass}`}>
        <div className="section-container">
          <div className="w-full text-left">
            {textBlock}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "text-image" || layout === "image-text") {
    const isImageFirst = layout === "image-text";
    return (
      <section className={`py-8 sm:py-10 lg:py-14 ${bgClass}`}>
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {isImageFirst && imageBlock}
            {textBlock}
            {!isImageFirst && imageBlock}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
