import type { Logger } from "@medusajs/framework/types";
import { Client } from "pg";

import { DEFAULT_WEIGHT_GRAMS_PER_ITEM, ENABLED_PRODUCTS_CACHE_TTL_MS } from "./env";

/** Cache for enabled product codes from DB (null = not loaded or error = return all). */
let enabledProductCodesCache: { codes: string[] | null; expiresAt: number } | null = null;

function getDbSchema(): string | null {
  const schema = (process.env.DATABASE_SCHEMA || "medusa").trim();
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema) ? schema : null;
}

async function withPgClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== "string") throw new Error("DATABASE_URL not set");
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getEnabledProductCodes(logger: Logger): Promise<string[] | null> {
  const now = Date.now();
  if (enabledProductCodesCache && enabledProductCodesCache.expiresAt > now) {
    return enabledProductCodesCache.codes;
  }
  try {
    const codes = await withPgClient(async (client) => {
      const res = await client.query<{ product_code: string }>({
        text: `SELECT product_code FROM medusa.shipmondo_enabled_products WHERE enabled = true ORDER BY display_order ASC NULLS LAST, product_code`,
      });
      return res.rows.map((r) => r.product_code).filter(Boolean);
    });
    enabledProductCodesCache = { codes, expiresAt: now + ENABLED_PRODUCTS_CACHE_TTL_MS };
    return codes;
  } catch (e) {
    logger.debug(
      `Shipmondo getEnabledProductCodes failed: ${e instanceof Error ? e.message : String(e)}; returning all products`
    );
    enabledProductCodesCache = { codes: null, expiresAt: now + ENABLED_PRODUCTS_CACHE_TTL_MS };
    return null;
  }
}

export type ShippingOptionRow = {
  optionData: Record<string, unknown> | null;
  profileSenderHints: {
    sender_email?: string;
    sender_phone?: string;
    sender_name?: string;
  } | null;
};

export async function getShippingOptionRowFromDb(
  shippingOptionId: string,
  logger: Logger
): Promise<ShippingOptionRow | null> {
  const schema = getDbSchema();
  if (!schema) return null;
  try {
    return await withPgClient(async (client) => {
      const res = await client.query<{ option_data: unknown; profile_metadata: unknown }>({
        text: `SELECT so.data AS option_data, sp.metadata AS profile_metadata
FROM "${schema}".shipping_option so
LEFT JOIN "${schema}".shipping_profile sp
  ON sp.id = so.shipping_profile_id AND sp.deleted_at IS NULL
WHERE so.id = $1 AND so.deleted_at IS NULL
LIMIT 1`,
        values: [shippingOptionId],
      });
      const row = res.rows[0];
      if (!row) return null;

      let optionData: Record<string, unknown> | null = null;
      if (row.option_data != null && typeof row.option_data === "object" && !Array.isArray(row.option_data)) {
        optionData = row.option_data as Record<string, unknown>;
      }

      let profileSenderHints: ShippingOptionRow["profileSenderHints"] = null;
      if (
        row.profile_metadata != null &&
        typeof row.profile_metadata === "object" &&
        !Array.isArray(row.profile_metadata)
      ) {
        const m = row.profile_metadata as Record<string, unknown>;
        const hints: { sender_email?: string; sender_phone?: string; sender_name?: string } = {};
        const em = m.sender_email;
        if (typeof em === "string" && em.includes("@")) hints.sender_email = em.trim();
        const ph = m.sender_phone;
        if (typeof ph === "string" && ph.trim()) hints.sender_phone = ph.trim();
        const nm = m.sender_name;
        if (typeof nm === "string" && nm.trim()) hints.sender_name = nm.trim();
        if (Object.keys(hints).length > 0) profileSenderHints = hints;
      }

      if (!optionData && !profileSenderHints) return null;
      return { optionData, profileSenderHints };
    });
  } catch (e) {
    logger.debug(`Shipmondo getShippingOptionRowFromDb failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export type StockLocationSender = {
  locationName: string;
  address_1: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
  sender_email?: string;
};

export async function getStockLocationSenderFromDb(
  locationId: string,
  logger: Logger
): Promise<StockLocationSender | null> {
  if (!locationId.startsWith("sloc_")) return null;
  const schema = getDbSchema();
  if (!schema) return null;
  try {
    return await withPgClient(async (client) => {
      const res = await client.query<{
        location_name: string;
        metadata: unknown;
        address_1: string | null;
        city: string | null;
        postal_code: string | null;
        country_code: string | null;
        phone: string | null;
      }>({
        text: `SELECT sl.name AS location_name, sl.metadata,
       a.address_1, a.city, a.postal_code, a.country_code, a.phone
FROM "${schema}".stock_location sl
LEFT JOIN "${schema}".stock_location_address a
  ON a.id = sl.address_id AND a.deleted_at IS NULL
WHERE sl.id = $1 AND sl.deleted_at IS NULL
LIMIT 1`,
        values: [locationId],
      });
      const row = res.rows[0];
      if (!row) return null;
      let sender_email: string | undefined;
      if (row.metadata && typeof row.metadata === "object" && row.metadata !== null) {
        const raw = (row.metadata as Record<string, unknown>).sender_email;
        if (typeof raw === "string" && raw.includes("@")) sender_email = raw.trim();
      }
      return {
        locationName: typeof row.location_name === "string" ? row.location_name : "",
        address_1: typeof row.address_1 === "string" ? row.address_1 : "",
        city: typeof row.city === "string" ? row.city : "",
        postal_code: typeof row.postal_code === "string" ? row.postal_code : "",
        country_code: typeof row.country_code === "string" ? row.country_code : "DK",
        phone: typeof row.phone === "string" ? row.phone : "",
        sender_email,
      };
    });
  } catch (e) {
    logger.debug(`Shipmondo getStockLocationSenderFromDb failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

export async function getCartWeightGramsFromDb(
  cartId: string,
  logger: Logger
): Promise<number> {
  if (process.env.SHIPMONDO_SKIP_CART_WEIGHT_DB === "true") return 0;
  const schema = getDbSchema();
  if (!schema) return 0;
  try {
    return await withPgClient(async (client) => {
      const res = await client.query<{ quantity: unknown; weight: unknown }>({
        text: `SELECT cli.quantity, pv.weight
FROM "${schema}".cart_line_item cli
LEFT JOIN "${schema}".product_variant pv ON pv.id = cli.variant_id AND pv.deleted_at IS NULL
WHERE cli.cart_id = $1 AND cli.deleted_at IS NULL AND COALESCE(cli.requires_shipping, true) = true`,
        values: [cartId],
      });
      let total = 0;
      for (const row of res.rows) {
        const qty = Number(row.quantity);
        const q = Number.isFinite(qty) && qty > 0 ? qty : 1;
        const w = row.weight != null ? Number(row.weight) : NaN;
        const grams = Number.isFinite(w) && w > 0 ? w : DEFAULT_WEIGHT_GRAMS_PER_ITEM;
        total += q * grams;
      }
      return total;
    });
  } catch (e) {
    logger.debug(`Shipmondo getCartWeightGramsFromDb failed: ${e instanceof Error ? e.message : String(e)}`);
    return 0;
  }
}
