import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { fetchShipmondoProducts } from "../../../../modules/shipmondo/fetch-products";

function parseBool(v: unknown, defaultVal: boolean): boolean {
  if (v === undefined || v === null || v === "") return defaultVal;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return defaultVal;
}

/**
 * GET /admin/shipmondo/products
 * Query: country_code or receiver_country_code (default DK), sender_country_code (optional; defaults to receiver),
 * carrier_code (optional), service_point_only (default true).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const apiUser = process.env.SHIPMONDO_API_USER ?? "";
  const apiKey = process.env.SHIPMONDO_API_KEY ?? "";
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true";
  if (!apiUser || !apiKey) {
    return res.status(400).json({ message: "SHIPMONDO_API_USER and SHIPMONDO_API_KEY required" });
  }

  const q = req.query as Record<string, string | undefined>;
  const countryCode =
    (q.receiver_country_code ?? q.country_code ?? q.receiver_country ?? "DK").trim().toUpperCase() || "DK";
  const senderCountryCode = q.sender_country_code?.trim().toUpperCase();
  const carrierCode = q.carrier_code?.trim().toLowerCase();
  const servicePointOnly = parseBool(q.service_point_only, true);

  try {
    const products = await fetchShipmondoProducts({
      apiUser,
      apiKey,
      sandbox,
      countryCode,
      senderCountryCode: senderCountryCode || undefined,
      carrierCode: carrierCode || undefined,
      servicePointOnly,
    });
    return res.json({
      products,
      query: {
        receiver_country_code: countryCode,
        sender_country_code: senderCountryCode ?? null,
        carrier_code: carrierCode || null,
        service_point_only: servicePointOnly,
      },
    });
  } catch (e) {
    return res.status(502).json({
      message: e instanceof Error ? e.message : "Shipmondo API error",
    });
  }
};
