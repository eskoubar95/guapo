import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import { fetchShipmondoProducts } from "./fetch-products";
import type { ShipmondoProduct } from "./types";

const SHIPMONDO_CONFIG_MODULE = "shipmondo_config";
const PROVIDER_ID = "shipmondo_shipmondo";

export type RunShipmondoSyncResult = { created: number; updated: number; message: string };

/**
 * Run sync: fetch products from Shipmondo, filter by enabled, create/update shipping options.
 * scope = Medusa container (e.g. req.scope or ExecArgs container).
 */
export async function runShipmondoSync(scope: MedusaContainer): Promise<RunShipmondoSyncResult> {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    return { created: 0, updated: 0, message: "SHIPMONDO_API_USER and SHIPMONDO_API_KEY required" };
  }

  const fulfillmentModule = scope.resolve(Modules.FULFILLMENT) as {
    listServiceZones: (f: object) => Promise<{ id: string; name: string }[]>;
    listShippingProfiles: (f: object) => Promise<{ id: string; name: string; type?: string }[]>;
    listShippingOptions: (f: object) => Promise<{ id: string; type?: { code?: string } }[]>;
    updateShippingOptions: (id: string, update: { data?: Record<string, unknown> }) => Promise<unknown>;
  };
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: { entity: string; filters: object; fields: string[] }) => Promise<{ data: unknown[] }>;
  };

  let products: ShipmondoProduct[];
  try {
    products = await fetchShipmondoProducts({ apiUser, apiKey, sandbox });
  } catch (e) {
    throw e;
  }
  if (products.length === 0) {
    return {
      created: 0,
      updated: 0,
      message: "No products from Shipmondo API (check SHIPMONDO_SANDBOX vs credentials and that account has DK service_point products).",
    };
  }

  const countFromApi = products.length;
  try {
    const config = scope.resolve(SHIPMONDO_CONFIG_MODULE) as { listShipmondoEnabledProducts: (f: object) => Promise<{ product_code: string }[]> };
    const enabledList = await config.listShipmondoEnabledProducts({});
    const enabledCodes = Array.isArray(enabledList) ? enabledList.map((e) => e.product_code) : [];
    if (enabledCodes.length > 0) {
      products = products.filter((p) => enabledCodes.includes(p.code));
    }
  } catch {
    // use all products
  }

  if (products.length === 0) {
    return {
      created: 0,
      updated: 0,
      message: countFromApi > 0
        ? `No enabled products to sync: API returned ${countFromApi} product(s) but none match enabled list. Add carriers above and enable them, or clear shipmondo_enabled_products to sync all.`
        : "No enabled products to sync.",
    };
  }

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

  for (const product of products) {
    const optionData = { weight_intervals: product.weight_intervals, product_code: product.code };
    const name = product.name ?? product.code;
    const typeCode = product.code;
    const existing = byTypeCode.get(typeCode);

    if (existing) {
      try {
        await fulfillmentModule.updateShippingOptions(existing.id, { data: optionData });
        updated++;
      } catch {
        // skip
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
              data: optionData,
            },
          ],
        });
        created++;
      } catch {
        // skip
      }
    }
  }

  return { created, updated, message: `Sync done: ${created} created, ${updated} updated. Set prices in Admin.` };
}
