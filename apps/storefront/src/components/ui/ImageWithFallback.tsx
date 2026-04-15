"use client";

import { forwardRef, useState } from "react";

const FALLBACK_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjZThlY2YyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4=";

export interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  function ImageWithFallback(
    { src, alt, className, fallbackClassName, onError, onLoad, ...rest },
    ref,
  ) {
    const [errored, setErrored] = useState(false);

    if (errored || !src) {
      return (
        <div
          className={`inline-flex items-center justify-center bg-surface-muted ${className ?? ""} ${fallbackClassName ?? ""}`}
          role="img"
          aria-label={alt ?? "Image"}
        >
          <img src={FALLBACK_SRC} alt="" aria-hidden className="opacity-40" />
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt ?? ""}
        className={className}
        onError={(e) => {
          onError?.(e);
          setErrored(true);
        }}
        onLoad={(e) => {
          onLoad?.(e);
        }}
        {...rest}
      />
    );
  },
);
