"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface Slide {
  id: string;
  variant: "dark" | "light-blue" | "light-warm";
  badge?: string;
  title: string;
  subtitle?: string;
  disclaimer?: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant?: "default" | "outline";
}

const variantStyles = {
  dark: "bg-gradient-to-r from-[#293241] to-[#3D5A80] text-white",
  "light-blue": "bg-gradient-to-r from-[#E8F1F5] to-[#D0E8F2] text-foreground",
  "light-warm": "bg-gradient-to-r from-[#F5F3F0] to-[#E8E6E1] text-foreground",
};

interface PromotionSliderProps {
  slides: Slide[];
  locale: string;
}

export function PromotionSlider({ slides, locale }: PromotionSliderProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4">
        <div
          className={`rounded-xl p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 overflow-hidden ${variantStyles[slide.variant]}`}
        >
          <div>
            {slide.badge && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
                  slide.variant === "dark" ? "bg-white/20" : "bg-primary/10 text-primary"
                }`}
              >
                {slide.badge}
              </span>
            )}
            <h2
              className={`text-4xl md:text-6xl font-bold mb-2 ${
                slide.variant === "dark" ? "text-white" : "text-primary"
              }`}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p
                className={
                  slide.variant === "dark"
                    ? "text-xl md:text-2xl text-white/90"
                    : "text-lg text-text-secondary"
                }
              >
                {slide.subtitle}
              </p>
            )}
            {slide.disclaimer && (
              <p
                className={`text-sm mt-2 ${
                  slide.variant === "dark" ? "text-white/70" : "text-text-muted"
                }`}
              >
                {slide.disclaimer}
              </p>
            )}
            <div className="mt-6">
              <Link
                href={`/${locale}${slide.ctaHref}`}
                className={`inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-medium rounded-lg border-2 focus-visible:outline-none focus-visible:border-primary ${
                  slide.ctaVariant === "outline"
                    ? "bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    : slide.variant === "dark"
                      ? "bg-white text-primary hover:bg-white/90 border-transparent"
                      : "bg-primary text-primary-foreground hover:opacity-90 border-transparent"
                }`}
              >
                {slide.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        {slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-primary" : "bg-border"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
