"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { useRef, useState, useEffect } from "react";

export interface ContentCard {
  id: string;
  title: string;
  image: string;
  href: string;
  label?: string;
  excerpt?: string;
}

interface ContentGridProps {
  title: string;
  subtitle?: string;
  content: ContentCard[];
  locale: string;
  layout?: "grid" | "carousel";
}

export function ContentGrid({
  title,
  subtitle,
  content,
  locale,
  layout = "carousel",
}: ContentGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [hovered, setHovered] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 10
    );
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
  }, [content.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollTo({
      left: dir === "left" ? el.scrollLeft - amount : el.scrollLeft + amount,
      behavior: "smooth",
    });
  };

  if (layout === "carousel") {
    return (
      <section className="py-8 lg:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-5 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-primary mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className="relative group/carousel"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {showLeft && hovered && (
              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card rounded-full shadow-lg flex items-center justify-center hover:bg-surface-muted border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til venstre"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
              </button>
            )}
            {showRight && hovered && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card rounded-full shadow-lg flex items-center justify-center hover:bg-surface-muted border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til højre"
              >
                <ChevronRight className="h-6 w-6 text-primary" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex gap-4 lg:gap-6 overflow-x-auto scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {content.map((item) => (
                <Link
                  key={item.id}
                  href={`/${locale}${item.href}`}
                  className="flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] lg:w-[30%] bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 lg:h-56 overflow-hidden bg-surface-muted">
                    {item.label && (
                      <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary z-10">
                        {item.label}
                      </div>
                    )}
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 lg:p-5">
                    <h3 className="font-medium text-foreground mb-2 hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-5 lg:mb-6">
          <h2 className="text-xl lg:text-2xl font-semibold text-primary mb-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {content.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}${item.href}`}
              className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 lg:h-56 overflow-hidden bg-surface-muted">
                {item.label && (
                  <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-primary z-10">
                    {item.label}
                  </div>
                )}
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 lg:p-5">
                <h3 className="font-medium text-foreground mb-2 hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
