"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  brand: string;
  benefit: string;
  price: number;
  image: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  locale: string;
  className?: string;
}

export function ProductCard({ product, locale, className }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className={cn("group/card", className)}>
      <Link
        href={`/${locale}/products/${product.id}`}
        className="block relative"
      >
        <div className="aspect-[3/3.5] overflow-hidden rounded-lg mb-2 bg-surface-muted">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-2 right-2 p-2 bg-card rounded-full shadow-sm hover:bg-surface-muted transition-colors border-0 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={isFavorite ? "Fjern fra favoritter" : "Tilføj til favoritter"}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
        </button>
      </Link>

      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.brand}
        </p>
        <Link href={`/${locale}/products/${product.id}`}>
          <h3 className="text-sm font-medium text-foreground group-hover/card:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {product.benefit}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-foreground">
            {product.price} kr.
          </span>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              // TODO: add to cart
            }}
            aria-label="Læg i kurv"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
