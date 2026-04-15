"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  addLabel?: string;
  removeLabel?: string;
  className?: string;
  iconClassName?: string;
}

export function WishlistButton({
  productId,
  addLabel = "Tilføj til ønskeliste",
  removeLabel = "Fjern fra ønskeliste",
  className,
  iconClassName,
}: WishlistButtonProps) {
  const { isInWishlist, toggle } = useWishlist();
  const inWishlist = isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      className={cn(
        "p-2 rounded-lg border border-border bg-background hover:bg-surface transition-colors",
        className
      )}
      aria-label={inWishlist ? removeLabel : addLabel}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground",
          iconClassName
        )}
      />
    </button>
  );
}
