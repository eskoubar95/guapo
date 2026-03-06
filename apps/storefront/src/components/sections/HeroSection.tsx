"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface HeroSectionProps {
  heading: string;
  subheading?: string;
  backgroundImageUrl?: string;
  cta?: { text?: string | null; url?: string | null };
  variant?: "full" | "split" | "video";
  textPosition?: "left" | "center" | "right";
  textColor?: "light" | "dark";
  locale: string;
}

export function HeroSection({
  heading,
  subheading,
  backgroundImageUrl,
  cta,
  variant = "full",
  textPosition = "center",
  textColor = "light",
  locale,
}: HeroSectionProps) {
  const isLight = textColor === "light";
  const textCls = isLight ? "text-primary-foreground" : "text-text-primary";
  const overlayCls = isLight ? "bg-black/50" : "bg-white/40";

  if (variant === "full" && backgroundImageUrl) {
    return (
      <section className="relative py-12 lg:py-20 min-h-[320px] lg:min-h-[420px] flex items-center bg-background">
        <ImageWithFallback
          src={backgroundImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${overlayCls}`} />
        <div className="section-container relative z-10">
          <div
            className={`max-w-2xl ${
              textPosition === "center" ? "text-center mx-auto" : textPosition === "right" ? "text-right ml-auto" : ""
            }`}
          >
            <h1 className={`text-3xl md:text-5xl font-bold mb-4 ${textCls}`}>{heading}</h1>
            {subheading && <p className={`text-lg md:text-xl mb-6 ${isLight ? "text-primary-foreground/90" : "text-text-muted"}`}>{subheading}</p>}
            {cta?.text && (
              <Link
                href={`/${locale}${cta.url ?? "/categories"}`}
                className={`inline-flex items-center gap-2 h-12 px-8 text-base font-medium rounded-lg border-2 focus-visible:outline-none focus-visible:border-primary ${
                  isLight
                    ? "bg-primary-foreground text-primary hover:opacity-90 border-transparent"
                    : "bg-primary text-primary-foreground hover:opacity-90 border-transparent"
                }`}
              >
                {cta.text}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-16 bg-surface-muted/50">
      <div className="section-container">
        <div className={`max-w-3xl ${textPosition === "center" ? "text-center mx-auto" : ""}`}>
          <h1 className="text-3xl lg:text-5xl font-bold text-primary mb-4">{heading}</h1>
          {subheading && <p className="text-text-muted mb-6">{subheading}</p>}
          {cta?.text && (
            <Link
              href={`/${locale}${cta.url ?? "/categories"}`}
              className="inline-flex items-center gap-2 h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:border-primary focus-visible:outline-none"
            >
              {cta.text}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
