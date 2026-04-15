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

function toNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Normalize service_point format to pickup_point format (number/id for compatibility) */
export function normalizePickupPoint(p: Record<string, unknown>): ShipmondoPickupPoint {
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
    distance: toNumber(p.distance),
    longitude: toNumber(p.longitude ?? p.lon ?? p.lng),
    latitude: toNumber(p.latitude ?? p.lat),
    agent: p.agent as string | undefined,
    carrier_code: (p.carrier_code as string) ?? (p.agent as string | undefined),
    opening_hours: Array.isArray(p.opening_hours) ? (p.opening_hours as string[]) : undefined,
    in_delivery: p.in_delivery as boolean | undefined,
    out_delivery: p.out_delivery as boolean | undefined,
  };
}

export async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export type PickupPointsQuery = {
  carrier_code: string;
  country_code: string;
  zipcode: string;
  address?: string;
  limit?: number;
};

/**
 * Shipping Module API: service_point/service_points with frontend_key (no Basic Auth).
 */
export async function fetchPickupPointsViaFrontendKey(
  frontendKey: string,
  query: PickupPointsQuery
): Promise<
  | { ok: true; pickup_points: ShipmondoPickupPoint[] }
  | { ok: false; status: number; message: string; fallbackToBasicAuth: boolean }
> {
  const url = new URL(`${SHIPMONDO_BASE}/service_point/service_points`);
  url.searchParams.set("frontend_key", frontendKey);
  url.searchParams.set("carrier_code", query.carrier_code);
  url.searchParams.set("country_code", query.country_code);
  url.searchParams.set("zipcode", query.zipcode);
  if (query.address?.trim()) url.searchParams.set("address", query.address.trim());
  if (query.limit != null && query.limit > 0) url.searchParams.set("limit", String(query.limit));

  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) {
    const text = await response.text();
    const status = response.status;
    const fallbackToBasicAuth = status === 422;
    let message = `Shipmondo API error (${status})`;
    if (status === 401) {
      message +=
        " Check SHIPMONDO_SHIPPING_MODULE_KEY. Create at Shipmondo → Settings → Shipping Module Key.";
    } else if (status === 422) {
      message += ` Validation error. Response: ${text.slice(0, 200)}`;
    }
    return { ok: false, status, message, fallbackToBasicAuth };
  }

  const data = (await response.json()) as unknown;
  const arr = Array.isArray(data) ? data : [];
  const pickup_points = arr.map((p) => normalizePickupPoint(p as Record<string, unknown>));
  return { ok: true, pickup_points };
}

/**
 * Basic Auth /pickup_points endpoint.
 */
export async function fetchPickupPointsViaBasicAuth(
  apiUser: string,
  apiKey: string,
  query: PickupPointsQuery
): Promise<
  { ok: true; pickup_points: ShipmondoPickupPoint[] } | { ok: false; status: number; message: string }
> {
  const url = new URL(`${SHIPMONDO_BASE}/pickup_points`);
  url.searchParams.set("carrier_code", query.carrier_code);
  url.searchParams.set("country_code", query.country_code);
  url.searchParams.set("zipcode", query.zipcode);
  if (query.address?.trim()) url.searchParams.set("address", query.address.trim());
  if (query.limit != null && query.limit > 0) url.searchParams.set("limit", String(query.limit));

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
    return {
      ok: false,
      status,
      message: `Shipmondo API error (${status})${hint}`,
    };
  }

  const data = (await response.json()) as unknown;
  const arr = Array.isArray(data) ? data : [];
  const pickup_points = arr.map((p) =>
    typeof p === "object" && p !== null
      ? normalizePickupPoint(p as Record<string, unknown>)
      : normalizePickupPoint({})
  );
  return { ok: true, pickup_points };
}
