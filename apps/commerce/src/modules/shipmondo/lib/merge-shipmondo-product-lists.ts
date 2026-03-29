import type { ShipmondoProduct } from "../types";

/** Later lists overwrite earlier entries with the same product `code`. */
export function mergeShipmondoProductsByCode(lists: readonly ShipmondoProduct[][]): ShipmondoProduct[] {
  const m = new Map<string, ShipmondoProduct>();
  for (const list of lists) {
    for (const p of list) {
      if (p?.code) m.set(p.code, p);
    }
  }
  return [...m.values()];
}
