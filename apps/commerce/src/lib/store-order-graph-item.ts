import { toAmountMajor } from "./store-order-money";

/**
 * Graph `order.items[]` is OrderItem (join): line prices are on `item` (OrderLineItem); quantity on `detail`.
 * Mirrors `formatOrder` in `@medusajs/order/dist/utils/transform-order.js`.
 */
export function flattenOrderItemFromGraph(row: Record<string, unknown>): Record<string, unknown> {
  const line = row.item as Record<string, unknown> | undefined;
  if (!line || typeof line !== "object") {
    return row;
  }
  const detail = row.detail as Record<string, unknown> | undefined;
  const quantity =
    typeof detail?.quantity === "number"
      ? detail.quantity
      : typeof row.quantity === "number"
        ? row.quantity
        : typeof line.quantity === "number"
          ? (line.quantity as number)
          : 1;
  return {
    ...line,
    id: String(line.id ?? row.id),
    quantity,
    title: (line.title ?? row.title) as string | undefined,
    variant_id: (line.variant_id ?? row.variant_id) as string | undefined,
    unit_price: detail?.unit_price ?? line.unit_price,
    raw_unit_price: detail?.raw_unit_price ?? line.raw_unit_price,
    total: line.total,
    raw_total: line.raw_total,
    item_total: line.item_total,
    metadata: line.metadata ?? row.metadata,
  };
}

export function resolveLineTotalMajor(
  item: Record<string, unknown>,
  unitPriceMajor: number | undefined,
  quantity: number
): number | undefined {
  const explicit = toAmountMajor(
    (item as { raw_total?: unknown; item_total?: unknown }).raw_total ??
      (item as { item_total?: unknown }).item_total ??
      item.total
  );
  if (explicit != null && explicit > 0) return explicit;
  if (unitPriceMajor != null) return unitPriceMajor * quantity;
  if (explicit != null) return explicit;
  return undefined;
}
