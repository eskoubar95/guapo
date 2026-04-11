"use client";

import Link from "next/link";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { useTransition } from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { addToCart } from "@/lib/cart";
import {
  getCartItemsTotal,
  getLineUnitPrice,
} from "@/lib/cart-display";
import type { StoreCart } from "@/lib/cart-data";
import { fetchClientStoreCart, resolveAddedLineItem } from "@/lib/fetch-client-cart";
import { useAddToCartModal } from "@/contexts/AddToCartModalContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import {
  type ProductCardA11yLabels,
  defaultProductCardA11y,
} from "@/components/product-card-a11y";
import { formatLowStockLabel } from "@/lib/product-inventory";
import { toast } from "sonner";

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
  /** When false, quick-add is hidden (from Medusa inventory when tracked). */
  inStock?: boolean;
  lowStock?: boolean;
  /** Remaining quantity when inventory is tracked and low */
  stockCount?: number | null;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  locale: string;
  className?: string;
  /** Screen reader labels; from `productCardA11yFromDict(dict)` when dictionary is available. */
  labels?: ProductCardA11yLabels;
}

export function ProductCard({ product, locale, className, labels }: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const { openModal } = useAddToCartModal();
  const { refreshCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const productHref = `/${locale}/products/${product.id}`;
  const inWishlist = isInWishlist(product.id);
  const a11y = labels ?? defaultProductCardA11y(locale);
  const inStock = product.inStock !== false;
  const lowStockBadge =
    inStock &&
    product.lowStock &&
    product.stockCount != null &&
    product.stockCount > 0
      ? formatLowStockLabel(a11y.lowStockWithCount, product.stockCount)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const vid = product.variantId;
    if (!vid) return;
    startTransition(async () => {
      let addCart: StoreCart | undefined;
      try {
        addCart = (await addToCart(vid, 1)) as StoreCart | undefined;
      } catch (err) {
        console.error("[ProductCard] quick add failed", err);
        toast.error(
          locale === "da" ? "Kunne ikke tilføje til kurven" : "Could not add to cart"
        );
        return;
      }
      try {
        await refreshCart();
        const cart = (await fetchClientStoreCart()) ?? addCart;
        const last = resolveAddedLineItem(cart, addCart, vid);
        if (cart?.items?.length && last) {
          const unit = getLineUnitPrice(last);
          openModal({
            productTitle: last.product_title ?? last.title ?? product.name,
            variantTitle: last.variant_title ?? product.variant,
            thumbnail: last.thumbnail ?? product.image,
            quantity: last.quantity ?? 1,
            unitPrice: unit ?? product.price,
            cartTotal: getCartItemsTotal(cart),
            itemCount: cart.items.length,
            lineItemId: last.id,
            metadata: last.metadata,
          });
        }
      } catch (err) {
        console.error("[ProductCard] cart sync after add failed", err);
        toast.error(
          locale === "da" ? "Kunne ikke opdatere kurven" : "Could not refresh cart"
        );
      }
    });
  };
  const brandHref = product.brandHandle ? `/${locale}/brands/${product.brandHandle}` : null;

  return (
    <article className={cn("group/card flex flex-col h-full", className)}>
      <div className="relative mb-3">
        <Link href={productHref} className="block relative">
          <div className="aspect-square overflow-hidden rounded-md bg-surface relative">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className={cn(
                "w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300",
                !inStock && "opacity-60"
              )}
            />
            {lowStockBadge && (
              <span className="absolute bottom-2 left-2 right-2 rounded-md bg-amber-950/90 px-2 py-1 text-center text-[11px] font-medium text-amber-50">
                {lowStockBadge}
              </span>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors border-0 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={inWishlist ? a11y.removeFromWishlist : a11y.addToWishlist}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              inWishlist ? "fill-red-500 text-red-500" : "text-text-muted"
            )}
          />
        </button>
      </div>

      {/* Text content — flex-1 pushes price to bottom */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Variant (e.g. "30 ml") */}
        {product.variant && (
          <p className="text-[11px] leading-[14px] text-text-muted mb-3">
            {product.variant}
          </p>
        )}

        {/* Brand — link to brand page when we have handle */}
        {product.brand && (
          brandHref ? (
            <Link
              href={brandHref}
              onClick={(e) => e.stopPropagation()}
              className="text-xs leading-4 text-text-primary mb-0.5 hover:text-primary hover:underline underline-offset-1 transition-colors w-fit"
            >
              {product.brand}
            </Link>
          ) : (
            <p className="text-xs leading-4 text-text-primary mb-0.5">
              {product.brand}
            </p>
          )
        )}

        {/* Title — link to product */}
        <Link href={productHref} className="block group-hover/card:text-primary transition-colors">
          <p className="text-[13px] leading-[18px] font-semibold text-text-primary line-clamp-2">
            {product.name}
          </p>
        </Link>

        {/* Subtitle / benefit */}
        {(product.subtitle || product.benefit) && (
          <p className="text-[11px] leading-[15px] text-text-secondary mt-3 line-clamp-2">
            {product.subtitle || product.benefit}
          </p>
        )}

        {/* Price + add to cart — mt-auto ensures bottom alignment across cards */}
        <div className="flex items-center justify-between mt-auto pt-5 gap-2">
          <span className="text-[13px] font-semibold text-text-primary tabular-nums">
            {new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(product.price)}
          </span>
          {!inStock ? (
            <span className="text-[11px] font-medium text-text-muted text-right leading-tight max-w-[7rem]">
              {a11y.outOfStock}
            </span>
          ) : product.variantId ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPending}
              aria-busy={isPending}
              className={cn(
                "w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                isPending
                  ? "cursor-wait"
                  : "hover:bg-primary-hover disabled:opacity-70"
              )}
              aria-label={a11y.addToCart}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" aria-hidden />
              ) : (
                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              )}
            </button>
          ) : (
            <Link
              href={productHref}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 shrink-0 rounded-full bg-primary flex items-center justify-center hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              aria-label={a11y.viewProduct}
            >
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
