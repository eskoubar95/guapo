import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listShipmondoShippingOptionsForAdmin } from "../../lib/list-shipmondo-admin-options";
import { productCodeFromOptionData } from "../../lib/option-helpers";

function readPriceBands(
  data: Record<string, unknown> | undefined
): { max_grams: number; amount_minor: number }[] | undefined {
  const raw = data?.price_bands;
  if (!Array.isArray(raw)) return undefined;
  const out: { max_grams: number; amount_minor: number }[] = [];
  for (const b of raw) {
    if (
      b &&
      typeof b === "object" &&
      typeof (b as { max_grams?: unknown }).max_grams === "number" &&
      typeof (b as { amount_minor?: unknown }).amount_minor === "number"
    ) {
      out.push({
        max_grams: Math.round((b as { max_grams: number }).max_grams),
        amount_minor: Math.round((b as { amount_minor: number }).amount_minor),
      });
    }
  }
  return out.length ? out : undefined;
}

/**
 * GET /admin/shipmondo/options/export
 * JSON snapshot of Shipmondo shipping option prices for sandbox → production migration.
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const rows = await listShipmondoShippingOptionsForAdmin(_req.scope);
  const options = rows
    .map((o) => {
      const d = (o.data ?? {}) as Record<string, unknown>;
      const product_code = productCodeFromOptionData(d) ?? o.type?.code ?? "";
      return {
        medusa_option_id: o.id,
        product_code,
        name: o.name,
        carrier_code: typeof d.carrier_code === "string" ? d.carrier_code : undefined,
        flat_amount_minor: typeof d.flat_amount_minor === "number" ? d.flat_amount_minor : undefined,
        price_bands: readPriceBands(d),
      };
    })
    .filter((x) => x.product_code.length > 0);

  return res.json({ exported_at: new Date().toISOString(), options });
};
