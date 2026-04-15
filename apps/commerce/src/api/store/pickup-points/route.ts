import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import {
  fetchPickupPointsViaBasicAuth,
  fetchPickupPointsViaFrontendKey,
  type ShipmondoPickupPoint,
} from "../../../lib/shipmondo-pickup-client";

export type { ShipmondoPickupPoint };

/**
 * GET /store/pickup-points
 * Proxies to Shipmondo for pakkeshop search.
 *
 * Preferred: Shipping Module Key (frontend_key) — read-only, no sandbox needed, works in production.
 * Fallback: API User + Key (Basic Auth) for /pickup_points.
 *
 * Query: carrier_code (gls|dao|pdk), country_code (DK), zipcode.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const frontendKey = process.env.SHIPMONDO_SHIPPING_MODULE_KEY;
  const apiUser = process.env.SHIPMONDO_API_USER;
  const apiKey = process.env.SHIPMONDO_API_KEY;

  if (!frontendKey && (!apiUser || !apiKey)) {
    return res.status(503).json({
      message:
        "Pickup points unavailable. Set SHIPMONDO_SHIPPING_MODULE_KEY (recommended) or SHIPMONDO_API_USER + SHIPMONDO_API_KEY.",
      pickup_points: [],
    });
  }

  const one = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined);
  const carrier_code = one(req.query.carrier_code) ?? "gls";
  const country_code = (one(req.query.country_code) ?? "DK").toUpperCase();
  const zipcode = one(req.query.zipcode);
  const address = one(req.query.address);
  if (!zipcode || zipcode.length < 3) {
    return res.status(400).json({
      message: "zipcode required (min 3 characters)",
      pickup_points: [],
    });
  }
  if (!["gls", "dao", "pdk"].includes(carrier_code)) {
    return res.status(400).json({ message: "invalid carrier_code", pickup_points: [] });
  }

  const rawLimit = one(req.query.limit);
  const limit = rawLimit ? Math.min(Math.max(1, Number(rawLimit)), 50) : undefined;

  const query = { carrier_code, country_code, zipcode, address, limit };

  try {
    if (frontendKey) {
      const result = await fetchPickupPointsViaFrontendKey(frontendKey, query);
      if (result.ok) {
        return res.json({ pickup_points: result.pickup_points });
      }
      if (result.fallbackToBasicAuth && apiUser && apiKey) {
        /* fall through to Basic Auth */
      } else {
        return res.status(result.status).json({
          message: result.message,
          pickup_points: [],
        });
      }
    }

    if (!apiUser || !apiKey) {
      return res.status(503).json({
        message: "Shipmondo API credentials not configured for Basic Auth fallback",
        pickup_points: [],
      });
    }

    const basic = await fetchPickupPointsViaBasicAuth(apiUser, apiKey, query);
    if (!basic.ok) {
      return res.status(basic.status).json({
        message: basic.message,
        pickup_points: [],
      });
    }
    return res.json({ pickup_points: basic.pickup_points });
  } catch {
    return res.status(502).json({ message: "Upstream error", pickup_points: [] });
  }
};
