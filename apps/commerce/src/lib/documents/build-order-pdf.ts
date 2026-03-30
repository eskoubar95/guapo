import PDFDocument from "pdfkit";

type OrderAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  postal_code?: string;
  city?: string;
  country_code?: string;
};

export type OrderDocumentLine = {
  title: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type BuildOrderPdfInput = {
  documentTitle: string;
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
};

function formatMoney(minor: number, currencyCode: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(major);
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function addressToLines(address?: OrderAddress | null): string[] {
  if (!address) return ["-"];
  const fullName = [address.first_name, address.last_name].filter(Boolean).join(" ").trim();
  const cityLine = [address.postal_code, address.city].filter(Boolean).join(" ").trim();
  const lines = [fullName, address.address_1, address.address_2, cityLine, address.country_code]
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  return lines.length > 0 ? lines : ["-"];
}

export async function buildOrderPdf(input: BuildOrderPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = (input.currencyCode ?? "dkk").toUpperCase();
    const orderLabel = input.displayId != null ? `#${input.displayId}` : input.orderId;

    doc.fontSize(20).text(input.documentTitle);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Order: ${orderLabel}`);
    doc.text(`Created: ${formatDate(input.createdAt)}`);
    doc.text(`Customer: ${input.customerEmail ?? "-"}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Delivery address", { underline: true });
    for (const line of addressToLines(input.shippingAddress)) {
      doc.fontSize(10).text(line);
    }

    doc.moveDown(1);
    doc.fontSize(12).text("Items", { underline: true });
    doc.moveDown(0.5);
    for (const line of input.lines) {
      doc
        .fontSize(10)
        .text(
          `${line.quantity} x ${line.title}  |  ${formatMoney(line.unitPriceMinor, currency)}  |  ${formatMoney(
            line.lineTotalMinor,
            currency
          )}`
        );
    }

    doc.moveDown(1);
    doc.fontSize(11).text(`Subtotal: ${formatMoney(input.subtotalMinor, currency)}`, { align: "right" });
    doc.text(`Shipping: ${formatMoney(input.shippingMinor, currency)}`, { align: "right" });
    doc.fontSize(12).text(`Total: ${formatMoney(input.totalMinor, currency)}`, { align: "right" });

    doc.end();
  });
}
