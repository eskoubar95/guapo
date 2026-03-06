"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useRef, useState, useEffect } from "react";

interface FeaturedProductsProps {
  title: string;
  products: Product[];
  locale: string;
  viewAllLink?: string;
  viewAllText?: string;
  backgroundColor?: string;
  layout?: "grid" | "carousel";
}

export function FeaturedProducts({
  title,
  products,
  locale,
  viewAllLink,
  viewAllText = "Se alle",
  backgroundColor = "bg-background",
  layout = "carousel",
}: FeaturedProductsProps) {
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
  }, [products.length]);

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
      <section className={`py-6 sm:py-8 lg:py-12 ${backgroundColor}`}>
        <div className="section-container">
          <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center justify-between gap-3">
            <h2 className="section-heading text-text-primary">
              {title}
            </h2>
            {viewAllLink && (
              <Link
                href={`/${locale}${viewAllLink}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {viewAllText}
              </Link>
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
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-surface transition-colors transition-shadow border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til venstre"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
              </button>
            )}
            {showRight && hovered && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-surface transition-colors transition-shadow border-0 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll til højre"
              >
                <ChevronRight className="h-6 w-6 text-primary" />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex items-stretch gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scroll-smooth scrollbar-hide min-w-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[calc(50%-6px)] min-w-[140px] sm:w-[30%] md:w-[23%] lg:w-[22%]"
                >
                  <ProductCard product={product} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-6 sm:py-8 lg:py-12 ${backgroundColor}`}>
      <div className="section-container">
        <div className="mb-4 sm:mb-5 lg:mb-6">
          <h2 className="section-heading text-text-primary">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
