/**
 * Removes legacy Shipmondo shipping options created by older seed (shared type code "pakkeshop"
 * for GLS/DAO/PostNord). Wizard- and sync-created options use type.code = Shipmondo product code
 * (e.g. GLSDK_SD) and are NOT deleted.
 *
 * Run: pnpm cleanup:shipmondo-seed-options
 *    or pnpm exec medusa exec ./src/scripts/cleanup-legacy-shipmondo-seed-options.ts
 */
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const LEGACY_SHIPPING_OPTION_TYPE_CODE = "pakkeshop";
const SHIPMONDO_PROVIDER_ID = "shipmondo_shipmondo";

type ShippingOptionRow = {
  id: string;
  name?: string;
  provider_id?: string;
  type?: { code?: string };
};

export default async function cleanupLegacyShipmondoSeedOptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT) as {
    listServiceZones: (f: object) => Promise<{ id: string; name: string }[]>;
    listShippingOptions: (f: object) => Promise<ShippingOptionRow[]>;
    deleteShippingOptions: (ids: string[]) => Promise<unknown>;
  };

  const { data: locData } = await query.graph({
    entity: "stock_location",
    filters: {},
    fields: ["fulfillment_sets.id"],
  });
  const locations = (locData ?? []) as { fulfillment_sets?: { id: string }[] }[];
  const setId = locations.find((l) => l.fulfillment_sets?.length)?.fulfillment_sets?.[0]?.id;
  if (!setId) {
    logger.warn("No stock location with fulfillment set found.");
    return;
  }

  const zones = await fulfillmentModule.listServiceZones({ fulfillment_set: { id: setId } });
  const dkZone = zones.find((z) => z.name === "Denmark" || z.name === "Denmark Zone");
  if (!dkZone) {
    logger.warn("Denmark service zone not found.");
    return;
  }

  const list = await fulfillmentModule.listShippingOptions({ service_zone: { id: dkZone.id } });

  const toDelete = list.filter(
    (r) =>
      r.provider_id === SHIPMONDO_PROVIDER_ID &&
      r.type?.code === LEGACY_SHIPPING_OPTION_TYPE_CODE
  );

  if (toDelete.length === 0) {
    logger.info("No legacy Shipmondo seed options (type code pakkeshop) to remove.");
    return;
  }

  try {
    await fulfillmentModule.deleteShippingOptions(toDelete.map((r) => r.id));
    logger.info(
      `Removed ${toDelete.length} legacy option(s): ${toDelete.map((r) => r.name ?? r.id).join(", ")}`
    );
  } catch (e) {
    logger.error(`Cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
    throw e;
  }
}
