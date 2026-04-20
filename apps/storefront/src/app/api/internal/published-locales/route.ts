import { NextResponse } from "next/server";
import { resolvePublishedLocales } from "@/i18n/published-locales";

/**
 * Cached list of published storefront locales for middleware (Edge) and tooling.
 * Skips a direct Payload round-trip from middleware when combined with short timeout + fallback.
 */
export async function GET() {
  const locales = await resolvePublishedLocales();
  return NextResponse.json(
    { locales: [...locales] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
