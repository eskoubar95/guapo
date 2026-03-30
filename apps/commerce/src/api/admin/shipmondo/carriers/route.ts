import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { fetchShipmondoCarriers } from "../../../../modules/shipmondo/fetch-carriers";

/**
 * GET /admin/shipmondo/carriers
 * Returns carriers from Shipmondo GET /shipping_modules/carriers (account-scoped).
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    return res.status(400).json({ message: "SHIPMONDO_API_USER and SHIPMONDO_API_KEY required" });
  }

  try {
    const carriers = await fetchShipmondoCarriers({ apiUser, apiKey, sandbox });
    return res.json({ carriers });
  } catch (e) {
    return res.status(502).json({
      message: e instanceof Error ? e.message : "Shipmondo carriers request failed",
    });
  }
};
