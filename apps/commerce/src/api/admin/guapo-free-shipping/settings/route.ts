import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { GUAPO_FREE_SHIPPING_MODULE } from "../../../../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../../../../modules/guapo-free-shipping/service";

const putBodySchema = z.object({
  threshold_amount: z.number().positive().optional(),
  promotion_code: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

/**
 * GET /admin/guapo-free-shipping/settings
 * Returns current free-shipping threshold and promotion code (Medusa-styret sandhed).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const settingsService = req.scope.resolve(
      GUAPO_FREE_SHIPPING_MODULE
    ) as GuapoFreeShippingModuleService;
    const settings = await settingsService.getSettingsOrDefaults();
    return res.json(settings);
  } catch (e) {
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Failed to load settings",
    });
  }
};

/**
 * POST /admin/guapo-free-shipping/settings
 * Body: { threshold_amount?, promotion_code?, enabled? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const parsed = putBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid body", issues: parsed.error.flatten() });
    }
    const settingsService = req.scope.resolve(
      GUAPO_FREE_SHIPPING_MODULE
    ) as GuapoFreeShippingModuleService;
    const updated = await settingsService.upsertSettings(parsed.data);
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Failed to update settings",
    });
  }
};
