"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export interface PromotionSliderSlideData {
  id: string;
  imageDesktopUrl: string;
  imageTabletUrl?: string;
  imageMobileUrl?: string;
  href?: string;
}

interface PromotionSliderProps {
  slides: PromotionSliderSlideData[];
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
  const desktopUrl = slide.imageDesktopUrl;
  const tabletUrl = slide.imageTabletUrl ?? desktopUrl;
  const mobileUrl = slide.imageMobileUrl ?? tabletUrl ?? desktopUrl;
  const href = slide.href
    ? slide.href.startsWith("http")
      ? slide.href
      : `/${locale}${slide.href === "/" ? "" : slide.href.startsWith("/") ? slide.href : `/${slide.href}`}`
    : undefined;

  const content = (
      <picture className="absolute inset-0 block w-full h-full">
      <source media="(max-width: 767px)" srcSet={mobileUrl} />
      <source media="(max-width: 1023px)" srcSet={tabletUrl} />
      <img
        src={desktopUrl}
        alt=""
        width={2560}
        height={875}
        className="w-full h-full object-cover rounded-xl"
        fetchPriority={current === 0 ? "high" : undefined}
      />
    </picture>
  );

  return (
    <section className="py-6 sm:py-8 lg:py-10 bg-background">
      <div className="section-container min-w-0">
        {/* Figma: desktop 2560×875 (≈2.93:1), mobile square (1:1) */}
        <div className="relative rounded-lg sm:rounded-xl overflow-hidden aspect-square md:aspect-[2560/875] bg-muted">
          {href ? (
            <Link href={href} className="block absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
              {content}
            </Link>
          ) : (
            <div className="absolute inset-0">{content}</div>
          )}
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
