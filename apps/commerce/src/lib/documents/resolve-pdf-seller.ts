import type { PdfSellerProfile } from "./pdf-seller-config";
import { getDefaultPdfSellerProfile } from "./pdf-seller-config";

type QueryLike = {
  graph: (opts: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: unknown[] }>;
};

/** Keys we read from region metadata (nested under `guapo_invoice` **or** flat on region metadata). */
const GUAPO_INVOICE_METADATA_KEYS = [
  "company_name",
  "address_line1",
  "address_line2",
  "postal_code",
  "city",
  "country",
  "cvr",
  "vat_number",
  "email",
  "website",
  "logo_url",
  "footer_legal_da",
  "footer_legal_en",
  "vat_rate_percent",
] as const;

/**
 * Region → metadata: either **`guapo_invoice`** object (preferred) **or** the same keys **flat**
 * on region metadata (Medusa Admin key/value table). Merges over **code defaults** from `getDefaultPdfSellerProfile()`.
 *
 * Nested example:
 * ```json
 * { "guapo_invoice": { "company_name": "Guapo ApS", "cvr": "12345678", ... } }
 * ```
 *
 * Flat example (same keys as top-level metadata entries):
 * `company_name`, `address_line1`, `cvr`, `vat_number`, …
 */
export function extractGuapoInvoicePayloadFromRegionMetadata(
  meta: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  const nested = meta.guapo_invoice;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  const picked: Record<string, unknown> = {};
  for (const k of GUAPO_INVOICE_METADATA_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(meta, k)) continue;
    const v = meta[k];
    if (v != null && v !== "") picked[k] = v;
  }
  return Object.keys(picked).length > 0 ? picked : null;
}
export function mergeGuapoInvoiceMetadataIntoSeller(
  base: PdfSellerProfile,
  raw: Record<string, unknown>
): PdfSellerProfile {
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const num = (k: string) => {
    const v = raw[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim());
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };

  const companyName = str("company_name");
  const line1 = str("address_line1");
  const line2 = str("address_line2");
  const postal = str("postal_code");
  const city = str("city");
  const country = (str("country") || "DK").toUpperCase();
  const cityParts = [postal, city].filter(Boolean).join(" ");
  const postalCityLine =
    cityParts.length > 0
      ? `${cityParts}${country ? `, ${country === "DK" ? "Danmark" : country}` : ""}`
      : base.postalCityLine;

  const addressLines = [line1, line2].map((s) => s.trim()).filter(Boolean);
  const vatPct = num("vat_rate_percent");

  let website = str("website");
  if (website && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`;
  }

  return {
    companyName: companyName || base.companyName,
    addressLines: addressLines.length > 0 ? addressLines : base.addressLines,
    postalCityLine: cityParts.length > 0 ? postalCityLine : base.postalCityLine,
    cvr: str("cvr") || base.cvr,
    vatNumber: str("vat_number") || base.vatNumber,
    email: str("email") || base.email,
    website: website || base.website,
    logoUrl: str("logo_url") || base.logoUrl,
    footerLegalDa: str("footer_legal_da") || base.footerLegalDa,
    footerLegalEn: str("footer_legal_en") || base.footerLegalEn,
    vatRatePercent:
      vatPct != null && vatPct > 0 ? vatPct : base.vatRatePercent,
  };
}

/**
 * Resolve seller block for PDFs: **region metadata** (flat or `guapo_invoice`) merged over **defaults**.
 */
export async function resolvePdfSellerForOrder(
  container: { resolve: (key: string) => unknown },
  currencyCode: string
): Promise<PdfSellerProfile> {
  const base = getDefaultPdfSellerProfile();
  const code = (currencyCode || "dkk").toLowerCase();
  try {
    const query = container.resolve("query") as QueryLike;
    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code", "metadata"],
      filters: { currency_code: code },
    });
    const row = data?.[0] as { metadata?: Record<string, unknown> } | undefined;
    const inv = extractGuapoInvoicePayloadFromRegionMetadata(row?.metadata ?? undefined);
    if (inv) {
      return mergeGuapoInvoiceMetadataIntoSeller(base, inv);
    }
  } catch {
    /* fall back to defaults */
  }
  return base;
}
