import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PromotionBannerProps {
  badge?: string;
  title: string;
  subtitle?: string;
  disclaimer?: string;
  ctaText: string;
  ctaHref: string;
  locale: string;
  variant?: "dark" | "light";
}

export function PromotionBanner({
  badge,
  title,
  subtitle,
  disclaimer,
  ctaText,
  ctaHref,
  locale,
  variant = "dark",
}: PromotionBannerProps) {
  const isDark = variant === "dark";
  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div
          className={`rounded-xl p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${
            isDark
              ? "bg-gradient-to-r from-[#293241] to-[#3D5A80] text-white"
              : "bg-gradient-to-r from-surface-muted to-surface"
          }`}
        >
          <div className={isDark ? "text-white" : "text-foreground"}>
            {badge && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
                  isDark ? "bg-white/20" : "bg-primary/10 text-primary"
                }`}
              >
                {badge}
              </span>
            )}
            <h2
              className={`text-3xl md:text-5xl font-bold mb-2 ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              {title}
            </h2>
            {subtitle && (
              <p className={isDark ? "text-white/90 text-lg" : "text-muted-foreground text-lg"}>
                {subtitle}
              </p>
            )}
            {disclaimer && (
              <p className={`text-sm mt-2 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>
                {disclaimer}
              </p>
            )}
            <div className="mt-6">
              <Link
                href={`/${locale}${ctaHref}`}
                className={`inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-medium rounded-lg border-2 border-transparent focus-visible:outline-none focus-visible:border-primary ${
                  isDark
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
