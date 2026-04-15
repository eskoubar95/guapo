import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { GUAPO_FREE_SHIPPING_MODULE } from "../modules/guapo-free-shipping";
import type GuapoFreeShippingModuleService from "../modules/guapo-free-shipping/service";

/**
 * One-time script: sets the free-shipping promotion to is_automatic=false
 * so Medusa's promotion engine does not re-apply it during cart.complete.
 * Reads the promotion_code from the guapo-free-shipping settings module.
 *
 * Usage: npx medusa exec ./src/scripts/fix-freeshipping-promotion.ts
 */
export default async function fixFreeShippingPromotion({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info?: (m: string) => void;
    warn?: (m: string) => void;
  };
  const log = (msg: string) =>
    logger?.info?.(msg) ?? console.log(`[fix-freeshipping] ${msg}`);

  const settingsService = container.resolve(
    GUAPO_FREE_SHIPPING_MODULE
  ) as GuapoFreeShippingModuleService;
  const settings = await settingsService.getSettingsOrDefaults();
  const configuredCode = settings.promotion_code.trim().toUpperCase();
  log(`Settings: threshold=${settings.threshold_amount}, code=${configuredCode}, enabled=${settings.enabled}`);

  const promotionModule = container.resolve(Modules.PROMOTION) as {
    listPromotions: (
      filters: { code?: string[] },
      config?: { take?: number }
    ) => Promise<
      Array<{ id: string; code: string; is_automatic?: boolean; status?: string }>
    >;
    updatePromotions: (
      data: Array<{ id: string; is_automatic?: boolean }>
    ) => Promise<unknown>;
  };

  const codes = [configuredCode];
  if (!codes.includes("FREESHIPPING")) codes.push("FREESHIPPING");

  const matches = await promotionModule.listPromotions(
    { code: codes },
    { take: 10 }
  );

  if (!matches.length) {
    log("No FREESHIPPING promotion found. Nothing to do.");
    return;
  }

  for (const promo of matches) {
    if (promo.is_automatic === false) {
      log(
        `FREESHIPPING promotion ${promo.id} already is_automatic=false. Skipping.`
      );
      continue;
    }

    await promotionModule.updatePromotions([
      { id: promo.id, is_automatic: false },
    ]);
    log(
      `Set FREESHIPPING promotion ${promo.id} to is_automatic=false. ` +
        `Free shipping is now managed only via GUAPO_FREE_SHIPPING adjustments.`
    );
  }
}
