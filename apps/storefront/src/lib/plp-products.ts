import type { Product } from "@/components/ProductCard";
import { homeMockProducts } from "./home-mock";

/**
 * Map category handle to product handles (for mock data).
 * TODO: Replace with Medusa category_id → products when wired.
 */
const categoryToProductHandles: Record<string, string[]> = {
  skincare: [
    "gentle-cleanser",
    "exfoliating-toner",
    "vitamin-c-serum",
    "niacinamide-serum",
    "hydrating-moisturizer",
    "nourishing-night-cream",
    "eye-revive-cream",
    "daily-spf-50",
  ],
  cleansers: ["gentle-cleanser", "exfoliating-toner"],
  serums: ["vitamin-c-serum", "niacinamide-serum"],
  moisturizers: ["hydrating-moisturizer", "nourishing-night-cream", "eye-revive-cream"],
  spf: ["daily-spf-50"],
};

/** Product id → handle for PDP routing (aligns with PDP placeholder handles where possible) */
const productIdToHandle: Record<string, string> = {
  "1": "gentle-cleanser",
  "2": "hydrating-moisturizer",
  "3": "vitamin-c-serum",
  "4": "daily-spf-50",
  "5": "eye-revive-cream",
  "6": "nourishing-night-cream",
  "7": "exfoliating-toner",
  "8": "niacinamide-serum",
};

const handleToProductId = Object.fromEntries(
  Object.entries(productIdToHandle).map(([k, v]) => [v, k])
);

function getProductByHandle(handle: string): Product | undefined {
  const id = handleToProductId[handle];
  if (!id) return undefined;
  const p = homeMockProducts.find((x) => x.id === id);
  if (!p) return undefined;
  return { ...p, id: handle };
}

/**
 * Get products for a category handle. Uses mock data; will switch to Medusa when wired.
 */
export function getProductsForCategory(
  categoryHandle: string,
  _filters?: Record<string, string[]>,
  sort?: string
): { products: Product[]; total: number } {
  const handles = categoryToProductHandles[categoryHandle];
  let products: Product[] = handles
    ? handles.map((h) => getProductByHandle(h)).filter((p): p is Product => !!p)
    : [...homeMockProducts].map((p) => ({
        ...p,
        id: productIdToHandle[p.id] ?? p.id,
      }));

  if (sort) {
    switch (sort) {
      case "price-asc":
        products = [...products].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products = [...products].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        // Mock: keep order
        break;
      default:
        break;
    }
  }

  return { products, total: products.length };
}
