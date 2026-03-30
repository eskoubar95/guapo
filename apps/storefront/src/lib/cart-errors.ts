/**
 * Map Medusa / network errors from line-item updates to user-facing cart strings.
 */
export function userMessageForLineItemError(
  raw: string,
  notEnoughStock: string,
  quantityUpdateFailed: string
): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("inventory") ||
    lower.includes("stock") ||
    lower.includes("insufficient") ||
    lower.includes("not enough")
  ) {
    return notEnoughStock;
  }
  return quantityUpdateFailed;
}
