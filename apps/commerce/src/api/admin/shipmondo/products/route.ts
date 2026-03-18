import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { fetchShipmondoProducts } from "../../../../modules/shipmondo/fetch-products";

/**
 * GET /admin/shipmondo/products
 * Returns Shipmondo products (service_point) from API for carrier selection in Admin.
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    return res.status(400).json({ message: "SHIPMONDO_API_USER and SHIPMONDO_API_KEY required" });
  }
  try {
    const products = await fetchShipmondoProducts({ apiUser, apiKey, sandbox });
    return res.json({ products });
  } catch (e) {
    return res.status(502).json({
      message: e instanceof Error ? e.message : "Shipmondo API error",
    });
  }
};
