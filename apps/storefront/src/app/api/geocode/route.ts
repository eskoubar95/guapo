import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side geocode for Danish addresses. Proxies to OSM Nominatim to avoid CORS.
 * Used to compute distance to pickup points when Shipmondo does not return distance.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Missing or too short query" }, { status: 400 });
  }
  const query = `${q.trim()}, Denmark`;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "Guapo-Storefront/1.0" },
    });
    if (!res.ok) return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data?.[0];
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({ lat: null, lon: null });
    }
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ lat: null, lon: null });
    }
    return NextResponse.json({ lat, lon });
  } catch {
    return NextResponse.json({ error: "Geocode error" }, { status: 502 });
  }
}
