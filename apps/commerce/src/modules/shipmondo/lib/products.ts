import type { ShipmondoProduct, ShipmondoWeightInterval } from "../types";

/** Parse weight_intervals from API response (from_weight, to_weight, description). */
export function parseWeightIntervals(raw: unknown): ShipmondoWeightInterval[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ShipmondoWeightInterval[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const from = Number(o.from_weight);
    const to = Number(o.to_weight);
    if (!Number.isNaN(from) && !Number.isNaN(to) && from >= 0 && to >= 0) {
      out.push({
        from_weight: Math.round(from),
        to_weight: Math.round(to),
        description: typeof o.description === "string" ? o.description : undefined,
      });
    }
  }
  return out.length > 0 ? out : undefined;
}

/** Normalize raw product from API to ShipmondoProduct (incl. weight_intervals). */
export function normalizeProduct(
  p: Record<string, unknown> & { code: string; service_point_product: boolean }
): ShipmondoProduct {
  const product: ShipmondoProduct = {
    code: p.code,
    service_point_product: p.service_point_product,
    name: typeof p.name === "string" ? p.name : undefined,
    carrier_code: typeof p.carrier_code === "string" ? p.carrier_code : undefined,
  };
  const intervals = parseWeightIntervals(p.weight_intervals);
  if (intervals?.length) product.weight_intervals = intervals;
  return product;
}
