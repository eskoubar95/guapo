import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import type { ShipmondoProduct } from "./types";

const PROVIDER_ID = "shipmondo_shipmondo";

export type ShipmondoProductSyncItem = {
  product: ShipmondoProduct;
  service_codes: string;
};

/**
 * Create/update Medusa shipping options for Shipmondo products (Denmark zone).
 * Merges into existing option `data` so prices (flat / bands) are preserved.
 */
export async function upsertShipmondoShippingOptions(
  scope: MedusaContainer,
  items: ShipmondoProductSyncItem[]
): Promise<{ created: number; updated: number; errors: string[] }> {
  if (items.length === 0) return { created: 0, updated: 0, errors: [] };

  const logger = scope.resolve(ContainerRegistrationKeys.LOGGER) as { warn: (msg: string) => void };
  const errors: string[] = [];

  const fulfillmentModule = scope.resolve(Modules.FULFILLMENT) as {
    listServiceZones: (f: object) => Promise<{ id: string; name: string }[]>;
    listShippingProfiles: (f: object) => Promise<{ id: string; name: string; type?: string }[]>;
    listShippingOptions: (f: object) => Promise<{ id: string; type?: { code?: string }; data?: Record<string, unknown> }[]>;
    updateShippingOptions: (id: string, update: { data?: Record<string, unknown> }) => Promise<unknown>;
  };
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: { entity: string; filters: object; fields: string[] }) => Promise<{ data: unknown[] }>;
  };

  const { data: locData } = await query.graph({
    entity: "stock_location",
    filters: {},
    fields: ["fulfillment_sets.id"],
  });
  const locations = (locData ?? []) as { fulfillment_sets?: { id: string }[] }[];
  const loc = locations.find((l) => l.fulfillment_sets?.length) ?? locations[0];
  if (!loc?.fulfillment_sets?.length) {
    throw new Error("No stock location with fulfillment set. Run seed first.");
  }
  const shippingSetId = loc.fulfillment_sets[0].id;

  const zones = await fulfillmentModule.listServiceZones({ fulfillment_set: { id: shippingSetId } });
  const dkZone = zones.find((z) => z.name === "Denmark" || z.name === "Denmark Zone");
  if (!dkZone) {
    throw new Error("Denmark service zone not found. Run seed first.");
  }

  const profiles = await fulfillmentModule.listShippingProfiles({});
  const defaultProfile = profiles.find((p) => p.name === "Default" || p.type === "default") ?? profiles[0];
  if (!defaultProfile) {
    throw new Error("No shipping profile found. Run seed first.");
  }

  const existingOptions = await fulfillmentModule.listShippingOptions({ service_zone: { id: dkZone.id } });
  const byTypeCode = new Map<string, (typeof existingOptions)[0]>();
  for (const o of existingOptions) {
    const code = (o as { type?: { code?: string } }).type?.code ?? o.id;
    byTypeCode.set(code, o);
  }

  let created = 0;
  let updated = 0;

  for (const { product, service_codes } of items) {
    const optionDataCore = {
      id: product.code,
      name: product.name ?? product.code,
      product_code: product.code,
      service_codes,
      ...(product.carrier_code ? { carrier_code: product.carrier_code } : {}),
      ...(product.weight_intervals?.length ? { weight_intervals: product.weight_intervals } : {}),
    };
    const name = product.name ?? product.code;
    const typeCode = product.code;
    const existing = byTypeCode.get(typeCode);

    if (existing) {
      const previous = (existing.data ?? {}) as Record<string, unknown>;
      const optionData = { ...previous, ...optionDataCore };
      try {
        await fulfillmentModule.updateShippingOptions(existing.id, { data: optionData });
        updated++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const line = `update ${product.code}: ${msg}`;
        errors.push(line);
        logger.warn(`[shipmondo] upsert shipping option ${line}`);
      }
    } else {
      try {
        await createShippingOptionsWorkflow(scope).run({
          input: [
            {
              name,
              service_zone_id: dkZone.id,
              shipping_profile_id: defaultProfile.id,
              provider_id: PROVIDER_ID,
              type: { label: name, description: product.carrier_code ?? name, code: typeCode },
              price_type: "calculated",
              data: optionDataCore,
            },
          ],
        });
        created++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const line = `create ${product.code}: ${msg}`;
        errors.push(line);
        logger.warn(`[shipmondo] upsert shipping option ${line}`);
      }
    }
  }

  return { created, updated, errors };
}
