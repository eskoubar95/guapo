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

/**
 * Pakkeshop / service-point product per Shipmondo GET /products:
 * - Legacy: `service_point_product`
 * - Current API: `service_point_required` (e.g. ShopDelivery)
 */
export function rawShipmondoProductIsServicePoint(p: Record<string, unknown>): boolean {
  if (p.service_point_product === true) return true;
  if (p.service_point_required === true) return true;
  return false;
}

/** Normalize raw product from API to ShipmondoProduct (incl. weight_intervals + services). */
export function normalizeProduct(p: Record<string, unknown> & { code: string }): ShipmondoProduct {
  const carrierObj = p.carrier;
  const carrierFromNested =
    carrierObj != null && typeof carrierObj === "object" && !Array.isArray(carrierObj)
      ? (carrierObj as Record<string, unknown>).code
      : undefined;
  const carrierCode =
    typeof p.carrier_code === "string"
      ? p.carrier_code
      : typeof carrierFromNested === "string"
        ? carrierFromNested
        : undefined;

  const product: ShipmondoProduct = {
    code: p.code,
    service_point_product: rawShipmondoProductIsServicePoint(p),
    name: typeof p.name === "string" ? p.name : undefined,
    carrier_code: carrierCode,
  };
  const intervals = parseWeightIntervals(p.weight_intervals);
  if (intervals?.length) product.weight_intervals = intervals;
  if (Array.isArray(p.required_services)) {
    product.required_services = parseServiceList(p.required_services);
  }
  if (Array.isArray(p.available_services)) {
    product.available_services = parseServiceList(p.available_services);
  }
  return product;
}

function parseServiceList(raw: unknown[]): Array<{ code: string; name?: string }> {
  return raw
    .filter((s): s is Record<string, unknown> => s != null && typeof s === "object")
    .filter((s) => typeof s.code === "string" && s.code.length > 0)
    .map((s) => ({
      code: s.code as string,
      ...(typeof s.name === "string" ? { name: s.name } : {}),
    }));
}
