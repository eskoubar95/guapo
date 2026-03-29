/**
 * Shipmondo GET /shipping_modules/carriers — carriers available on the account (Basic Auth).
 */
import { getBaseUrl } from "./lib/env";

export type ShipmondoCarrierRow = { code: string; name: string };

export type FetchShipmondoCarriersOptions = {
  apiUser: string;
  apiKey: string;
  sandbox?: boolean;
};

function normalizeCarrierRow(raw: Record<string, unknown>): ShipmondoCarrierRow | null {
  const code =
    typeof raw.code === "string"
      ? raw.code.trim().toLowerCase()
      : typeof raw.carrier_code === "string"
        ? raw.carrier_code.trim().toLowerCase()
        : "";
  if (!code) return null;
  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : typeof raw.carrier_name === "string" && raw.carrier_name.trim()
        ? raw.carrier_name.trim()
        : code.toUpperCase();
  return { code, name };
}

export async function fetchShipmondoCarriers(options: FetchShipmondoCarriersOptions): Promise<ShipmondoCarrierRow[]> {
  const { apiUser, apiKey, sandbox = false } = options;
  if (!apiUser || !apiKey) return [];
  const baseUrl = getBaseUrl(sandbox);
  const auth = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/shipping_modules/carriers`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shipmondo carriers: ${res.status} ${text.slice(0, 300)}`);
  }
  const raw = (await res.json()) as unknown;
  const list = Array.isArray(raw) ? raw : (raw as { carriers?: unknown[] })?.carriers ?? [];
  const out: ShipmondoCarrierRow[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (item == null || typeof item !== "object") continue;
    const row = normalizeCarrierRow(item as Record<string, unknown>);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    out.push(row);
  }
  out.sort((a, b) => a.name.localeCompare(b.name, "da"));
  return out;
}
