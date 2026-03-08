"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useTransition } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { addToCart } from "@/lib/cart";
import { useAddToCartModal } from "@/contexts/AddToCartModalContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  brand: string;
  /** Brand handle for link to /[locale]/brands/[handle] */
  brandHandle?: string;
  benefit: string;
  price: number;
  image: string;
  variant?: string;
  /** Medusa variant ID; when set, add-to-cart button adds directly and opens cart modal */
  variantId?: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  locale: string;
  className?: string;
}

export function ProductCard({ product, locale, className }: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const { openModal } = useAddToCartModal();
  const { refreshCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const productHref = `/${locale}/products/${product.id}`;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const vid = product.variantId;
    if (!vid) return;
    startTransition(async () => {
      try {
        const cart = await addToCart(vid, 1) as {
          items?: Array<{ id?: string; product_title?: string; title?: string; variant_title?: string; thumbnail?: string; unit_price?: number; quantity?: number; metadata?: Record<string, unknown> }>;
          total?: number;
        } | undefined;
        await refreshCart();
        if (cart?.items?.length) {
          const last = cart.items[cart.items.length - 1];
          openModal({
            productTitle: last.product_title ?? last.title ?? product.name,
            variantTitle: last.variant_title ?? product.variant,
            thumbnail: last.thumbnail ?? product.image,
            quantity: last.quantity ?? 1,
            unitPrice: last.unit_price ?? product.price,
            cartTotal: cart.total ?? 0,
            itemCount: cart.items.length,
            lineItemId: last.id,
            metadata: last.metadata,
          });
        }
      } catch {
        // Error: could toast or leave silent
      }
    });
  };
  const brandHref = product.brandHandle ? `/${locale}/brands/${product.brandHandle}` : null;

  return (
    <article className={cn("group/card flex flex-col h-full", className)}>
      {/* Image — link to product */}
      <Link href={productHref} className="block relative mb-3">
        <div className="aspect-square overflow-hidden rounded-md bg-surface">
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
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors border-0 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={inWishlist ? "Fjern fra ønskeliste" : "Tilføj til ønskeliste"}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              inWishlist ? "fill-red-500 text-red-500" : "text-text-muted"
            )}
          />
        </button>
      </Link>

      {/* Text content — flex-1 pushes price to bottom */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Variant (e.g. "30 ml") */}
        {product.variant && (
          <p style={{ fontSize: "11px", lineHeight: "14px" }} className="text-text-muted mb-3">
            {product.variant}
          </p>
        )}

        {/* Brand — link to brand page when we have handle */}
        {product.brand && (
          brandHref ? (
            <Link
              href={brandHref}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: "12px", lineHeight: "16px" }}
              className="text-text-primary mb-0.5 hover:text-primary hover:underline underline-offset-1 transition-colors w-fit"
            >
              {product.brand}
            </Link>
          ) : (
            <p style={{ fontSize: "12px", lineHeight: "16px" }} className="text-text-primary mb-0.5">
              {product.brand}
            </p>
          )
        )}

        {/* Title — link to product */}
        <Link href={productHref} className="block group-hover/card:text-primary transition-colors">
          <p style={{ fontSize: "13px", lineHeight: "18px" }} className="font-semibold text-text-primary line-clamp-2">
            {product.name}
          </p>
        </Link>

        {/* Subtitle / benefit */}
        {(product.subtitle || product.benefit) && (
          <p style={{ fontSize: "11px", lineHeight: "15px" }} className="text-text-secondary mt-3 line-clamp-2">
            {product.subtitle || product.benefit}
          </p>
        )}

        {/* Price + add to cart — mt-auto ensures bottom alignment across cards */}
        <div className="flex items-center justify-between mt-auto pt-5">
          <span style={{ fontSize: "13px" }} className="font-semibold text-text-primary tabular-nums">
            {new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(product.price)}
          </span>
          {product.variantId ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPending}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-70"
              aria-label="Læg i kurv"
            >
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </button>
          ) : (
            <Link
              href={productHref}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label="Læg i kurv"
            >
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
