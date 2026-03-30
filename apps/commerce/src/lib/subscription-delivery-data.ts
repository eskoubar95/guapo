/**
 * Persistable subset of Shipmondo / checkout shipping method `data` for subscriptions and renewals.
 */
const DELIVERY_DATA_KEYS = [
  "service_point_id",
  "service_point_name",
  "service_point_address",
  "service_point_zipcode",
  "service_point_city",
  "carrier_code",
  "service_codes",
] as const;

/**
 * Extract delivery (pakkeshop) payload from cart/order shipping method `data` for storage on subscription.
 */
export function extractDeliveryDataFromShippingMethodData(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const out: Record<string, unknown> = {};
  for (const k of DELIVERY_DATA_KEYS) {
    const v = data[k];
    if (v !== undefined && v !== null && v !== "") {
      out[k] = v;
    }
  }
  if (!out.service_point_id && !out.service_point_address) {
    return null;
  }
  return Object.keys(out).length ? out : null;
}

/** True when subscription renewal should keep order shipping lines and only sync contact fields from the customer. */
export function hasParcelShopDeliveryData(
  data: Record<string, unknown> | null | undefined
): boolean {
  return extractDeliveryDataFromShippingMethodData(data ?? undefined) != null;
}
