import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";

const SHIPMONDO_PROVIDER_ID = "shipmondo_shipmondo";

export type AdminShipmondoOptionRow = {
  id: string;
  name?: string;
  type?: { code?: string };
  data?: Record<string, unknown>;
  provider_id?: string;
};

/**
 * Lists Shipmondo provider shipping options across service zones for the first stock location fulfillment set.
 */
export async function listShipmondoShippingOptionsForAdmin(
  scope: MedusaContainer
): Promise<AdminShipmondoOptionRow[]> {
  const fulfillmentModule = scope.resolve(Modules.FULFILLMENT) as {
    listServiceZones: (f: object) => Promise<{ id: string }[]>;
    listShippingOptions: (f: object) => Promise<AdminShipmondoOptionRow[]>;
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
  const setId = locations.find((l) => l.fulfillment_sets?.length)?.fulfillment_sets?.[0]?.id;
  if (!setId) {
    return [];
  }

  const zones = await fulfillmentModule.listServiceZones({ fulfillment_set: { id: setId } });
  const allOptions: AdminShipmondoOptionRow[] = [];
  for (const z of zones) {
    const list = await fulfillmentModule.listShippingOptions({ service_zone: { id: z.id } });
    for (const o of list) {
      if (o.provider_id === SHIPMONDO_PROVIDER_ID) {
        allOptions.push({
          id: o.id,
          name: o.name,
          type: o.type,
          data: o.data,
          provider_id: o.provider_id,
        });
      }
    }
  }
  return allOptions;
}
