"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useRef, useState, useEffect } from "react";

interface BrandSpotlightProps {
  brandName: string;
  description: string;
  brandImage?: string;
  products: Product[];
  brandPageLink: string;
  locale: string;
  backgroundColor?: string;
}

export function BrandSpotlight({
  brandName,
  description,
  brandImage,
  products,
  brandPageLink,
  locale,
  backgroundColor = "bg-background",
}: BrandSpotlightProps) {
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

  return (
    <section className={`py-8 lg:py-12 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-2xl p-6 lg:p-8 mb-6 border border-border">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-3">
                {brandName}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm lg:text-base">
                {description}
              </p>
              <Link
                href={`/${locale}${brandPageLink}`}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base font-medium border-2 border-border bg-background text-foreground hover:bg-surface hover:border-primary rounded-lg focus-visible:border-primary focus-visible:outline-none"
              >
                Se alle produkter fra {brandName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            {brandImage && (
              <div className="relative h-48 lg:h-64 rounded-xl overflow-hidden bg-surface-muted">
                <ImageWithFallback
                  src={brandImage}
                  alt={brandName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-primary">
            Populære produkter
          </h3>
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
            className="flex gap-3 lg:gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[15%]"
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
