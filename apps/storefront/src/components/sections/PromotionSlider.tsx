"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD_RATIO = 0.12;
const CLICK_TOLERANCE_PX = 14;

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
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const suppressLinkClickRef = useRef(false);

  const l = labels ?? {
    previousSlide: "Previous slide",
    nextSlide: "Next slide",
    goToSlide: "Go to slide",
  };

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const autoplayPaused = hoverPaused || focusPaused || isDragging;

  useEffect(() => {
    if (slides.length <= 1 || autoplayPaused) return;
    const t = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length, current, autoplayPaused, goNext]);

  if (slides.length === 0) return null;

  const multi = slides.length > 1;
  const pctPerSlide = 100 / slides.length;

  const navButtonClass =
    "hidden sm:flex shrink-0 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (suppressLinkClickRef.current) {
      e.preventDefault();
      suppressLinkClickRef.current = false;
    }
  };

  const onTrackPointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!multi) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragStartXRef.current = e.clientX;
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId || dragStartXRef.current == null) return;
    setDragOffset(e.clientX - dragStartXRef.current);
  };

  const finishPointerGesture = (e: React.PointerEvent<HTMLDivElement>, clientX: number) => {
    if (activePointerIdRef.current !== e.pointerId) return;

    const startX = dragStartXRef.current;
    const dx = startX != null ? clientX - startX : 0;

    dragStartXRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(dx) > CLICK_TOLERANCE_PX) {
      suppressLinkClickRef.current = true;
    }

    const w = trackRef.current?.offsetWidth ?? 300;
    const threshold = w * SWIPE_THRESHOLD_RATIO;
    if (Math.abs(dx) > threshold) {
      if (dx > 0) goPrev();
      else goNext();
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishPointerGesture(e, e.clientX);
  };

  const onTrackPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    dragStartXRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    dragStartXRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <section
      className="py-6 sm:py-8 lg:py-10 bg-background"
      onFocusCapture={() => multi && setFocusPaused(true)}
      onBlurCapture={(e) => {
        if (!multi) return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFocusPaused(false);
        }
      }}
    >
      <div className="section-container min-w-0">
        <div
          className={multi ? "flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-4" : "min-w-0"}
          onMouseEnter={() => multi && setHoverPaused(true)}
          onMouseLeave={() => multi && setHoverPaused(false)}
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
            ref={trackRef}
            className={`relative min-w-0 overflow-hidden rounded-lg sm:rounded-xl aspect-square md:aspect-[2560/875] bg-muted touch-pan-y ${
              multi ? "flex-1 cursor-grab active:cursor-grabbing" : "w-full"
            } ${isDragging ? "select-none" : ""}`}
            onPointerDownCapture={onTrackPointerDownCapture}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerCancel}
            onLostPointerCapture={onLostPointerCapture}
          >
            <div
              className={`flex h-full will-change-transform ${
                isDragging
                  ? "transition-none motion-reduce:transition-none"
                  : "transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none motion-reduce:duration-0"
              }`}
              style={{
                width: multi ? `${slides.length * 100}%` : "100%",
                transform: multi
                  ? `translateX(calc(-${current * pctPerSlide}% + ${dragOffset}px))`
                  : undefined,
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
                      className="h-full w-full object-cover pointer-events-none"
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
                        onClick={handleLinkClick}
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
          <div className="mt-4 flex justify-center gap-2">
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
        )}
      </div>
    </section>
  );
}
