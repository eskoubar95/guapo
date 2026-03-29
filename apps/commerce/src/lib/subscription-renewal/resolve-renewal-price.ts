import type { QueryService } from "../container-types";

export type OrigTaxLine = {
  description: string;
  tax_rate_id: string | null;
  code: string;
  rate: number;
  provider_id: string;
};

type OrigLineItem = {
  variant_id: string;
  unit_price: number | string;
  is_tax_inclusive?: boolean;
  tax_lines?: Array<{
    description: string;
    tax_rate_id: string | null;
    code: string;
    rate: number | string;
    provider_id: string;
  }>;
};

/**
 * Loads original line item price and tax lines from the subscription's initial order.
 */
export async function resolveRenewalPricingFromInitialOrder(
  query: QueryService,
  initialOrderId: string | undefined,
  variantId: string
): Promise<{
  rawPriceDkk: number;
  origIsTaxInclusive: boolean;
  origTaxLines: OrigTaxLine[];
}> {
  let rawPriceDkk = 0;
  let origIsTaxInclusive = false;
  let origTaxLines: OrigTaxLine[] = [];

  if (!initialOrderId) {
    return { rawPriceDkk, origIsTaxInclusive, origTaxLines };
  }

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.variant_id",
        "items.unit_price",
        "items.is_tax_inclusive",
        "items.tax_lines.description",
        "items.tax_lines.tax_rate_id",
        "items.tax_lines.code",
        "items.tax_lines.rate",
        "items.tax_lines.provider_id",
      ],
      filters: { id: initialOrderId },
    });
    const order = orders?.[0] as { items?: OrigLineItem[] } | undefined;
    const line = order?.items?.find((i) => i.variant_id === variantId);
    if (line && line.unit_price !== undefined && line.unit_price !== null) {
      const p = typeof line.unit_price === "string" ? parseFloat(line.unit_price) : line.unit_price;
      if (!isNaN(p) && p > 0) {
        rawPriceDkk = p;
      }
      origIsTaxInclusive = line.is_tax_inclusive === true;
      if (line.tax_lines && line.tax_lines.length > 0) {
        origTaxLines = line.tax_lines.map((tl) => ({
          description: tl.description || "Moms",
          tax_rate_id: tl.tax_rate_id ?? null,
          code: tl.code || "",
          rate: typeof tl.rate === "string" ? parseFloat(tl.rate) : (tl.rate ?? 25),
          provider_id: tl.provider_id || "system",
        }));
      }
    }
  } catch {
    /* ignore */
  }

  if (origTaxLines.length === 0) {
    origTaxLines = [
      { description: "Moms", tax_rate_id: null, code: "", rate: 25, provider_id: "system" },
    ];
  }

  return { rawPriceDkk, origIsTaxInclusive, origTaxLines };
}
