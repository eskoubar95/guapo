import type { Dictionary } from "@/i18n/dictionaries";

export interface ProductCardA11yLabels {
  addToCart: string;
  addToWishlist: string;
  removeFromWishlist: string;
}

/** Prefer passing labels from `productCardA11yFromDict(dict)` at the page/section level. */
export function defaultProductCardA11y(locale: string): ProductCardA11yLabels {
  const en = locale === "en";
  return {
    addToCart: en ? "Add to cart" : "Læg i kurv",
    addToWishlist: en ? "Add to wishlist" : "Tilføj til ønskeliste",
    removeFromWishlist: en ? "Remove from wishlist" : "Fjern fra ønskeliste",
  };
}

export function productCardA11yFromDict(dict: Dictionary): ProductCardA11yLabels {
  return {
    addToCart: dict.products.addToCart,
    addToWishlist: dict.wishlist.addToWishlist,
    removeFromWishlist: dict.wishlist.removeFromWishlist,
  };
}
