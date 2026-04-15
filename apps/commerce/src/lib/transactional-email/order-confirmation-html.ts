import type { OrderEmailMoneySummary } from "../documents/order-document-generation";
import { escapeAttr, escapeHtml } from "./email-layout";
import type { TransactionalLocale } from "./types";

function formatMoneyMajor(major: number, currencyCode: string, locale: TransactionalLocale): string {
  return new Intl.NumberFormat(locale === "da" ? "da-DK" : "en-GB", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(major);
}

const COPY = {
  da: {
    subtotal: "Subtotal (varer)",
    discount: "Rabat",
    shipping: "Fragt",
    tax: "Heraf moms",
    total: "Total inkl. moms",
    qty: "Antal",
    unitEach: "á",
  },
  en: {
    subtotal: "Subtotal (items)",
    discount: "Discount",
    shipping: "Shipping",
    tax: "VAT included",
    total: "Total (incl. VAT)",
    qty: "Qty",
    unitEach: "ea.",
  },
} as const;

function moneyRow(
  label: string,
  value: string,
  opts?: { strong?: boolean; borderTop?: boolean; muted?: boolean }
): string {
  const weight = opts?.strong ? "700" : "500";
  const color = opts?.muted ? "#64748b" : "#051537";
  const border = opts?.borderTop ? "border-top:1px solid #cbd5e1;padding-top:12px;margin-top:8px;" : "";
  return `<tr>
  <td style="padding:4px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${color};${border}">${escapeHtml(label)}</td>
  <td style="padding:4px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${color};text-align:right;white-space:nowrap;font-weight:${weight};">${value}</td>
</tr>`;
}

/**
 * Order lines + totals as table-based HTML (single column stack on narrow clients via media query).
 */
export function buildOrderConfirmationMoneyBlock(
  locale: TransactionalLocale,
  summary: OrderEmailMoneySummary,
  vatRatePercent: number
): string {
  const isDa = locale === "da";
  const L = isDa ? COPY.da : COPY.en;
  const cc = summary.currencyCode;

  const lineRows = summary.lines
    .map((line) => {
      const title = escapeHtml(line.title);
      const sub = line.subtitle
        ? `<p class="oc-ms" style="margin:4px 0 0 0;font-size:13px;line-height:20px;color:#64748b;">${escapeHtml(line.subtitle)}</p>`
        : "";
      const qtyLine = `${L.qty}: ${line.quantity} · ${L.unitEach} ${formatMoneyMajor(line.unitPriceMajor, cc, locale)}`;
      const right = formatMoneyMajor(line.lineTotalMajor, cc, locale);
      const thumb = line.thumbnailUrl?.trim();
      const thumbCell =
        thumb && thumb.length > 0
          ? `<td class="oc-line-thumb" valign="top" style="width:76px;padding:14px 12px 14px 0;vertical-align:top;">
  <img class="oc-line-img" src="${escapeAttr(thumb)}" alt="${escapeAttr(line.title.slice(0, 100))}" width="60" height="60" style="display:block;width:60px;height:60px;border-radius:8px;object-fit:cover;border:1px solid #e2e8f0;">
</td>`
          : "";
      const descWidthStyle = thumb ? "width:52%;max-width:280px;" : "width:65%;max-width:360px;";
      return `<tr>
  <td class="guapo-order-line-sep" colspan="2" style="padding:0;border-bottom:1px solid #e2e8f0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="oc-line-wrap" style="border-collapse:collapse;">
      <tr>
        ${thumbCell}
        <td class="oc-line-desc" style="padding:14px 0 14px 0;vertical-align:top;${descWidthStyle}">
          <p class="oc-mt" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:22px;font-weight:600;color:#051537;">${title}</p>
          ${sub}
          <p class="oc-mq" style="margin:8px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:#94a3b8;">${escapeHtml(qtyLine)}</p>
        </td>
        <td class="oc-line-price" valign="top" style="padding:14px 0 14px 12px;vertical-align:top;text-align:right;white-space:nowrap;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:22px;font-weight:600;color:#051537;width:35%;">${right}</td>
      </tr>
    </table>
  </td>
</tr>`;
    })
    .join("");

  const rows: string[] = [];
  rows.push(moneyRow(L.subtotal, formatMoneyMajor(summary.subtotalMajor, cc, locale)));
  if (summary.discountMajor != null && summary.discountMajor > 0) {
    rows.push(
      moneyRow(L.discount, `− ${formatMoneyMajor(summary.discountMajor, cc, locale)}`, { muted: true })
    );
  }
  rows.push(moneyRow(L.shipping, formatMoneyMajor(summary.shippingMajor, cc, locale)));
  if (summary.taxMajor != null && summary.taxMajor > 0) {
    const taxLabel = `${L.tax} (${vatRatePercent} %)`;
    rows.push(moneyRow(taxLabel, formatMoneyMajor(summary.taxMajor, cc, locale), { muted: true }));
  }
  rows.push(moneyRow(L.total, formatMoneyMajor(summary.totalMajor, cc, locale), { strong: true, borderTop: true }));

  return `
<table role="presentation" class="guapo-order-summary" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0 0;border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;">
  <tbody>
    ${lineRows}
    <tr>
      <td class="guapo-order-totals" colspan="2" style="padding:16px 16px 14px 16px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${rows.join("")}
        </table>
      </td>
    </tr>
  </tbody>
</table>`.trim();
}
