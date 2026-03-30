import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { productCodeFromOptionData } from "../../lib/option-helpers";

const SHIPMONDO_PROVIDER_ID = "shipmondo_shipmondo";
const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";

type PatchBody = {
  name?: string;
  data?: {
    price_bands?: { max_grams: number; amount_minor: number }[];
    flat_amount_minor?: number;
    service_codes?: string;
  };
};

/**
 * PATCH /admin/shipmondo/options/:id
 * Body: { name?: string, data?: { price_bands?, flat_amount_minor?, service_codes? } }
 * Merges `data` into existing provider JSON; optional `name` updates the shipping option display name.
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Option id required" });
  const body = (req as MedusaRequest & { validatedBody?: PatchBody }).validatedBody ?? (req.body as PatchBody);
  const data = body?.data;
  const nameTrimmed = typeof body.name === "string" ? body.name.trim() : "";
  const hasDataPatch =
    data != null &&
    typeof data === "object" &&
    Object.keys(data).some((k) => {
      const v = (data as Record<string, unknown>)[k];
      if (v === undefined) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.length > 0;
      return true;
    });

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as unknown as {
    listShippingOptions: (f: object) => Promise<{ id: string; name?: string; data?: Record<string, unknown> }[]>;
    updateShippingOptions: (
      id: string,
      update: { data?: Record<string, unknown>; name?: string }
    ) => Promise<unknown>;
  };
  const existing = await fulfillmentModule.listShippingOptions({ id: [id] });
  if (!existing?.length) {
    return res.status(404).json({ message: "Shipping option not found" });
  }
  const optRow = existing[0] as {
    provider_id?: string;
    data?: Record<string, unknown>;
    name?: string;
  };
  if (optRow.provider_id !== SHIPMONDO_PROVIDER_ID) {
    return res.status(403).json({ message: "Only Shipmondo shipping options can be updated from this endpoint" });
  }
  const row = optRow;
  const current = row.data ?? {};
  const merged = hasDataPatch ? { ...current, ...data! } : current;

  const updatePayload: { data: Record<string, unknown>; name?: string } = { data: merged };
  if (nameTrimmed) {
    updatePayload.name = nameTrimmed;
  }

  await fulfillmentModule.updateShippingOptions(id, updatePayload);
  return res.json({ id, name: nameTrimmed || row.name, data: merged });
};

/**
 * DELETE /admin/shipmondo/options/:id
 * Removes a Shipmondo provider shipping option and the matching `shipmondo_enabled_products` row when present.
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Option id required" });

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as unknown as {
    listShippingOptions: (f: object) => Promise<{ id: string; provider_id?: string; data?: Record<string, unknown> }[]>;
    deleteShippingOptions: (ids: string[]) => Promise<unknown>;
  };

  const existing = await fulfillmentModule.listShippingOptions({ id: [id] });
  if (!existing?.length) {
    return res.status(404).json({ message: "Shipping option not found" });
  }
  const opt = existing[0];
  if (opt.provider_id !== SHIPMONDO_PROVIDER_ID) {
    return res.status(403).json({ message: "Only Shipmondo shipping options can be deleted from this endpoint" });
  }

  const productCode = productCodeFromOptionData(opt.data);
  try {
    const config = req.scope.resolve(SHIPMONDO_CONFIG_MODULE) as {
      listShipmondoEnabledProducts: (f: object) => Promise<{ id: string; product_code: string }[]>;
      deleteShipmondoEnabledProducts?: (ids: string[]) => Promise<unknown>;
    };
    if (productCode && typeof config.deleteShipmondoEnabledProducts === "function") {
      const rows = await config.listShipmondoEnabledProducts({});
      const row = Array.isArray(rows) ? rows.find((r) => r.product_code === productCode) : undefined;
      if (row?.id) {
        await config.deleteShipmondoEnabledProducts([row.id]);
      }
    }
  } catch {
    /* enabled table optional */
  }

  await fulfillmentModule.deleteShippingOptions([id]);
  return res.status(200).json({ id, deleted: true });
};
