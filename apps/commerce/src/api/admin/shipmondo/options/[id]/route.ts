import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * PATCH /admin/shipmondo/options/:id
 * Body: { data?: { price_bands?: { max_grams: number; amount_minor: number }[], flat_amount_minor?: number, service_codes?: string } }
 * Updates shipping option provider data (prices).
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Option id required" });
  const body = req.body as { data?: { price_bands?: { max_grams: number; amount_minor: number }[]; flat_amount_minor?: number; service_codes?: string } };
  const data = body?.data;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ message: "body.data required" });
  }

  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT) as unknown as {
    listShippingOptions: (f: object) => Promise<{ id: string; data?: Record<string, unknown> }[]>;
    updateShippingOptions: (id: string, update: { data?: Record<string, unknown> }) => Promise<unknown>;
  };
  const existing = await fulfillmentModule.listShippingOptions({ id: [id] });
  if (!existing?.length) {
    return res.status(404).json({ message: "Shipping option not found" });
  }
  const current = (existing[0] as { data?: Record<string, unknown> }).data ?? {};
  const merged = { ...current, ...data };

  await fulfillmentModule.updateShippingOptions(id, { data: merged });
  return res.json({ id, data: merged });
};
