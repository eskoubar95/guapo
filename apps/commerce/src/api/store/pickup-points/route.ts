import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const SHIPMONDO_BASE =
  process.env.SHIPMONDO_SANDBOX === "true"
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3";

export interface ShipmondoPickupPoint {
  number: string;
  id: string;
  company_name?: string;
  name: string;
  address: string;
  address2?: string;
  zipcode: string;
  city: string;
  country: string;
  distance?: number;
  longitude?: number;
  latitude?: number;
  agent?: string;
  carrier_code?: string;
  opening_hours?: string[];
  in_delivery?: boolean;
  out_delivery?: boolean;
}

/**
 * GET /store/pickup-points
 * Proxies to Shipmondo pickup_points for GLS/DAO pakkeshop search.
 * Query: carrier_code (gls|dao), country_code (DK), zipcode.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const apiUser = process.env.SHIPMONDO_API_USER;
  const apiKey = process.env.SHIPMONDO_API_KEY;
  if (!apiUser || !apiKey) {
    return res.status(503).json({
      message: "Pickup points unavailable",
      pickup_points: [],
    });
  }

  const carrier_code = (req.query.carrier_code as string) || "gls";
  const country_code = (req.query.country_code as string) || "DK";
  const zipcode = req.query.zipcode as string;
  if (!zipcode || zipcode.length < 3) {
    return res.status(400).json({
      message: "zipcode required (min 3 characters)",
      pickup_points: [],
    });
  }

  const url = new URL(`${SHIPMONDO_BASE}/pickup_points`);
  url.searchParams.set("carrier_code", carrier_code);
  url.searchParams.set("country_code", country_code);
  url.searchParams.set("zipcode", zipcode);
  const limit = req.query.limit;
  if (limit) url.searchParams.set("limit", String(limit));

  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        message: "Shipmondo API error",
        pickup_points: [],
      });
    }
    const data = (await response.json()) as ShipmondoPickupPoint[];
    res.json({ pickup_points: Array.isArray(data) ? data : [] });
  } catch {
    res.status(502).json({ message: "Upstream error", pickup_points: [] });
  }
};
