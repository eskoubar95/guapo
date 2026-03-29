import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { listShipmondoShippingOptionsForAdmin } from "../lib/list-shipmondo-admin-options";

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const allOptions = await listShipmondoShippingOptionsForAdmin(_req.scope);
  return res.json({
    options: allOptions.map(({ id, name, type, data }) => ({ id, name, type, data })),
  });
};
