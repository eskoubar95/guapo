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
  /** 1 = page title (one per page), 2 = section heading */
  headingLevel?: 1 | 2;
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
  headingLevel = 1,
  locale,
}: HeroSectionProps) {
  const isLight = textColor === "light";
  const textCls = isLight ? "text-primary-foreground" : "text-text-primary";
  const overlayCls = isLight ? "bg-black/50" : "bg-white/40";
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  if (variant === "full" && backgroundImageUrl) {
    return (
      <section className="relative py-12 lg:py-20 min-h-[320px] lg:min-h-[420px] flex items-center bg-background overflow-hidden">
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
            <HeadingTag className={`mb-4 ${textCls}`}>{heading}</HeadingTag>
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

  if (variant === "split" && backgroundImageUrl) {
    return (
      <section className="py-10 lg:py-14 bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] min-h-[240px] order-2 lg:order-1">
              <ImageWithFallback
                src={backgroundImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center order-1 lg:order-2 text-left">
              <HeadingTag className="mb-4 tracking-tight">
                {heading}
              </HeadingTag>
              {subheading && (
                <p className="text-lg text-text-muted mb-6">{subheading}</p>
              )}
              {cta?.text && (
                <Link
                  href={cta.url?.startsWith("http") ? cta.url : `/${locale}/${(cta.url ?? "categories").replace(/^\//, "")}`}
                  className="inline-flex items-center gap-2 h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {cta.text}
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
        <div className={`max-w-3xl ${textPosition === "center" ? "text-center mx-auto" : ""}`}>
          <HeadingTag className="mb-4 text-primary">{heading}</HeadingTag>
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
