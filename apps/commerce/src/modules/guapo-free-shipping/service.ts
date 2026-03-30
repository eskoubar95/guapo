import { MedusaService } from "@medusajs/framework/utils";
import { GuapoFreeShippingSetting } from "./models/guapo-free-shipping-setting";

export const GUAPO_FREE_SHIPPING_MODULE = "guapo_free_shipping";
export const GUAPO_FREE_SHIPPING_SETTING_ID = "guapo_frsp_default";

export type GuapoFreeShippingSettingsDTO = {
  threshold_amount: number;
  promotion_code: string;
  enabled: boolean;
};

const DEFAULTS: GuapoFreeShippingSettingsDTO = {
  threshold_amount: 499,
  promotion_code: "FREESHIPPING",
  enabled: true,
};

class GuapoFreeShippingModuleService extends MedusaService({
  GuapoFreeShippingSetting,
}) {
  async getSettingsOrDefaults(): Promise<GuapoFreeShippingSettingsDTO> {
    try {
      const rows = await this.listGuapoFreeShippingSettings(
        {},
        { take: 1 }
      );
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) {
        return {
          threshold_amount:
            typeof row.threshold_amount === "number" && row.threshold_amount > 0
              ? row.threshold_amount
              : DEFAULTS.threshold_amount,
          promotion_code:
            typeof row.promotion_code === "string" && row.promotion_code.trim() !== ""
              ? row.promotion_code.trim()
              : DEFAULTS.promotion_code,
          enabled: row.enabled !== false,
        };
      }
    } catch {
      /* use defaults */
    }
    return { ...DEFAULTS };
  }

  async upsertSettings(
    input: Partial<Pick<GuapoFreeShippingSettingsDTO, "threshold_amount" | "promotion_code" | "enabled">>
  ): Promise<GuapoFreeShippingSettingsDTO> {
    const current = await this.getSettingsOrDefaults();
    const next: GuapoFreeShippingSettingsDTO = {
      threshold_amount:
        typeof input.threshold_amount === "number" && input.threshold_amount > 0
          ? input.threshold_amount
          : current.threshold_amount,
      promotion_code:
        typeof input.promotion_code === "string" && input.promotion_code.trim() !== ""
          ? input.promotion_code.trim()
          : current.promotion_code,
      enabled: typeof input.enabled === "boolean" ? input.enabled : current.enabled,
    };

    const existing = await this.listGuapoFreeShippingSettings({}, { take: 5 });
    const rows = Array.isArray(existing) ? existing : [];
    const found = rows.some((r) => r.id === GUAPO_FREE_SHIPPING_SETTING_ID);

    if (found) {
      await this.updateGuapoFreeShippingSettings([
        {
          id: GUAPO_FREE_SHIPPING_SETTING_ID,
          threshold_amount: next.threshold_amount,
          promotion_code: next.promotion_code,
          enabled: next.enabled,
        },
      ]);
    } else {
      await this.createGuapoFreeShippingSettings([
        {
          id: GUAPO_FREE_SHIPPING_SETTING_ID,
          threshold_amount: next.threshold_amount,
          promotion_code: next.promotion_code,
          enabled: next.enabled,
        },
      ]);
    }
    return next;
  }
}

export default GuapoFreeShippingModuleService;
