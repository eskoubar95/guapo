import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { runShipmondoSync } from "../../../../modules/shipmondo/run-sync";

/** POST /admin/shipmondo/sync – run sync from Shipmondo (create/update shipping options). */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const result = await runShipmondoSync(req.scope);
    return res.json(result);
  } catch (e) {
    return res.status(400).json({
      message: e instanceof Error ? e.message : "Sync failed",
    });
  }
};
