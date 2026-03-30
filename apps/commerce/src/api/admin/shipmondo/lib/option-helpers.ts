/**
 * Shared helpers for Shipmondo shipping option admin routes.
 */

export function productCodeFromOptionData(data: Record<string, unknown> | undefined): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  if (typeof data.product_code === "string" && data.product_code.length > 0) return data.product_code;
  const rawId = data.id;
  if (typeof rawId === "string" && rawId.length > 0 && !rawId.startsWith("so_")) return rawId;
  return undefined;
}
