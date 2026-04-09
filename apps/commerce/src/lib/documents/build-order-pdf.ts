import PDFDocument from "pdfkit";
import type { PdfSellerProfile } from "./pdf-seller-config";
import { resolvePdfSellerProfile } from "./pdf-seller-config";

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
  title: string;
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
  /** Override seller (tests); default from env */
  sellerOverride?: PdfSellerProfile;
};

const BRAND = {
  navy: "#051537",
  accent: "#0f766e",
  muted: "#64748b",
  tableHeaderBg: "#e2e8f0",
  tableRowAlt: "#f8fafc",
  line: "#cbd5e1",
};

const MARGIN = 48;
const CONTENT_W = 595.28 - MARGIN * 2;

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
  internalRef: string;
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
  vatReg: string;
  cvrLabel: string;
  configureSellerHint: string;
};

const LABEL: Record<PdfLocale, Labels> = {
  da: {
    orderTitle: "Ordrebekræftelse",
    invoiceTitle: "Faktura",
    seller: "Sælger",
    customer: "Kunde / leveringsadresse",
    docRefInvoice: "Fakturanr.",
    docRefOrder: "Ordrenr.",
    date: "Dato",
    internalRef: "Intern reference",
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
    vatReg: "CVR-/momsnr.",
    cvrLabel: "CVR",
    configureSellerHint:
      "Konfigurér GUAPO_INVOICE_* miljøvariabler for fuld sælgerinformation på fakturaer (CVR, adresse, logo).",
  },
  en: {
    orderTitle: "Order confirmation",
    invoiceTitle: "Invoice",
    seller: "Seller",
    customer: "Customer / delivery address",
    docRefInvoice: "Invoice no.",
    docRefOrder: "Order no.",
    date: "Date",
    internalRef: "Internal reference",
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
    vatReg: "VAT reg. no.",
    cvrLabel: "Company reg. (CVR)",
    configureSellerHint:
      "Set GUAPO_INVOICE_* environment variables for complete seller details on PDFs (registration, address, logo).",
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
  const country =
    address.country_code && address.country_code.length === 2
      ? address.country_code.toUpperCase()
      : address.country_code;
  const lines = [fullName, address.address_1, address.address_2, cityLine, country, address.phone]
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  return lines;
}

async function loadLogoBuffer(url: string | null): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "image/png,image/jpeg,image/jpg,*/*" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
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

function drawHeader(doc: PdfDoc, y: number, input: BuildOrderPdfInput, labels: Labels): number {
  const isInvoice = input.documentKind === "invoice";
  const title = isInvoice ? labels.invoiceTitle : labels.orderTitle;
  const docRefLabel = isInvoice ? labels.docRefInvoice : labels.docRefOrder;
  const refValue = publicOrderRef(input.displayId, input.orderId);

  doc.save();
  doc.fillColor(BRAND.accent).lineWidth(2).moveTo(MARGIN, y + 4).lineTo(MARGIN + 72, y + 4).stroke();
  doc.restore();

  doc.fillColor(BRAND.navy).fontSize(20).font("Helvetica-Bold").text(title, MARGIN, y, {
    width: CONTENT_W * 0.55,
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`${docRefLabel} ${refValue}`, MARGIN, y + 26, { width: CONTENT_W * 0.55 });

  doc
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(`${labels.internalRef}: ${input.orderId}`, MARGIN, y + 38, {
      width: CONTENT_W * 0.55,
    });

  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(10).text(labels.original, MARGIN + CONTENT_W * 0.58, y);

  return y + 56;
}

function drawSellerCustomer(
  doc: PdfDoc,
  y: number,
  labels: Labels,
  seller: PdfSellerProfile,
  customerLines: string[],
  customerEmail?: string
): number {
  const colW = CONTENT_W / 2 - 8;
  let leftY = y;
  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(10).text(labels.seller, MARGIN, leftY);
  leftY += 14;
  doc.font("Helvetica").fontSize(9).fillColor(BRAND.navy);
  doc.font("Helvetica-Bold").text(seller.companyName, MARGIN, leftY, { width: colW });
  leftY += 12;
  doc.font("Helvetica");
  for (const line of seller.addressLines) {
    doc.text(line, MARGIN, leftY, { width: colW });
    leftY += 11;
  }
  if (seller.postalCityLine) {
    doc.text(seller.postalCityLine, MARGIN, leftY, { width: colW });
    leftY += 11;
  }
  if (seller.cvr) {
    doc.font("Helvetica-Bold").text(`${labels.cvrLabel}: `, MARGIN, leftY, { continued: true });
    doc.font("Helvetica").text(seller.cvr, { width: colW });
    leftY += 11;
  }
  if (seller.vatNumber) {
    doc.font("Helvetica-Bold").text(`${labels.vatReg}: `, MARGIN, leftY, { continued: true });
    doc.font("Helvetica").text(seller.vatNumber, { width: colW });
    leftY += 11;
  }
  if (seller.email) {
    doc.fillColor(BRAND.accent).text(seller.email, MARGIN, leftY, { width: colW });
    leftY += 11;
  }
  if (seller.website) {
    doc.text(seller.website, MARGIN, leftY, { width: colW });
    leftY += 11;
  }

  const rightX = MARGIN + CONTENT_W / 2 + 8;
  let rightY = y;
  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(10).text(labels.customer, rightX, rightY);
  rightY += 14;
  doc.font("Helvetica").fontSize(9);
  if (customerLines.length === 0) {
    doc.fillColor(BRAND.muted).text("—", rightX, rightY, { width: colW });
    rightY += 11;
  } else {
    for (const line of customerLines) {
      doc.fillColor(BRAND.navy).text(line, rightX, rightY, { width: colW });
      rightY += 11;
    }
  }
  if (customerEmail) {
    doc.fillColor(BRAND.muted).text(customerEmail, rightX, rightY, { width: colW });
    rightY += 11;
  }

  return Math.max(leftY, rightY) + 16;
}

function drawMetaBand(
  doc: PdfDoc,
  y: number,
  labels: Labels,
  createdAt: string | undefined,
  locale: PdfLocale,
  paymentLabel: string | null
): number {
  const boxH = 36;
  doc.save();
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 4).fill(BRAND.tableRowAlt);
  doc.restore();

  const cols = [
    { label: labels.date, value: formatDate(createdAt, locale) },
    {
      label: labels.payment,
      value: paymentLabel && paymentLabel.length > 0 ? paymentLabel : "—",
    },
  ];
  const colW = CONTENT_W / cols.length;
  cols.forEach((c, i) => {
    const x = MARGIN + i * colW + 10;
    doc.fillColor(BRAND.muted).font("Helvetica").fontSize(7).text(c.label.toUpperCase(), x, y + 8);
    doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(9).text(c.value, x, y + 18, {
      width: colW - 20,
    });
  });

  return y + boxH + 18;
}

function drawTableHeader(doc: PdfDoc, y: number, labels: Labels): number {
  const rowH = 22;
  doc.save();
  doc.rect(MARGIN, y, CONTENT_W, rowH).fill(BRAND.tableHeaderBg);
  doc.restore();

  const cols = [
    { w: 28, text: labels.colNr, align: "left" as const },
    { w: CONTENT_W - 28 - 52 - 78 - 78, text: labels.colDesc, align: "left" as const },
    { w: 52, text: labels.colQty, align: "right" as const },
    { w: 78, text: labels.colUnit, align: "right" as const },
    { w: 78, text: labels.colLine, align: "right" as const },
  ];
  let x = MARGIN + 6;
  doc.fillColor(BRAND.navy).font("Helvetica-Bold").fontSize(8);
  for (const c of cols) {
    doc.text(c.text, x, y + 7, { width: c.w - 6, align: c.align });
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
  const rowH = 28;
  if (idx % 2 === 1) {
    doc.save();
    doc.rect(MARGIN, y, CONTENT_W, rowH).fill("#fafbfc");
    doc.restore();
  }

  const descW = CONTENT_W - 28 - 52 - 78 - 78;
  doc.fillColor(BRAND.navy).font("Helvetica").fontSize(8);
  doc.text(String(idx + 1), MARGIN + 6, y + 9, { width: 22, align: "left" });
  doc.text(line.title, MARGIN + 28 + 6, y + 9, { width: descW - 12, ellipsis: true });
  doc.text(formatQty(line.quantity, locale), MARGIN + 28 + descW, y + 9, {
    width: 52 - 8,
    align: "right",
  });
  doc.text(formatMoney(line.unitPriceMinor, currency), MARGIN + 28 + descW + 52, y + 9, {
    width: 78 - 8,
    align: "right",
  });
  doc.font("Helvetica-Bold").text(formatMoney(line.lineTotalMinor, currency), MARGIN + 28 + descW + 52 + 78, y + 9, {
    width: 78 - 10,
    align: "right",
  });
  doc.font("Helvetica");

  doc.save();
  doc.strokeColor(BRAND.line).lineWidth(0.25).moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_W, y + rowH).stroke();
  doc.restore();

  return y + rowH;
}

function drawTotals(
  doc: PdfDoc,
  y: number,
  input: BuildOrderPdfInput,
  labels: Labels,
  locale: PdfLocale
): number {
  const currency = (input.currencyCode ?? "dkk").toUpperCase();
  const labelW = 200;
  const valueW = 100;
  const xLabel = MARGIN + CONTENT_W - labelW - valueW;
  const xVal = MARGIN + CONTENT_W - valueW;
  let rowY = y;

  const row = (label: string, value: string, bold = false) => {
    doc.fillColor(BRAND.navy).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    doc.text(label, xLabel, rowY, { width: labelW, align: "right" });
    doc.text(value, xVal, rowY, { width: valueW - 4, align: "right" });
    rowY += 14;
  };

  row(labels.subtotal, formatMoney(input.subtotalMinor, currency));
  if ((input.discountTotalMinor ?? 0) > 0) {
    row(labels.discount, `− ${formatMoney(input.discountTotalMinor ?? 0, currency)}`);
  }
  row(labels.shipping, formatMoney(input.shippingMinor, currency));
  if ((input.taxTotalMinor ?? 0) > 0) {
    const seller = input.sellerOverride ?? resolvePdfSellerProfile();
    row(
      `${labels.tax} (${seller.vatRatePercent} %)`,
      formatMoney(input.taxTotalMinor ?? 0, currency)
    );
  }
  rowY += 4;
  doc.save();
  doc.strokeColor(BRAND.navy).lineWidth(1).moveTo(xLabel, rowY).lineTo(MARGIN + CONTENT_W, rowY).stroke();
  doc.restore();
  rowY += 8;
  row(labels.total, formatMoney(input.totalMinor, currency), true);

  if (input.documentKind === "order_confirmation") {
    rowY += 10;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(labels.orderNote, MARGIN, rowY, { width: CONTENT_W, align: "left" });
    rowY += 28;
  }

  return rowY;
}

function drawFooter(
  doc: PdfDoc,
  seller: PdfSellerProfile,
  labels: Labels,
  locale: PdfLocale,
  afterContentY: number
): void {
  let y = Math.max(afterContentY + 28, 700);
  if (y > 780) {
    doc.addPage();
    y = MARGIN + 16;
  }
  doc.font("Helvetica").fontSize(7).fillColor(BRAND.muted);
  const hint =
    !seller.cvr && locale === "da"
      ? `${labels.configureSellerHint} `
      : !seller.cvr && locale === "en"
        ? `${labels.configureSellerHint} `
        : "";
  const legal = locale === "en" ? seller.footerLegalEn : seller.footerLegalDa;
  doc.text(hint + legal, MARGIN, y, {
    width: CONTENT_W,
    align: "left",
    lineGap: 2,
  });
}

export async function buildOrderPdf(input: BuildOrderPdfInput): Promise<Buffer> {
  const locale: PdfLocale = input.locale ?? "da";
  const labels = LABEL[locale];
  const seller = input.sellerOverride ?? resolvePdfSellerProfile();
  const logoBuf = await loadLogoBuffer(seller.logoUrl);

  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = (input.currencyCode ?? "dkk").toUpperCase();
    let y = MARGIN;

    y = drawHeader(doc, y, input, labels);

    if (logoBuf) {
      try {
        doc.image(logoBuf, MARGIN + CONTENT_W - 112, MARGIN, { width: 104, fit: [104, 40] });
      } catch {
        /* unsupported image type (e.g. SVG) */
      }
    }

    const customerLines = addressToLines(input.shippingAddress ?? null);
    y = drawSellerCustomer(doc, y, labels, seller, customerLines, input.customerEmail);

    y = drawMetaBand(doc, y, labels, input.createdAt, locale, input.paymentMethodLabel ?? null);

    y = drawTableHeader(doc, y, labels);
    input.lines.forEach((line, idx) => {
      if (y > 620) {
        doc.addPage();
        y = MARGIN;
        y = drawTableHeader(doc, y, labels);
      }
      y = drawTableRow(doc, y, idx, line, currency, locale);
    });

    y += 8;
    if (y > 560) {
      doc.addPage();
      y = MARGIN + 20;
    }
    y = drawTotals(doc, y, input, labels, locale);

    drawFooter(doc, seller, labels, locale, y);

    doc.end();
  });
}
