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

/** Normalize service_point format to pickup_point format (number/id for compatibility) */
function normalizePickupPoint(p: Record<string, unknown>): ShipmondoPickupPoint {
  const id = String(p.id ?? p.number ?? "");
  return {
    number: id,
    id,
    company_name: p.company_name as string | undefined,
    name: (p.name as string) ?? "",
    address: (p.address as string) ?? "",
    address2: p.address2 as string | undefined,
    zipcode: (p.zipcode as string) ?? "",
    city: (p.city as string) ?? "",
    country: (p.country as string) ?? "DK",
    distance: p.distance as number | undefined,
    longitude: p.longitude as number | undefined,
    latitude: p.latitude as number | undefined,
    agent: p.agent as string | undefined,
    carrier_code: (p.carrier_code as string) ?? p.agent as string | undefined,
    opening_hours: Array.isArray(p.opening_hours) ? (p.opening_hours as string[]) : undefined,
    in_delivery: p.in_delivery as boolean | undefined,
    out_delivery: p.out_delivery as boolean | undefined,
  };
}

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

  const fetchWithTimeout = async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const r = await fetch(url, { ...init, signal: controller.signal });
      return r;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    if (frontendKey) {
      // Shipping Module API: service_point/service_points with frontend_key (no Basic Auth)
      // Doc: https://shipmondo.dev/docs/shipping_module/listing_service_points
      // Params: carrier_code, country_code, zipcode (pickup_points uses zipcode; service_points may accept both)
      const url = new URL(`${SHIPMONDO_BASE}/service_point/service_points`);
      url.searchParams.set("frontend_key", frontendKey);
      url.searchParams.set("carrier_code", carrier_code);
      url.searchParams.set("country_code", country_code);
      url.searchParams.set("zipcode", zipcode);
      if (limit != null && limit > 0) url.searchParams.set("limit", String(limit));

      const response = await fetchWithTimeout(url.toString());
      if (!response.ok) {
        const text = await response.text();
        const status = response.status;
        // 422 = validation/param error — fall back to pickup_points with Basic Auth if we have API keys
        if (status === 422 && apiUser && apiKey) {
          // Fall through to Basic Auth /pickup_points below
        } else {
          let hint = "";
          if (status === 401) {
            hint = " Check SHIPMONDO_SHIPPING_MODULE_KEY. Create at Shipmondo → Settings → Shipping Module Key.";
          } else if (status === 422) {
            hint = ` Validation error. Response: ${text.slice(0, 200)}`;
          }
          return res.status(status).json({
            message: `Shipmondo API error (${status})${hint}`,
            pickup_points: [],
          });
        }
      } else {
        const data = (await response.json()) as Record<string, unknown>[] | unknown;
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((p) => normalizePickupPoint(p as Record<string, unknown>));
        return res.json({ pickup_points: normalized });
      }
    }

    // Basic Auth with /pickup_points (primary when no frontendKey, or fallback on 422)
    const url = new URL(`${SHIPMONDO_BASE}/pickup_points`);
    url.searchParams.set("carrier_code", carrier_code);
    url.searchParams.set("country_code", country_code);
    url.searchParams.set("zipcode", zipcode);
    if (limit != null && limit > 0) url.searchParams.set("limit", String(limit));

    const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
    const response = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!response.ok) {
      const text = await response.text();
      const status = response.status;
      const hint =
        status === 401
          ? " Check SHIPMONDO_API_USER and SHIPMONDO_API_KEY. With SHIPMONDO_SANDBOX=true use sandbox credentials (from Shipmondo support), not production."
          : "";
      return res.status(status).json({
        message: `Shipmondo API error (${status})${hint}`,
        pickup_points: [],
      });
    }
    const data = (await response.json()) as ShipmondoPickupPoint[] | unknown;
    const arr = Array.isArray(data) ? data : [];
    const normalized = arr.map((p) =>
      typeof p === "object" && p !== null ? normalizePickupPoint(p as Record<string, unknown>) : normalizePickupPoint({})
    );
    return res.json({ pickup_points: normalized });
  } catch {
    return res.status(502).json({ message: "Upstream error", pickup_points: [] });
  }
};
