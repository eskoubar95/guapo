/**
 * Render all transactional email templates to local HTML files (no Plunk, no DB).
 *
 * Usage (from apps/commerce):
 *   pnpm preview:transactional-emails
 *
 * Open: tmp/email-previews/index.html
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildGuapoEmailDocument,
  ctaButton,
  escapeHtml,
} from "../lib/transactional-email/email-layout";
import { renderTransactionalTemplate } from "../lib/transactional-email/templates";
import type {
  TransactionalLocale,
  TransactionalPayloadByTemplate,
  TransactionalTemplate,
} from "../lib/transactional-email/types";

const OUT_DIR = join(process.cwd(), "tmp", "email-previews");
const STORE_NAME = "Guapo";

const money: TransactionalPayloadByTemplate["order_confirmation"]["money"] = {
  lines: [
    {
      title: "Guapo Kaffe",
      subtitle: "500 g · Hele bønner",
      quantity: 2,
      unitPriceMajor: 149,
      lineTotalMajor: 298,
    },
  ],
  subtotalMajor: 298,
  shippingMajor: 49,
  taxMajor: 86.75,
  totalMajor: 447.75,
  currencyCode: "dkk",
};

function nextRenewalIso(): string {
  return new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
}

function subscriptionPayload(
  locale: TransactionalLocale
): TransactionalPayloadByTemplate["subscription_created"] {
  const base = "https://example.com";
  const path = locale === "da" ? "/da/dk" : "/en/dk";
  return {
    orderId: "ord_preview",
    displayId: 1042,
    storefrontSubscriptionsUrl: `${base}${path}/account/subscriptions`,
    storefrontOrderUrl: `${base}${path}/account/orders/ord_preview`,
    subscriptions: [
      {
        productTitle: locale === "da" ? "Abonnement – Guapo" : "Guapo subscription",
        variantTitle: locale === "da" ? "Hver 2. uge" : "Every 2 weeks",
        cycleWeeks: 2,
        quantity: 1,
        nextRenewalAtIso: nextRenewalIso(),
        discountPercent: 10,
      },
    ],
  };
}

function samplesForLocale(locale: TransactionalLocale): Array<{
  fileBase: string;
  template: TransactionalTemplate;
  payload: TransactionalPayloadByTemplate[TransactionalTemplate];
}> {
  const base = "https://example.com";
  const path = locale === "da" ? "/da/dk" : "/en/dk";
  const subsUrl = `${base}${path}/account/subscriptions`;
  const orderUrl = `${base}${path}/account/orders/ord_preview`;
  const next = nextRenewalIso();

  return [
    {
      fileBase: `order_confirmation_${locale}`,
      template: "order_confirmation",
      payload: {
        orderId: "ord_preview",
        displayId: 1042,
        storefrontOrderUrl: orderUrl,
        money,
        vatRatePercent: 25,
      },
    },
    {
      fileBase: `subscription_created_${locale}`,
      template: "subscription_created",
      payload: subscriptionPayload(locale),
    },
    {
      fileBase: `renewal_reminder_3_days_${locale}`,
      template: "renewal_reminder_3_days",
      payload: {
        storefrontSubscriptionsUrl: subsUrl,
        nextRenewalAtIso: next,
        cycleWeeks: 2,
      },
    },
    {
      fileBase: `payment_failed_retry_1_${locale}`,
      template: "payment_failed_retry_1",
      payload: { storefrontSubscriptionsUrl: subsUrl, failureAttempt: 1 },
    },
    {
      fileBase: `payment_failed_retry_2_${locale}`,
      template: "payment_failed_retry_1",
      payload: { storefrontSubscriptionsUrl: subsUrl, failureAttempt: 2 },
    },
    {
      fileBase: `payment_failed_final_exhausted_${locale}`,
      template: "payment_failed_final_on_hold",
      payload: {
        storefrontSubscriptionsUrl: subsUrl,
        reason: "payment_exhausted",
      },
    },
    {
      fileBase: `payment_failed_final_auth_${locale}`,
      template: "payment_failed_final_on_hold",
      payload: {
        storefrontSubscriptionsUrl: subsUrl,
        reason: "authentication_required",
      },
    },
    {
      fileBase: `payment_recovered_${locale}`,
      template: "payment_recovered",
      payload: { storefrontSubscriptionsUrl: subsUrl },
    },
    {
      fileBase: `subscription_paused_${locale}`,
      template: "subscription_paused",
      payload: { storefrontSubscriptionsUrl: subsUrl },
    },
    {
      fileBase: `subscription_resumed_${locale}`,
      template: "subscription_resumed",
      payload: { storefrontSubscriptionsUrl: subsUrl },
    },
    {
      fileBase: `subscription_cancelled_${locale}`,
      template: "subscription_cancelled",
      payload: { storefrontSubscriptionsUrl: subsUrl },
    },
    {
      fileBase: `shipment_tracking_available_${locale}`,
      template: "shipment_tracking_available",
      payload: {
        orderDetailUrl: orderUrl,
        displayLabel: "#1042",
        trackingUrl: "https://example.com/track/ABC123",
        trackingNumber: "ABC123",
      },
    },
  ];
}

function buildInvitePreviewHtml(): string {
  const inviteUrl = "https://admin.example.com/app/invite?token=preview-token";
  const subject = `You've been invited to join ${STORE_NAME}`;
  const pIntro =
    "margin:0 0 16px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#334155;text-align:left;";
  const pMuted =
    "margin:16px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#64748b;text-align:left;";
  return buildGuapoEmailDocument({
    lang: "en",
    tone: "admin",
    documentTitle: subject,
    preheader: `Accept your invitation to join the ${STORE_NAME} admin team.`,
    heroTitle: "Admin invitation",
    heroSubtitle: `${escapeHtml(STORE_NAME)} · Medusa`,
    mainAlign: "left",
    mainHtml: `
      <p style="${pIntro}">You have been invited to join <strong style="color:#051537;">${escapeHtml(STORE_NAME)}</strong> on Medusa Admin. Use the button below to accept and set your password.</p>
      <div style="margin:12px 0 20px 0;text-align:left;">
        ${ctaButton(inviteUrl, "Accept invitation")}
      </div>
      <p style="${pMuted}">If the button does not work, open this link in your browser (personal — do not forward):</p>
      <p style="margin:8px 0 0 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;line-height:16px;color:#475569;word-break:break-all;">${escapeHtml(inviteUrl)}</p>
    `.trim(),
    closingTitle: "",
    closingSubtitle: "",
    closingBody: "",
    footerLegal:
      "You are receiving this email because an administrator invited you to Guapo Admin. If this was a mistake, you can ignore this message.",
  });
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const entries: Array<{ href: string; label: string; subject: string }> = [];

  for (const locale of ["da", "en"] as const) {
    for (const sample of samplesForLocale(locale)) {
      const { subject, html } = renderTransactionalTemplate(
        sample.template,
        locale,
        sample.payload as never
      );
      const filename = `${sample.fileBase}.html`;
      writeFileSync(join(OUT_DIR, filename), html, "utf8");
      entries.push({
        href: filename,
        label: sample.fileBase.replace(`_${locale}`, ` (${locale})`),
        subject,
      });
    }
  }

  const inviteFilename = "invite_admin_en.html";
  writeFileSync(join(OUT_DIR, inviteFilename), buildInvitePreviewHtml(), "utf8");
  entries.push({
    href: inviteFilename,
    label: "invite_admin (en)",
    subject: `You've been invited to join ${STORE_NAME}`,
  });

  const listItems = entries
    .sort((a, b) => a.href.localeCompare(b.href))
    .map(
      (e) =>
        `<li><a href="${escapeHtml(e.href)}">${escapeHtml(e.label)}</a> — ${escapeHtml(e.subject)}</li>`
    )
    .join("\n");

  const indexHtml = `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <title>Guapo — transactional email previews</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    ul { line-height: 1.7; }
    a { color: #051537; }
 p.muted { color: #64748b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Transactional email previews</h1>
  <p class="muted">Generated locally — dummy URLs and data. Regenerate with <code>pnpm preview:transactional-emails</code> from <code>apps/commerce</code>.</p>
  <ul>
${listItems}
  </ul>
</body>
</html>`;

  writeFileSync(join(OUT_DIR, "index.html"), indexHtml, "utf8");

  console.info(`Wrote ${entries.length} previews + index.html → ${OUT_DIR}`);
}

main();
