export type PdfSellerProfile = {
  companyName: string;
  /** Non-empty lines for street / extra */
  addressLines: string[];
  /** e.g. "2100 København Ø, Danmark" */
  postalCityLine: string;
  cvr: string | null;
  vatNumber: string | null;
  email: string | null;
  website: string | null;
  /** PNG/JPEG after fetch; SVG URLs are rasterized in build-order-pdf */
  logoUrl: string | null;
  /** Shown in small print footer (consumer rights, complaints, etc.) */
  footerLegalDa: string;
  footerLegalEn: string;
  /** Default VAT rate label when order has tax_total but no per-line breakdown */
  vatRatePercent: number;
};

const DEFAULT_FOOTER_DA = [
  "Angivne priser er i DKK med dansk moms, medmindre andet fremgår.",
  "Ordren er gennemført som forbrugerkøb efter dansk købelovgivning.",
  "Spørgsmål til ordren: kontakt os på den e-mail, der fremgår ovenfor.",
].join(" ");

const DEFAULT_FOOTER_EN = [
  "Prices are in DKK including Danish VAT unless stated otherwise.",
  "This purchase is governed by applicable consumer protection law.",
  "For order questions, use the contact email shown above.",
].join(" ");

/**
 * Fallback seller profile when **Region metadata** (flat keys or `guapo_invoice`) has no invoice block.
 * Real sælgerdata for PDF kommer fra **Region → metadata** for ordrens valuta; se `resolve-pdf-seller.ts`.
 */
export function getDefaultPdfSellerProfile(): PdfSellerProfile {
  return {
    companyName: "Guapo",
    addressLines: [],
    postalCityLine: "",
    cvr: null,
    vatNumber: null,
    email: null,
    website: null,
    logoUrl: null,
    footerLegalDa: DEFAULT_FOOTER_DA,
    footerLegalEn: DEFAULT_FOOTER_EN,
    vatRatePercent: 25,
  };
}

/** @deprecated Brug `getDefaultPdfSellerProfile`; PDF læser ikke længere GUAPO_INVOICE_* env. */
export function resolvePdfSellerProfile(): PdfSellerProfile {
  return getDefaultPdfSellerProfile();
}
