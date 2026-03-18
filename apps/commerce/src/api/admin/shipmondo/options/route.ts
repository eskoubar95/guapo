import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const fulfillmentModule = _req.scope.resolve(Modules.FULFILLMENT) as {
    listServiceZones: (f: object) => Promise<{ id: string }[]>;
    listShippingOptions: (f: object) => Promise<{ id: string; name?: string; type?: { code?: string }; data?: Record<string, unknown>; provider_id?: string }[]>;
  };
  const query = _req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
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
    return res.json({ options: [] });
  }

  const zones = await fulfillmentModule.listServiceZones({ fulfillment_set: { id: setId } });
  const allOptions: { id: string; name?: string; type?: { code?: string }; data?: Record<string, unknown> }[] = [];
  for (const z of zones) {
    const list = await fulfillmentModule.listShippingOptions({ service_zone: { id: z.id } });
    for (const o of list) {
      if (o.provider_id === "shipmondo_shipmondo") {
        allOptions.push({
          id: o.id,
          name: o.name,
          type: o.type,
          data: o.data,
        });
      }
    }
  }
  return res.json({ options: allOptions });
};
