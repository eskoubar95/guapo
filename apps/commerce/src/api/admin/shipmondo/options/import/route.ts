import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { listShipmondoShippingOptionsForAdmin } from "../../lib/list-shipmondo-admin-options";
import { productCodeFromOptionData } from "../../lib/option-helpers";

type ImportBody = {
  exported_at?: string;
  options: Array<{
    product_code: string;
    name?: string;
    carrier_code?: string;
    flat_amount_minor?: number;
    price_bands?: { max_grams: number; amount_minor: number }[];
    medusa_option_id?: string;
  }>;
};

/**
 * POST /admin/shipmondo/options/import
 * Applies exported price fields to existing Shipmondo options (match by medusa_option_id, product_code, or type.code).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const payload = (req as MedusaRequest & { validatedBody: ImportBody }).validatedBody;
  const allOptions = await listShipmondoShippingOptionsForAdmin(req.scope);
  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as {
    updateShippingOptions: (id: string, update: { data?: Record<string, unknown> }) => Promise<unknown>;
  };

  const applied: string[] = [];
  const skipped: { product_code: string; reason: string }[] = [];

  for (const item of payload.options) {
    const code = item.product_code.trim();
    const byId =
      typeof item.medusa_option_id === "string" && item.medusa_option_id.length > 0
        ? allOptions.find((o) => o.id === item.medusa_option_id)
        : undefined;
    const match =
      byId ??
      allOptions.find((o) => productCodeFromOptionData(o.data) === code) ??
      allOptions.find((o) => o.type?.code === code);

    if (!match) {
      skipped.push({ product_code: code, reason: "no_matching_option" });
      continue;
    }

    const hasPricePatch =
      item.flat_amount_minor !== undefined ||
      (item.price_bands !== undefined && item.price_bands.length > 0);
    if (!hasPricePatch) {
      skipped.push({ product_code: code, reason: "no_price_fields_in_payload" });
      continue;
    }

    const current = (match.data ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...current };
    if (item.flat_amount_minor !== undefined) {
      next.flat_amount_minor = item.flat_amount_minor;
    }
    if (item.price_bands !== undefined && item.price_bands.length > 0) {
      next.price_bands = item.price_bands;
    }

    await fulfillmentModule.updateShippingOptions(match.id, { data: next });
    applied.push(code);
  }

  return res.json({ ok: true, applied, skipped });
};
