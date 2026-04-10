import type { PdfSellerProfile } from "./pdf-seller-config";
import { resolvePdfSellerProfile } from "./pdf-seller-config";

type QueryLike = {
  graph: (opts: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: unknown[] }>;
};

/**
 * Optional JSON on **Region → metadata → guapo_invoice** (Admin: Regions → Denmark → Metadata).
 * Overrides env-based `GUAPO_INVOICE_*` when fields are set — single source of truth in DB for CVR/adresse.
 *
 * Example:
 * ```json
 * "guapo_invoice": {
 *   "company_name": "Guapo ApS",
 *   "address_line1": "Gadenavn 1",
 *   "address_line2": "",
 *   "postal_code": "2100",
 *   "city": "København Ø",
 *   "country": "DK",
 *   "cvr": "12345678",
 *   "vat_number": "DK12345678",
 *   "email": "kontakt@guapo.dk",
 *   "website": "https://guapo.dk",
 *   "logo_url": "https://…/logo.png",
 *   "footer_legal_da": "…",
 *   "footer_legal_en": "…",
 *   "vat_rate_percent": 25
 * }
 * ```
 */
export function mergeGuapoInvoiceMetadataIntoSeller(
  base: PdfSellerProfile,
  raw: Record<string, unknown>
): PdfSellerProfile {
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const num = (k: string) => {
    const v = raw[k];
    return typeof v === "number" && Number.isFinite(v) ? v : undefined;
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

  return {
    companyName: companyName || base.companyName,
    addressLines: addressLines.length > 0 ? addressLines : base.addressLines,
    postalCityLine: cityParts.length > 0 ? postalCityLine : base.postalCityLine,
    cvr: str("cvr") || base.cvr,
    vatNumber: str("vat_number") || base.vatNumber,
    email: str("email") || base.email,
    website: str("website") || base.website,
    logoUrl: str("logo_url") || base.logoUrl,
    footerLegalDa: str("footer_legal_da") || base.footerLegalDa,
    footerLegalEn: str("footer_legal_en") || base.footerLegalEn,
    vatRatePercent:
      vatPct != null && vatPct > 0 ? vatPct : base.vatRatePercent,
  };
}

/**
 * Resolve seller block for PDFs: **region metadata `guapo_invoice`** (if present) merged over **env** defaults.
 */
export async function resolvePdfSellerForOrder(
  container: { resolve: (key: string) => unknown },
  currencyCode: string
): Promise<PdfSellerProfile> {
  const base = resolvePdfSellerProfile();
  const code = (currencyCode || "dkk").toLowerCase();
  try {
    const query = container.resolve("query") as QueryLike;
    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code", "metadata"],
      filters: { currency_code: code },
    });
    const row = data?.[0] as { metadata?: Record<string, unknown> } | undefined;
    const inv = row?.metadata?.guapo_invoice;
    if (inv && typeof inv === "object" && !Array.isArray(inv)) {
      return mergeGuapoInvoiceMetadataIntoSeller(base, inv as Record<string, unknown>);
    }
  } catch {
    /* fall back to env-only */
  }
  return base;
}
