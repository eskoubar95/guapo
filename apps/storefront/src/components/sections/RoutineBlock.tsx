"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { useRef, useState, useEffect } from "react";

export interface RoutineCard {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

interface RoutineBlockProps {
  title: string;
  subtitle?: string;
  routines: RoutineCard[];
  locale: string;
  layout?: "grid" | "carousel";
  backgroundColor?: string;
}

export function RoutineBlock({
  title,
  subtitle,
  routines,
  locale,
  layout = "carousel",
  backgroundColor = "bg-background",
}: RoutineBlockProps) {
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
  }, [routines.length]);

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
      <section className={`py-8 lg:py-12 ${backgroundColor}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-5 lg:mb-6">
            <h2 className="section-heading text-primary mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-muted">{subtitle}</p>
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
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til venstre"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
              </button>
            )}
            {showRight && hovered && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til højre"
              >
                <ChevronRight className="h-6 w-6 text-primary" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex gap-3 lg:gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {routines.map((routine) => (
                <Link
                  key={routine.id}
                  href={`/${locale}${routine.href}`}
                  className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18%] bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-36 lg:h-40 overflow-hidden bg-surface-muted">
                    <ImageWithFallback
                      src={routine.image}
                      alt={routine.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 lg:p-4">
                    <h3 className="font-medium text-text-primary text-sm mb-1">
                      {routine.title}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {routine.description}
                    </p>
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
    <section className={`py-8 lg:py-12 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="section-heading text-primary mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-text-muted">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {routines.map((routine) => (
            <Link
              key={routine.id}
              href={`/${locale}${routine.href}`}
              className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
            >
              <div className="relative h-36 lg:h-40 overflow-hidden bg-surface-muted">
                <ImageWithFallback
                  src={routine.image}
                  alt={routine.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 lg:p-4">
                <h3 className="font-medium text-text-primary text-sm mb-1">
                  {routine.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2">
                  {routine.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
