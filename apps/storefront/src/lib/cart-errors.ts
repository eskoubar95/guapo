/**
 * Medusa Store API often responds 400 with a message like
 * "Some variant does not have the required inventory" (logged as `info` on the commerce server).
 */
export function isMedusaInventoryCartErrorMessage(message: string | undefined): boolean {
  const msg = (message ?? "").trim().toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("inventory") ||
    msg.includes("stock") ||
    msg.includes("not enough") ||
    msg.includes("out of stock") ||
    msg.includes("required inventory")
  );
}

/**
 * Map Medusa cart line errors to storefront copy (never show raw English to users for known cases).
 */
export function userMessageForLineItemError(
  rawMessage: string | undefined,
  inventoryFallback: string,
  genericFallback: string
): string {
  const msg = (rawMessage ?? "").trim();
  if (!msg) return genericFallback;
  const m = msg.toLowerCase();
  if (
    m.includes("inventory") ||
    m.includes("stock") ||
    m.includes("not enough") ||
    m.includes("out of stock") ||
    m.includes("required inventory")
  ) {
    return inventoryFallback;
  }
  if (msg.length > 160) return genericFallback;
  return msg;
}
