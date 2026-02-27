const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

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
  opening_hours?: string[];
  carrier_code?: string;
}

export async function fetchPickupPoints(params: {
  carrier_code?: string;
  country_code?: string;
  zipcode: string;
  limit?: number;
}): Promise<PickupPoint[]> {
  const { carrier_code = "gls", country_code = "DK", zipcode, limit } = params;
  if (!zipcode || zipcode.length < 3) return [];
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/pickup-points`);
  url.searchParams.set("carrier_code", carrier_code);
  url.searchParams.set("country_code", country_code);
  url.searchParams.set("zipcode", zipcode);
  if (limit) url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.pickup_points) ? data.pickup_points : [];
}
