"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

export interface ProductGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ProductGallery({ images, alt = "Product", className }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasImages = images.length > 0;
  const mainSrc = hasImages ? images[selectedIndex] : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {mainSrc ? (
          <ImageWithFallback
            src={mainSrc}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-muted"
            role="img"
            aria-label={alt}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((src, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                selectedIndex === index
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <ImageWithFallback
                src={src}
                alt={`${alt} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
