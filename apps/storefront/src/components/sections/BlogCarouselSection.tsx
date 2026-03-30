"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getArticleCategoryLabel } from "@/lib/payload-articles";

export interface BlogCarouselArticle {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
}

interface BlogCarouselSectionProps {
  heading: string;
  subheading?: string | null;
  locale: string;
  source?: "latest" | "category" | "manual";
  category?: string | null;
  limit?: number;
  cta?: { text: string; url: string };
  articles: BlogCarouselArticle[];
}

export function BlogCarouselSection({
  heading,
  subheading,
  locale,
  cta,
  articles,
}: BlogCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [articles.length]);

  if (!articles.length) return null;

  return (
    <section className="py-6 sm:py-8 lg:py-12 bg-background">
      <div className="section-container min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="section-heading text-primary">{heading}</h2>
            {subheading && <p className="text-text-secondary text-sm mt-1">{subheading}</p>}
          </div>
          {cta && (
            <Link href={`/${locale}${cta.url}`} className="text-sm font-medium text-primary hover:underline">
              {cta.text}
            </Link>
          )}
        </div>
        <div className="relative">
          <div ref={scrollRef} className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2 items-stretch min-w-0">
            {articles.map((a) => {
              if (!a.slug?.trim()) return null;
              return (
              <Link
                key={a.slug}
                href={`/${locale}/blog/${a.slug}`}
                className="group/card shrink-0 w-[72%] min-w-[220px] max-w-[260px] sm:max-w-[280px] md:w-[calc(25%-14px)] rounded-lg bg-white overflow-hidden transition-[box-shadow,color] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <div className="relative aspect-square bg-surface-muted overflow-hidden">
                  {a.thumbnailUrl ? (
                    <ImageWithFallback
                      src={a.thumbnailUrl}
                      alt={a.title ?? ""}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-muted" />
                  )}
                  {/* Subtle gradient overlay on hover (Matas-style) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
                </div>
                <div className="py-3 px-0">
                  {getArticleCategoryLabel(a.category) && (
                    <p className="text-xs text-text-muted mb-1">{getArticleCategoryLabel(a.category)}</p>
                  )}
                  <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover/card:text-primary group-hover/card:underline transition-colors underline-offset-2">{a.title ?? "Article"}</h3>
                </div>
              </Link>
              );
            })}
          </div>
          {articles.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
                className={`absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-surface transition-colors transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${!showLeft ? "invisible" : ""}`}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
                className={`absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-surface transition-colors transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${!showRight ? "invisible" : ""}`}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
