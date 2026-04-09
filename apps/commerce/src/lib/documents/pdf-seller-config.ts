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
  /** Optional PNG/JPEG URL for PDF header */
  logoUrl: string | null;
  /** Shown in small print footer (consumer rights, complaints, etc.) */
  footerLegalDa: string;
  footerLegalEn: string;
  /** Default VAT rate label when order has tax_total but no per-line breakdown */
  vatRatePercent: number;
};

function pick(...parts: (string | undefined | null)[]): string[] {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length > 0);
}

/**
 * Seller block on PDFs — configure via GUAPO_INVOICE_* env (see env.template).
 * Without CVR/VAT, footer still reminds that legal details should be completed for production invoices.
 */
export function resolvePdfSellerProfile(): PdfSellerProfile {
  const companyName = process.env.GUAPO_INVOICE_COMPANY_NAME?.trim() || "Guapo";
  const line1 = process.env.GUAPO_INVOICE_ADDRESS_LINE1?.trim();
  const line2 = process.env.GUAPO_INVOICE_ADDRESS_LINE2?.trim();
  const postal = process.env.GUAPO_INVOICE_POSTAL_CODE?.trim();
  const city = process.env.GUAPO_INVOICE_CITY?.trim();
  const country = (process.env.GUAPO_INVOICE_COUNTRY?.trim() || "DK").toUpperCase();
  const cityParts = pick(postal, city).join(" ");
  const postalCityLine =
    cityParts.length > 0
      ? `${cityParts}${country ? `, ${country === "DK" ? "Danmark" : country}` : ""}`
      : country && country !== "DK"
        ? country
        : "";

  const addressLines = pick(line1, line2);
  const cvr = process.env.GUAPO_INVOICE_CVR?.trim() || null;
  const vatNumber = process.env.GUAPO_INVOICE_VAT_NUMBER?.trim() || null;
  const email = process.env.GUAPO_INVOICE_EMAIL?.trim() || null;
  const website = process.env.GUAPO_INVOICE_WEBSITE?.trim() || null;
  const logoUrl = process.env.GUAPO_INVOICE_LOGO_URL?.trim() || null;

  const footerLegalDa =
    process.env.GUAPO_INVOICE_FOOTER_LEGAL_DA?.trim() ||
    [
      "Angivne priser er i DKK med dansk moms, medmindre andet fremgår.",
      "Ordren er gennemført som forbrugerkøb efter dansk købelovgivning.",
      "Spørgsmål til ordren: kontakt os på den e-mail, der fremgår ovenfor.",
    ].join(" ");

  const footerLegalEn =
    process.env.GUAPO_INVOICE_FOOTER_LEGAL_EN?.trim() ||
    [
      "Prices are in DKK including Danish VAT unless stated otherwise.",
      "This purchase is governed by applicable consumer protection law.",
      "For order questions, use the contact email shown above.",
    ].join(" ");

  const vatPct = Number(process.env.GUAPO_INVOICE_VAT_RATE_PERCENT);
  const vatRatePercent = Number.isFinite(vatPct) && vatPct > 0 ? vatPct : 25;

  return {
    companyName,
    addressLines,
    postalCityLine,
    cvr,
    vatNumber,
    email,
    website,
    logoUrl,
    footerLegalDa,
    footerLegalEn,
    vatRatePercent,
  };
}
