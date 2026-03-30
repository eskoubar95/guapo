const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export interface PickupPoint {
  number: string;
  id: string;
  name: string;
  address: string;
  address2?: string;
  zipcode: string;
  city: string;
  country: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  carrier_code?: string;
}

export async function fetchPickupPoints(params: {
  carrier_code?: string;
  country_code?: string;
  zipcode: string;
  address?: string;
  limit?: number;
}): Promise<PickupPoint[]> {
  const { carrier_code = "gls", country_code = "DK", zipcode, address, limit } = params;
  if (!zipcode || zipcode.length < 3) return [];
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/pickup-points`);
  url.searchParams.set("carrier_code", carrier_code);
  url.searchParams.set("country_code", country_code);
  url.searchParams.set("zipcode", zipcode);
  if (address?.trim()) url.searchParams.set("address", address.trim());
  if (limit) url.searchParams.set("limit", String(limit));
  const headers: HeadersInit = {};
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
  try {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const points = Array.isArray(data.pickup_points) ? data.pickup_points : [];
    return points.map((p: PickupPoint) => ({ ...p, carrier_code: p.carrier_code ?? carrier_code }));
  } catch {
    return [];
  }
}

/** Extract Danish 4-digit postal code from a string (e.g. "Slotsbakken 88, 2970 Hørsholm" -> "2970"). */
export function extractZipcodeFromAddress(addressStr: string): string {
  const match = addressStr.match(/\b(\d{4})\b/);
  return match ? match[1] : addressStr.trim().replace(/\D/g, "").slice(0, 4) || "";
}

/** Haversine distance in meters between two WGS84 points. */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Geocode via storefront API (server-side Nominatim) to avoid CORS. */
async function geocodeAddress(addressStr: string): Promise<{ lat: number; lon: number } | null> {
  const q = addressStr.trim();
  if (!q || q.length < 2) return null;
  try {
    const base =
      typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";
    const url = `${base}/api/geocode?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: number | null; lon: number | null };
    const lat = data?.lat;
    const lon = data?.lon;
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

/**
 * Enrich pickup points with distance from a given address when API did not return distance.
 * Uses OSM Nominatim to geocode the address, then Haversine to compute distance to each point that has lat/lon.
 * Sorts by distance (nearest first). Points that already have distance are left as-is.
 */
export async function enrichWithDistance(
  points: PickupPoint[],
  fromAddress: string
): Promise<PickupPoint[]> {
  const needDistance = points.some(
    (p) =>
      (p.distance == null || !Number.isFinite(p.distance)) &&
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude)
  );
  if (!needDistance || !fromAddress.trim()) return points;

  const coords = await geocodeAddress(fromAddress);
  if (!coords) return points;

  const out = points.map((p) => {
    if (p.distance != null && Number.isFinite(p.distance)) return p;
    const lat = p.latitude;
    const lon = p.longitude;
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) return p;
    const meters = haversineMeters(coords.lat, coords.lon, lat, lon);
    return { ...p, distance: Math.round(meters) };
  });

  const withDist = out.filter((p) => p.distance != null && Number.isFinite(p.distance));
  const withoutDist = out.filter((p) => p.distance == null || !Number.isFinite(p.distance));
  withDist.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return [...withDist, ...withoutDist];
}

/** Fetch GLS, DAO, and PostNord (pdk) pickup points for a zipcode. Merge and sort by distance when available. */
export async function fetchAllPickupPoints(params: {
  country_code?: string;
  zipcode: string;
  address?: string;
  limit?: number;
}): Promise<PickupPoint[]> {
  const { country_code = "DK", zipcode, address, limit = 25 } = params;
  if (!zipcode || zipcode.length < 3) return [];
  const [glsPoints, daoPoints, pdkPoints] = await Promise.all([
    fetchPickupPoints({ carrier_code: "gls", country_code, zipcode, address, limit }),
    fetchPickupPoints({ carrier_code: "dao", country_code, zipcode, address, limit }),
    fetchPickupPoints({ carrier_code: "pdk", country_code, zipcode, address, limit }),
  ]);
  const merged = [...glsPoints, ...daoPoints, ...pdkPoints];
  const withDistance = merged.filter((p) => p.distance != null && Number.isFinite(p.distance));
  const withoutDistance = merged.filter((p) => p.distance == null || !Number.isFinite(p.distance));
  withDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return [...withDistance, ...withoutDistance];
}

/** Human-readable carrier for pakkeshop (GLS, DAO, PostNord / `pdk`). */
export function formatPickupCarrierLabel(carrier_code?: string | null): string | null {
  if (carrier_code == null || typeof carrier_code !== "string") return null;
  const c = carrier_code.trim().toLowerCase();
  if (!c) return null;
  if (c === "gls") return "GLS";
  if (c === "dao") return "DAO";
  if (c === "pdk") return "PostNord";
  return c.toUpperCase();
}
