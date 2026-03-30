import type { Dictionary } from "@/i18n/dictionaries";

export interface ProductCardA11yLabels {
  addToCart: string;
  /** Navigate to product page (fallback CTA when no variant for quick-add) */
  viewProduct: string;
  addToWishlist: string;
  removeFromWishlist: string;
  outOfStock: string;
  /** Template with {{count}} */
  lowStockWithCount: string;
}

/** Prefer passing labels from `productCardA11yFromDict(dict)` at the page/section level. */
export function defaultProductCardA11y(locale: string): ProductCardA11yLabels {
  const en = locale === "en";
  return {
    addToCart: en ? "Add to cart" : "Læg i kurv",
    viewProduct: en ? "View product" : "Se produkt",
    addToWishlist: en ? "Add to wishlist" : "Tilføj til ønskeliste",
    removeFromWishlist: en ? "Remove from wishlist" : "Fjern fra ønskeliste",
    outOfStock: en ? "Out of stock" : "Ikke på lager",
    lowStockWithCount: en ? "Only {{count}} left in stock" : "Kun {{count}} tilbage på lager",
  };
}

export function productCardA11yFromDict(dict: Dictionary): ProductCardA11yLabels {
  return {
    addToCart: dict.products.addToCart,
    viewProduct: dict.products.viewDetails,
    addToWishlist: dict.wishlist.addToWishlist,
    removeFromWishlist: dict.wishlist.removeFromWishlist,
    outOfStock: dict.products.outOfStock,
    lowStockWithCount: dict.products.lowStockWithCount,
  };
}
