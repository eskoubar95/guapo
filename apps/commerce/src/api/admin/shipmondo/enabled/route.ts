import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";

type ConfigService = {
  listShipmondoEnabledProducts: (filters: object) => Promise<{ id: string; product_code: string; carrier_name: string; enabled: boolean; display_order: number | null }[]>;
  createShipmondoEnabledProducts: (data: { product_code: string; carrier_name: string; enabled?: boolean; display_order?: number }[]) => Promise<unknown[]>;
  updateShipmondoEnabledProducts: (data: { id: string; enabled?: boolean; display_order?: number }[]) => Promise<unknown[]>;
};

/**
 * GET /admin/shipmondo/enabled
 * Returns enabled Shipmondo products from DB (shipmondo_enabled_products).
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  try {
    const config = _req.scope.resolve(SHIPMONDO_CONFIG_MODULE) as ConfigService;
    const list = await config.listShipmondoEnabledProducts({});
    const items = Array.isArray(list) ? list : [];
    return res.json({ enabled: items });
  } catch {
    return res.json({ enabled: [] });
  }
};

/**
 * PUT /admin/shipmondo/enabled
 * Body: { product_code, carrier_name, enabled } or { product_codes: [{ product_code, carrier_name, enabled }] }
 * Upserts enabled state. If record exists (by product_code), updates enabled; else creates.
 */
type EnabledPutBody = {
  product_code?: string;
  carrier_name?: string;
  enabled?: boolean;
  product_codes?: { product_code: string; carrier_name?: string; enabled?: boolean }[];
};

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const config = req.scope.resolve(SHIPMONDO_CONFIG_MODULE) as ConfigService;
    const body =
      (req as MedusaRequest & { validatedBody?: EnabledPutBody }).validatedBody ?? (req.body as EnabledPutBody);
    if (body.product_codes && Array.isArray(body.product_codes)) {
      const existing = await config.listShipmondoEnabledProducts({});
      const byCode = new Map((Array.isArray(existing) ? existing : []).map((e) => [e.product_code, e]));
      const toUpdate: { id: string; enabled: boolean }[] = [];
      const toCreate: { product_code: string; carrier_name: string; enabled: boolean }[] = [];
      for (const row of body.product_codes) {
        if (!row?.product_code) continue;
        const cur = byCode.get(row.product_code);
        if (cur) toUpdate.push({ id: cur.id, enabled: row.enabled ?? true });
        else toCreate.push({ product_code: row.product_code, carrier_name: row.carrier_name ?? row.product_code, enabled: row.enabled ?? true });
      }
      if (toUpdate.length) await config.updateShipmondoEnabledProducts(toUpdate);
      if (toCreate.length) await config.createShipmondoEnabledProducts(toCreate);
      return res.json({ ok: true });
    }
    const { product_code, carrier_name, enabled } = body;
    if (!product_code || typeof product_code !== "string") {
      return res.status(400).json({ message: "product_code required" });
    }
    const existing = await config.listShipmondoEnabledProducts({});
    const list = Array.isArray(existing) ? existing : [];
    const cur = list.find((e) => e.product_code === product_code);
    if (cur) {
      await config.updateShipmondoEnabledProducts([{ id: cur.id, enabled: enabled ?? true }]);
    } else {
      await config.createShipmondoEnabledProducts([{ product_code, carrier_name: carrier_name ?? product_code, enabled: enabled ?? true }]);
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: e instanceof Error ? e.message : "Failed to update enabled" });
  }
};
