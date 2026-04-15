/**
 * Payload CMS — Tracking global (GTM) for storefront.
 * Fetches from PAYLOAD_API_URL/api/storefront/globals/tracking.
 */

const PAYLOAD_URL = process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/;

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

export interface PayloadTrackingGlobal {
  gtmEnabled?: boolean | null;
  gtmContainerId?: string | null;
}

/**
 * Effective GTM container ID for the storefront.
 * - CMS: used when "Enable GTM" is on and container ID is valid.
 * - Env NEXT_PUBLIC_GTM_CONTAINER_ID: fallback (e.g. local dev or before CMS is filled).
 * Avoid setting both GTM (with GA4 inside) and NEXT_PUBLIC_GA_MEASUREMENT_ID, or hits may duplicate.
 */
export function resolveGtmContainerId(
  cms: PayloadTrackingGlobal | null | undefined,
  envGtmId: string | undefined
): string | null {
  const env = envGtmId?.trim();
  const cmsEnabled = cms?.gtmEnabled === true;
  const cmsId = cms?.gtmContainerId?.trim();
  if (cmsEnabled && cmsId && GTM_ID_RE.test(cmsId)) return cmsId;
  if (env && GTM_ID_RE.test(env)) return env;
  return null;
}

export async function fetchTrackingGlobal(
  options: { draft?: boolean } = {}
): Promise<PayloadTrackingGlobal | null> {
  if (!PAYLOAD_URL) return null;

  const { draft = false } = options;
  const key = `payload:tracking:${draft}`;
  const cached = getCached<PayloadTrackingGlobal | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams();
    if (draft) params.set("draft", "true");

    const qs = params.toString();
    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/globals/tracking${qs ? `?${qs}` : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PayloadTrackingGlobal;
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}
