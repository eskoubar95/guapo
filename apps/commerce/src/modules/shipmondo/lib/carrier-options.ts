import type { FulfillmentOption, FulfillmentOrderDTO } from "@medusajs/types";

export const FALLBACK_OPTION_IDS = ["gls-pakkeshop", "dao-pakkeshop"] as const;

export const FALLBACK_PRODUCT_CODES: Record<string, string> = {
  "gls-pakkeshop": "GLSDK_SD",
  "dao-pakkeshop": "DAO_STS",
};

const FIXED_CARRIER_LABELS: Record<string, string> = {
  GLSDK_SD: "ShopDelivery",
  DAO_STS: "daoSHOP (drop-off)",
  DAO_SD: "DAO Pakkeshop",
  PDK_MC: "Service Point",
  POSTDK_SD: "PostNord Pakkeshop",
};

/**
 * Fixed checkout carriers (comma-separated Shipmondo product codes).
 * Default: GLS, DAO, PostNord. Set SHIPMONDO_CHECKOUT_CARRIER_CODES=__API__ for dynamic GET /products + enabled table.
 */
export function getFixedCheckoutCarrierOptions(): FulfillmentOption[] | null {
  const trimmed = process.env.SHIPMONDO_CHECKOUT_CARRIER_CODES?.trim();
  if (trimmed === "__API__") return null;
  const postnordDefault = process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE?.trim() || "PDK_MC";
  const daoDefault = process.env.SHIPMONDO_DAO_PRODUCT_CODE?.trim() || "DAO_STS";
  const codes = (trimmed || `GLSDK_SD,${daoDefault},${postnordDefault}`).split(/[\s,]+/).filter(Boolean);
  if (codes.length === 0) return null;
  const postnordCode = process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE?.trim();
  return codes.map((code) => {
    let name = FIXED_CARRIER_LABELS[code];
    if (!name && postnordCode && code === postnordCode) name = "PostNord Pakkeshop";
    if (!name && (/^(POST|PDK|PN)/i.test(code) || /postnord/i.test(code))) name = "PostNord Pakkeshop";
    if (!name) name = code;
    return { id: code, name };
  });
}

/** Medusa shipping option primary keys use prefix `so_` — not valid Shipmondo product_code. */
export function looksLikeMedusaShippingOptionId(id: string | undefined): boolean {
  return typeof id === "string" && id.startsWith("so_");
}

/** Extract product code from option-like data (option JSON or shipping method data). */
export function extractProductCodeFromOptionLikeData(
  raw: Record<string, unknown> | undefined | null
): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const tryObj = (o: Record<string, unknown>): string | undefined => {
    const pc = o.product_code;
    if (typeof pc === "string" && pc.length > 0 && !looksLikeMedusaShippingOptionId(pc)) return pc;
    const id = o.id;
    if (typeof id === "string" && id.length > 0 && !looksLikeMedusaShippingOptionId(id)) return id;
    return undefined;
  };
  const direct = tryObj(raw);
  if (direct) return direct;
  const inner = raw.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return tryObj(inner as Record<string, unknown>);
  }
  return undefined;
}

export function resolveProductCodeFromOrder(
  order: Partial<FulfillmentOrderDTO> | undefined,
  shippingOptionId: string | undefined
): string | undefined {
  if (!shippingOptionId) return undefined;
  const methods = (
    order as { shipping_methods?: Array<{ shipping_option_id?: string; data?: Record<string, unknown> }> }
  )?.shipping_methods;
  if (!Array.isArray(methods)) return undefined;
  const sm = methods.find((m) => m.shipping_option_id === shippingOptionId);
  return extractProductCodeFromOptionLikeData(sm?.data);
}

/**
 * Checkout persists `carrier_code` on shipping method data (gls/dao/pdk) but not always `product_code`.
 * Use when option JSON lacks product_code — maps to Shipmondo codes (overridable per env).
 */
export function resolveProductCodeFromCarrierCode(carrier: string | undefined | null): string | undefined {
  if (!carrier || typeof carrier !== "string") return undefined;
  const c = carrier.trim().toLowerCase();
  if (!c) return undefined;
  if (c === "gls") return process.env.SHIPMONDO_GLS_PRODUCT_CODE?.trim() || "GLSDK_SD";
  if (c === "dao") return process.env.SHIPMONDO_DAO_PRODUCT_CODE?.trim() || "DAO_STS";
  if (c === "pdk" || c === "postnord")
    return process.env.SHIPMONDO_POSTNORD_PRODUCT_CODE?.trim() || "PDK_MC";
  return undefined;
}

/** `carrier_code` from the order line that matches this fulfillment's shipping option. */
export function resolveCarrierCodeFromOrderShippingMethod(
  order: Partial<FulfillmentOrderDTO> | undefined,
  shippingOptionId: string | undefined
): string | undefined {
  if (!shippingOptionId) return undefined;
  const methods = (
    order as { shipping_methods?: Array<{ shipping_option_id?: string; data?: Record<string, unknown> }> }
  )?.shipping_methods;
  if (!Array.isArray(methods)) return undefined;
  const sm = methods.find((m) => m.shipping_option_id === shippingOptionId);
  const raw = sm?.data?.carrier_code;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

/**
 * Resolve product code from option id (from API) or legacy id (gls-pakkeshop/dao-pakkeshop).
 * Returns null when optionId is a Medusa `so_*` id — caller must use order data or DB.
 */
export function resolveProductCode(optionId: string | undefined): string | null {
  if (!optionId) return FALLBACK_PRODUCT_CODES["gls-pakkeshop"];
  if (looksLikeMedusaShippingOptionId(optionId)) return null;
  if (FALLBACK_PRODUCT_CODES[optionId]) return FALLBACK_PRODUCT_CODES[optionId];
  return optionId;
}
