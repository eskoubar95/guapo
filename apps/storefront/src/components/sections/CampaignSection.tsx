import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface CampaignSectionProps {
  title: string;
  description?: string;
  image?: string;
  primaryCta?: { text: string; href: string };
  locale: string;
  layout?: "background" | "centered";
}

export function CampaignSection({
  title,
  description,
  image,
  primaryCta,
  locale,
  layout = "background",
}: CampaignSectionProps) {
  if (layout === "background" && image) {
    return (
      <section className="py-8 lg:py-12 bg-background">
        <div className="section-container">
          <div className="relative rounded-2xl overflow-hidden min-h-[300px] lg:min-h-[400px]">
            <ImageWithFallback
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
            <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center h-full max-w-2xl">
              <h2 className="section-heading text-white mb-4">
                {title}
              </h2>
              {description && (
                <p className="text-lg text-white/90 mb-6 max-w-xl">
                  {description}
                </p>
              )}
              {primaryCta && (
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}${primaryCta.href}`}
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
                  >
                    {primaryCta.text}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-16 bg-surface-muted/50">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading text-primary mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-text-muted mb-8 text-base lg:text-lg">
              {description}
            </p>
          )}
          {primaryCta && (
            <Link
              href={`/${locale}${primaryCta.href}`}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
            >
              {primaryCta.text}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
