import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { GUAPO_FREE_SHIPPING_MODULE } from "../../../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../../../modules/guapo-free-shipping/service";

/**
 * GET /store/free-shipping-config
 * Public threshold + promotion code (no cart). Used when there is no cart cookie yet.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const settingsService = req.scope.resolve(
      GUAPO_FREE_SHIPPING_MODULE
    ) as GuapoFreeShippingModuleService;
    const settings = await settingsService.getSettingsOrDefaults();
    return res.json({
      threshold: settings.threshold_amount,
      enabled: settings.enabled,
      promotion_code: settings.promotion_code,
    });
  } catch (e) {
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Failed to load free shipping config",
      code: "FREE_SHIPPING_CONFIG_ERROR",
    });
  }
};
