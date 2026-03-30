"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const AUTOPLAY_MS = 7000;

export interface PromotionSliderSlideData {
  id: string;
  imageDesktopUrl: string;
  imageTabletUrl?: string;
  imageMobileUrl?: string;
  href?: string;
  /** Screen reader name for linked slide; falls back to slide index label */
  accessibleLabel?: string;
}

export interface PromotionSliderLabels {
  previousSlide: string;
  nextSlide: string;
  goToSlide: string;
  pauseAutoplay: string;
  playAutoplay: string;
}

interface PromotionSliderProps {
  slides: PromotionSliderSlideData[];
  locale: string;
  /** A11y / UI copy from i18n */
  labels?: PromotionSliderLabels;
}

function resolveHref(slideHref: string | undefined, locale: string): string | undefined {
  if (!slideHref) return undefined;
  const t = slideHref.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const localePrefix = `/${locale}`;
  let path = t.startsWith("/") ? t : `/${t}`;
  if (path === localePrefix || path.startsWith(`${localePrefix}/`)) return path;
  return `${localePrefix}${path === "/" ? "" : path}`;
}

export function PromotionSlider({ slides, locale, labels }: PromotionSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const l = labels ?? {
    previousSlide: "Previous slide",
    nextSlide: "Next slide",
    goToSlide: "Go to slide",
    pauseAutoplay: "Pause carousel",
    playAutoplay: "Play carousel",
  };

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length, current, paused, goNext]);

  if (slides.length === 0) return null;

  const multi = slides.length > 1;
  const pctPerSlide = 100 / slides.length;

  const navButtonClass =
    "hidden sm:flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <section
      className="py-6 sm:py-8 lg:py-10 bg-background"
      onFocusCapture={() => multi && setPaused(true)}
      onBlurCapture={(e) => {
        if (!multi) return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
      onTouchStart={() => multi && setPaused(true)}
    >
      <div className="section-container min-w-0">
        {/* Figma: desktop 2560×875 (≈2.93:1), mobile square (1:1). Side nav from sm+; mobile uses dots + autoplay only. */}
        <div
          className={multi ? "flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-4" : "min-w-0"}
          onMouseEnter={() => multi && setPaused(true)}
          onMouseLeave={() => multi && setPaused(false)}
        >
          {multi && (
            <button
              type="button"
              onClick={() => goPrev()}
              className={navButtonClass}
              aria-label={l.previousSlide}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
            </button>
          )}
          <div
            className={`relative min-w-0 overflow-hidden rounded-lg sm:rounded-xl aspect-square md:aspect-[2560/875] bg-muted ${
              multi ? "flex-1" : "w-full"
            }`}
          >
            <div
              className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none motion-reduce:duration-0 will-change-transform"
              style={{
                width: multi ? `${slides.length * 100}%` : "100%",
                transform: multi ? `translateX(-${current * pctPerSlide}%)` : undefined,
              }}
            >
              {slides.map((slide, index) => {
                const desktopUrl = slide.imageDesktopUrl;
                const tabletUrl = slide.imageTabletUrl ?? desktopUrl;
                const mobileUrl = slide.imageMobileUrl ?? tabletUrl ?? desktopUrl;
                const href = resolveHref(slide.href, locale);
                const slideLabel =
                  slide.accessibleLabel?.trim() || `${l.goToSlide} ${index + 1}`;
                const eagerLoad =
                  index === current || index === (current + 1) % slides.length;
                const inner = (
                  <picture className="absolute inset-0 block h-full w-full">
                    <source media="(max-width: 767px)" srcSet={mobileUrl} />
                    <source media="(max-width: 1023px)" srcSet={tabletUrl} />
                    <img
                      src={desktopUrl}
                      alt=""
                      width={2560}
                      height={875}
                      className="h-full w-full object-cover"
                      loading={eagerLoad ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : undefined}
                    />
                  </picture>
                );
                return (
                  <div
                    key={slide.id}
                    className="relative h-full shrink-0 grow-0 overflow-hidden"
                    style={{ width: multi ? `${pctPerSlide}%` : "100%" }}
                  >
                    {href ? (
                      <Link
                        href={href}
                        aria-label={slideLabel}
                        className="absolute inset-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="absolute inset-0">{inner}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {multi && (
            <button
              type="button"
              onClick={() => goNext()}
              className={navButtonClass}
              aria-label={l.nextSlide}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
            </button>
          )}
        </div>
        {multi && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-pressed={paused}
              aria-label={paused ? l.playAutoplay : l.pauseAutoplay}
            >
              {paused ? (
                <Play className="h-4 w-4" aria-hidden />
              ) : (
                <Pause className="h-4 w-4" aria-hidden />
              )}
            </button>
            <div className="flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === current ? "bg-primary" : "bg-border"
                  }`}
                  aria-label={`${l.goToSlide} ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
