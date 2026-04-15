import PDFDocument from "pdfkit";
import type { PdfSellerProfile } from "./pdf-seller-config";
import { getDefaultPdfSellerProfile } from "./pdf-seller-config";

type OrderAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  postal_code?: string;
  city?: string;
  country_code?: string;
  phone?: string;
};

export type OrderDocumentLine = {
  /** Primær linje (fx brand — produkt); bruges også som fallback én-linje. */
  title: string;
  /** Variant / undertitel, mindre skrift under `title`. */
  subtitle?: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type PdfDocumentKind = "order_confirmation" | "invoice";

export type PdfLocale = "da" | "en";

export type BuildOrderPdfInput = {
  documentKind: PdfDocumentKind;
  locale?: PdfLocale;
  orderId: string;
  displayId?: number;
  createdAt?: string;
  currencyCode?: string;
  customerEmail?: string;
  shippingAddress?: OrderAddress | null;
  lines: OrderDocumentLine[];
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  /** Order-level tax (major in Medusa → pass minor) */
  taxTotalMinor?: number;
  discountTotalMinor?: number;
  /** e.g. "Visa •••• 4242" */
  paymentMethodLabel?: string | null;
  /** Override seller (tests); default from `getDefaultPdfSellerProfile` + region in production */
  sellerOverride?: PdfSellerProfile;
};

const BRAND = {
  navy: "#051537",
  accent: "#0f766e",
  muted: "#64748b",
  tableHeaderBg: "#e2e8f0",
  tableRowAlt: "#f8fafc",
  cardFill: "#f1f5f9",
  line: "#cbd5e1",
};

/** Symmetriske sider på A4 (PDFKit page width 595.28 pt). */
const MARGIN = 48;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;
/** Indrykning af tabel / totaler så højre kolonne ikke sidder flush mod papirkant. */
const INNER_PAD = 12;
const TABLE_LEFT = MARGIN + INNER_PAD;
const TABLE_WIDTH = CONTENT_W - INNER_PAD * 2;

/** PDFKit document handle (pdfkit ships without strict exported instance type). */
type PdfDoc = InstanceType<typeof PDFDocument>;

type Labels = {
  orderTitle: string;
  invoiceTitle: string;
  seller: string;
  customer: string;
  docRefInvoice: string;
  docRefOrder: string;
  date: string;
  payment: string;
  colNr: string;
  colDesc: string;
  colQty: string;
  colUnit: string;
  colLine: string;
  shipping: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  page: string;
  original: string;
  orderNote: string;
  cvrLabel: string;
};

const LABEL: Record<PdfLocale, Labels> = {
  da: {
    orderTitle: "Ordrebekræftelse",
    invoiceTitle: "Faktura",
    seller: "Sælger",
    customer: "Kunde",
    docRefInvoice: "Fakturanr.",
    docRefOrder: "Ordrenr.",
    date: "Dato",
    payment: "Betalingsmetode",
    colNr: "Nr.",
    colDesc: "Beskrivelse",
    colQty: "Antal",
    colUnit: "Enhedspris",
    colLine: "Beløb",
    shipping: "Fragt",
    subtotal: "Subtotal (varer)",
    discount: "Rabat",
    tax: "Heraf moms",
    total: "Total inkl. moms",
    page: "Side",
    original: "ORIGINAL",
    orderNote:
      "Oversigt over din ordre. Faktura følger som vedhæftet fil i ordrebekræftelsesmailen og kan også hentes på Min konto.",
    cvrLabel: "CVR",
  },
  en: {
    orderTitle: "Order confirmation",
    invoiceTitle: "Invoice",
    seller: "Seller",
    customer: "Customer / delivery address",
    docRefInvoice: "Invoice no.",
    docRefOrder: "Order no.",
    date: "Date",
    payment: "Payment method",
    colNr: "No.",
    colDesc: "Description",
    colQty: "Qty",
    colUnit: "Unit price",
    colLine: "Amount",
    shipping: "Shipping",
    subtotal: "Subtotal (items)",
    discount: "Discount",
    tax: "VAT included",
    total: "Total (incl. VAT)",
    page: "Page",
    original: "ORIGINAL",
    orderNote:
      "Summary of your order. The invoice is attached to your confirmation email and available in your account.",
    cvrLabel: "Company reg. (CVR)",
  },
};

function formatMoney(minor: number, currencyCode: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(major);
}

function formatDate(value: string | undefined, locale: PdfLocale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "da" ? "da-DK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatQty(q: number, locale: PdfLocale): string {
  return new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(q);
}

function addressToLines(address: OrderAddress | null | undefined): string[] {
  if (!address) return [];
  const fullName = [address.first_name, address.last_name].filter(Boolean).join(" ").trim();
  const cityLine = [address.postal_code, address.city].filter(Boolean).join(" ").trim();
  const cc = String(address.country_code ?? "")
    .trim()
    .toLowerCase();
  const countryDisplay =
    cc === "dk" ? "Danmark" : cc.length === 2 ? address.country_code!.toUpperCase() : address.country_code;
  const lines = [fullName, address.address_1, address.address_2, cityLine, countryDisplay, address.phone]
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  return lines;
}

/** Én CVR-linje på faktura: metadata `cvr`, ellers 8 cifre ud fra `vat_number` (fx DKxxxxxxxx). */
function sellerDisplayCvr(seller: PdfSellerProfile): string | null {
  const c = seller.cvr?.trim();
  if (c) return c;
  const v = seller.vatNumber?.trim();
  if (!v) return null;
  const dk = v.match(/^DK\s*(\d{8})$/i);
  if (dk) return dk[1];
  if (/^\d{8}$/.test(v)) return v;
  const stripped = v.replace(/^DK\s*/i, "").trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Fetch logo for PDFKit. **SVG** (typisk fra CDN) rasteriseres med **sharp** til PNG;
 * PNG/JPEG sendes videre råt.
 */
async function loadLogoBufferForPdf(url: string | null): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  try {
    const res = await fetch(trimmed, {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "image/png,image/jpeg,image/jpg,image/svg+xml,*/*" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8 || buf.length > 5_000_000) return null;

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const urlLooksSvg = /\.svg(\?|#|$)/i.test(trimmed);
    const headUtf8 = buf.slice(0, Math.min(400, buf.length)).toString("utf8").trimStart();
    const sniffSvg = headUtf8.startsWith("<") && headUtf8.includes("<svg");

    const isSvg = ct.includes("svg") || urlLooksSvg || sniffSvg;

    if (isSvg) {
      const sharp = (await import("sharp")).default;
      return await sharp(buf, { density: 200 })
        .resize(360, 140, { fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
    }

    if (buf.length < 32 || buf.length > 2_000_000) return null;
    return buf;
  } catch {
    return null;
  }
}

function publicOrderRef(displayId: number | undefined, orderId: string): string {
  if (displayId != null) return String(displayId);
  return orderId.length > 12 ? orderId.slice(-12) : orderId;
}

function drawHeader(
  doc: PdfDoc,
  y: number,
  input: BuildOrderPdfInput,
  labels: Labels,
  logoBuf: Buffer | null
): number {
  const isInvoice = input.documentKind === "invoice";
  const title = isInvoice ? labels.invoiceTitle : labels.orderTitle;
  const docRefLabel = isInvoice ? labels.docRefInvoice : labels.docRefOrder;
  const refValue = publicOrderRef(input.displayId, input.orderId);

  const logoW = 118;
  const logoH = 44;
  const titleBlockW = logoBuf ? CONTENT_W - logoW - 28 : CONTENT_W * 0.62;

  doc.save();
  doc.fillColor(BRAND.accent).rect(MARGIN, y, 3, 30).fill();
  doc.restore();

  doc
    .fillColor(BRAND.navy)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(title, MARGIN + 10, y, {
      width: titleBlockW,
    });

  doc.font("Helvetica").fontSize(10).fillColor(BRAND.muted).text(`${docRefLabel} ${refValue}`, MARGIN + 10, y + 32, {
    width: titleBlockW,
  });

  doc
    .fillColor(BRAND.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(labels.original, PAGE_W - MARGIN - 88, y + 2, { width: 88, align: "right" });

  if (logoBuf) {
    try {
      const lx = PAGE_W - MARGIN - logoW;
      const logoY = y + 20;
      doc.image(logoBuf, lx, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
    } catch {
      /* unsupported raster */
    }
  }

  const ruleY = y + (logoBuf ? 72 : 52);
  doc.save();
  doc.strokeColor(BRAND.line)
    .lineWidth(0.75)
    .moveTo(MARGIN, ruleY)
    .lineTo(MARGIN + CONTENT_W, ruleY)
    .stroke();
  doc.restore();

  return ruleY + 16;
}

function drawSellerCustomer(
  doc: PdfDoc,
  y: number,
  labels: Labels,
  seller: PdfSellerProfile,
  customerLines: string[],
  customerEmail?: string
): number {
  const gap = 20;
  const colW = (TABLE_WIDTH - gap) / 2;
  const lx = TABLE_LEFT;
  const rx = TABLE_LEFT + colW + gap;
  const lineH = 12;
  let leftY = y;
  let rightY = y;

  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(11).text(labels.seller, lx, leftY);
  leftY += 15;
  doc.font("Helvetica-Bold").fontSize(10).text(seller.companyName, lx, leftY, { width: colW });
  leftY += 13;
  doc.font("Helvetica").fontSize(9.5).fillColor(BRAND.navy);
  for (const line of seller.addressLines) {
    doc.text(line, lx, leftY, { width: colW });
    leftY += lineH;
  }
  if (seller.postalCityLine) {
    doc.text(seller.postalCityLine, lx, leftY, { width: colW });
    leftY += lineH;
  }
  const cvrDisplay = sellerDisplayCvr(seller);
  if (cvrDisplay) {
    doc.font("Helvetica-Bold").text(`${labels.cvrLabel}: `, lx, leftY, { continued: true });
    doc.font("Helvetica").text(cvrDisplay, { width: colW });
    leftY += lineH;
  }
  if (seller.email) {
    doc.fillColor(BRAND.accent).text(seller.email, lx, leftY, { width: colW });
    leftY += lineH;
  }
  if (seller.website) {
    doc.fillColor(BRAND.navy).text(seller.website, lx, leftY, { width: colW });
    leftY += lineH;
  }

  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(11).text(labels.customer, rx, rightY);
  rightY += 15;
  doc.font("Helvetica").fontSize(9.5);
  if (customerLines.length === 0) {
    doc.fillColor(BRAND.muted).text("—", rx, rightY, { width: colW });
    rightY += lineH;
  } else {
    for (const line of customerLines) {
      doc.fillColor(BRAND.navy).text(line, rx, rightY, { width: colW });
      rightY += lineH;
    }
  }
  if (customerEmail) {
    doc.fillColor(BRAND.muted).text(customerEmail, rx, rightY, { width: colW });
    rightY += lineH;
  }

  return Math.max(leftY, rightY) + 20;
}

function drawMetaBand(
  doc: PdfDoc,
  y: number,
  labels: Labels,
  createdAt: string | undefined,
  locale: PdfLocale,
  paymentLabel: string | null
): number {
  const boxH = 40;
  doc.save();
  doc.roundedRect(TABLE_LEFT, y, TABLE_WIDTH, boxH, 6).fill(BRAND.tableRowAlt);
  doc.strokeColor(BRAND.line).lineWidth(0.35).roundedRect(TABLE_LEFT, y, TABLE_WIDTH, boxH, 6).stroke();
  doc.restore();

  const cols = [
    { label: labels.date, value: formatDate(createdAt, locale) },
    {
      label: labels.payment,
      value: paymentLabel && paymentLabel.length > 0 ? paymentLabel : "—",
    },
  ];
  const colW = TABLE_WIDTH / cols.length;
  cols.forEach((c, i) => {
    const x = TABLE_LEFT + i * colW + 12;
    doc.fillColor(BRAND.muted).font("Helvetica").fontSize(7.5).text(c.label.toUpperCase(), x, y + 9);
    doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(9.5).text(c.value, x, y + 20, {
      width: colW - 24,
    });
  });

  return y + boxH + 20;
}

const COL_NR = 26;
const COL_QTY = 46;
const COL_UNIT = 74;
const COL_AMT = 76;

function tableDescWidth(): number {
  return TABLE_WIDTH - COL_NR - COL_QTY - COL_UNIT - COL_AMT;
}

function drawTableHeader(doc: PdfDoc, y: number, labels: Labels): number {
  const rowH = 26;
  const descW = tableDescWidth();
  doc.save();
  doc.roundedRect(TABLE_LEFT, y, TABLE_WIDTH, rowH, 4).fill(BRAND.tableHeaderBg);
  doc.strokeColor(BRAND.line).lineWidth(0.35).roundedRect(TABLE_LEFT, y, TABLE_WIDTH, rowH, 4).stroke();
  doc.restore();

  const cols = [
    { w: COL_NR, text: labels.colNr, align: "left" as const },
    { w: descW, text: labels.colDesc, align: "left" as const },
    { w: COL_QTY, text: labels.colQty, align: "right" as const },
    { w: COL_UNIT, text: labels.colUnit, align: "right" as const },
    { w: COL_AMT, text: labels.colLine, align: "right" as const },
  ];
  let x = TABLE_LEFT + 6;
  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(9);
  for (const c of cols) {
    doc.text(c.text, x, y + 9, { width: c.w - 6, align: c.align });
    x += c.w;
  }
  return y + rowH;
}

function drawTableRow(
  doc: PdfDoc,
  y: number,
  idx: number,
  line: OrderDocumentLine,
  currency: string,
  locale: PdfLocale
): number {
  const sub = line.subtitle?.trim();
  const rowH = sub ? 42 : 34;
  const descW = tableDescWidth();
  const xNr = TABLE_LEFT + 6;
  const xDesc = TABLE_LEFT + COL_NR + 4;
  const xQty = TABLE_LEFT + COL_NR + descW;
  const xUnit = xQty + COL_QTY;
  const xAmt = xUnit + COL_UNIT;

  if (idx % 2 === 1) {
    doc.save();
    doc.rect(TABLE_LEFT, y, TABLE_WIDTH, rowH).fill("#fafbfc");
    doc.restore();
  }

  doc.fillColor(BRAND.navy).font("Helvetica").fontSize(9);
  doc.text(String(idx + 1), xNr, y + (sub ? 14 : 11), { width: COL_NR - 8, align: "left" });

  doc.font("Helvetica-Bold").fontSize(9).text(line.title, xDesc, y + (sub ? 10 : 11), {
    width: descW - 10,
    ellipsis: true,
  });
  if (sub) {
    doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted).text(sub, xDesc, y + 22, {
      width: descW - 10,
      ellipsis: true,
    });
    doc.fillColor(BRAND.navy);
  }

  const numY = y + (sub ? 14 : 11);
  doc.font("Helvetica").fontSize(9);
  doc.text(formatQty(line.quantity, locale), xQty, numY, {
    width: COL_QTY - 6,
    align: "right",
  });
  doc.text(formatMoney(line.unitPriceMinor, currency), xUnit, numY, {
    width: COL_UNIT - 6,
    align: "right",
  });
  doc.font("Helvetica-Bold").text(formatMoney(line.lineTotalMinor, currency), xAmt, numY, {
    width: COL_AMT - 8,
    align: "right",
  });
  doc.font("Helvetica");

  doc.save();
  doc.strokeColor(BRAND.line)
    .lineWidth(0.25)
    .moveTo(TABLE_LEFT, y + rowH)
    .lineTo(TABLE_LEFT + TABLE_WIDTH, y + rowH)
    .stroke();
  doc.restore();

  return y + rowH;
}

function drawTotals(
  doc: PdfDoc,
  y: number,
  input: BuildOrderPdfInput,
  labels: Labels,
  locale: PdfLocale,
  seller: PdfSellerProfile
): number {
  const currency = (input.currencyCode ?? "dkk").toUpperCase();
  const labelW = 200;
  const valueW = 100;
  const totalsRight = TABLE_LEFT + TABLE_WIDTH - INNER_PAD;
  const xVal = totalsRight - valueW;
  const xLabel = xVal - labelW;
  let rowY = y;

  const row = (label: string, value: string, bold = false) => {
    doc.fillColor(BRAND.navy).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9.5);
    doc.text(label, xLabel, rowY, { width: labelW, align: "right" });
    doc.text(value, xVal, rowY, { width: valueW - 4, align: "right" });
    rowY += 15;
  };

  row(labels.subtotal, formatMoney(input.subtotalMinor, currency));
  if ((input.discountTotalMinor ?? 0) > 0) {
    row(labels.discount, `− ${formatMoney(input.discountTotalMinor ?? 0, currency)}`);
  }
  row(labels.shipping, formatMoney(input.shippingMinor, currency));
  if ((input.taxTotalMinor ?? 0) > 0) {
    row(
      `${labels.tax} (${seller.vatRatePercent} %)`,
      formatMoney(input.taxTotalMinor ?? 0, currency)
    );
  }
  rowY += 4;
  doc.save();
  doc.strokeColor(BRAND.navy).lineWidth(1).moveTo(xLabel, rowY).lineTo(totalsRight, rowY).stroke();
  doc.restore();
  rowY += 8;
  row(labels.total, formatMoney(input.totalMinor, currency), true);

  if (input.documentKind === "order_confirmation") {
    rowY += 10;
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(BRAND.muted)
      .text(labels.orderNote, TABLE_LEFT, rowY, { width: TABLE_WIDTH, align: "left" });
    rowY += 28;
  }

  return rowY;
}

function drawFooter(
  doc: PdfDoc,
  seller: PdfSellerProfile,
  _labels: Labels,
  locale: PdfLocale,
  afterContentY: number
): void {
  let y = Math.max(afterContentY + 28, 700);
  if (y > 780) {
    doc.addPage();
    y = MARGIN + 16;
  }
  doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted);
  const legal = locale === "en" ? seller.footerLegalEn : seller.footerLegalDa;
  doc.text(legal, TABLE_LEFT, y, {
    width: TABLE_WIDTH,
    align: "left",
    lineGap: 3,
  });
}

export async function buildOrderPdf(input: BuildOrderPdfInput): Promise<Buffer> {
  const locale: PdfLocale = input.locale ?? "da";
  const labels = LABEL[locale];
  const seller = input.sellerOverride ?? getDefaultPdfSellerProfile();
  const logoBuf = await loadLogoBufferForPdf(seller.logoUrl);

  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = (input.currencyCode ?? "dkk").toUpperCase();
    let y = MARGIN;

    y = drawHeader(doc, y, input, labels, logoBuf);

    const customerLines = addressToLines(input.shippingAddress ?? null);
    y = drawSellerCustomer(doc, y, labels, seller, customerLines, input.customerEmail);

    y = drawMetaBand(doc, y, labels, input.createdAt, locale, input.paymentMethodLabel ?? null);

    y = drawTableHeader(doc, y, labels);
    input.lines.forEach((line, idx) => {
      if (y > 610) {
        doc.addPage();
        y = MARGIN;
        y = drawTableHeader(doc, y, labels);
      }
      y = drawTableRow(doc, y, idx, line, currency, locale);
    });

    y += 8;
    if (y > 540) {
      doc.addPage();
      y = MARGIN + 20;
    }
    y = drawTotals(doc, y, input, labels, locale, seller);

    drawFooter(doc, seller, labels, locale, y);

    doc.end();
  });
}
