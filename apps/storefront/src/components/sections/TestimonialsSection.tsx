"use client";

import Link from "next/link";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { TestimonialItem } from "@/lib/payload-homepage";

interface TestimonialsSectionProps {
  heading: string;
  testimonials: TestimonialItem[];
  displayType?: "carousel" | "grid";
  locale: string;
}

export function TestimonialsSection({
  heading,
  testimonials,
  displayType = "carousel",
  locale,
}: TestimonialsSectionProps) {
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
  }, [testimonials.length]);

  if (!testimonials.length) return null;

  const content = testimonials.map((t, i) => (
    <div
      key={t.quote.slice(0, 30) + i}
      className="shrink-0 w-[280px] md:w-[320px] p-6 rounded-xl bg-card border border-border"
    >
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-4 w-4 ${(t.rating ?? 5) >= s ? "fill-primary text-primary" : "text-border"}`}
          />
        ))}
      </div>
      <p className="text-text-primary text-sm mb-4 line-clamp-4">&ldquo;{t.quote}&rdquo;</p>
      <p className="font-medium text-primary text-sm">{t.author}</p>
      {t.location && <p className="text-text-muted text-xs">{t.location}</p>}
      {t.productHandle && (
        <Link
          href={`/${locale}/products/${t.productHandle}`}
          className="text-xs text-primary hover:underline mt-1 inline-block"
        >
          View product
        </Link>
      )}
    </div>
  ));

  if (displayType === "grid") {
    return (
      <section className="py-8 lg:py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="section-heading text-primary mb-6">{heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{content}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="section-heading text-primary mb-6">{heading}</h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          >
            {content}
          </div>
          {testimonials.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow flex items-center justify-center text-text-primary hover:bg-surface-muted focus-visible:border-primary ${!showLeft ? "invisible" : ""}`}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow flex items-center justify-center text-text-primary hover:bg-surface-muted focus-visible:border-primary ${!showRight ? "invisible" : ""}`}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
