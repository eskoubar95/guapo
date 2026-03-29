/**
 * Link Shipmondo fulfillment provider to existing stock location(s).
 * Use when Shipmondo does not appear as "connected" under Locations → [location] → Fulfillment providers.
 * Requires: SHIPMONDO_API_USER + SHIPMONDO_API_KEY or SHIPMONDO_SHIPPING_MODULE_KEY in .env (so the provider is registered).
 *
 * Run: pnpm exec medusa exec ./src/scripts/link-shipmondo-to-location.ts
 * Or add to package.json: "link:shipmondo": "medusa exec ./src/scripts/link-shipmondo-to-location.ts"
 */
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function linkShipmondoToLocation({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  const hasShipmondo =
    !!(process.env.SHIPMONDO_API_USER && process.env.SHIPMONDO_API_KEY) ||
    !!process.env.SHIPMONDO_SHIPPING_MODULE_KEY;

  if (!hasShipmondo) {
    logger.warn("Shipmondo env not set (SHIPMONDO_API_USER+API_KEY or SHIPMONDO_SHIPPING_MODULE_KEY). Provider may not be registered.");
  }

  const locations = await stockLocationModule.listStockLocations({});
  if (!locations?.length) {
    logger.warn("No stock locations found. Create a location in Admin first.");
    return;
  }

  for (const loc of locations) {
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: loc.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "shipmondo_shipmondo" },
      });
      logger.info(`Linked Shipmondo to location: ${loc.name} (${loc.id})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("unique")) {
        logger.info(`Shipmondo already linked to ${loc.name}`);
      } else {
        logger.warn(`Could not link Shipmondo to ${loc.name}: ${msg}`);
      }
    }
  }
}
