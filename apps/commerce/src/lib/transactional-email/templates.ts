import {
  bodyLink,
  buildGuapoEmailDocument,
  ctaButton,
  escapeHtml,
} from "./email-layout";
import { renderLifecycleTransactionalTemplate } from "./lifecycle-email-templates";
import type {
  TransactionalLocale,
  TransactionalPayloadByTemplate,
  TransactionalRenderResult,
  TransactionalTemplate,
} from "./types";

type Renderer<T extends TransactionalTemplate> = (
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate[T]
) => TransactionalRenderResult;

const P_INTRO =
  "margin:0 0 16px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#4a5568;text-align:center;";
const P_SMALL =
  "margin:0 0 8px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:center;";
const H_SECTION =
  "margin:28px 0 12px 0;font-family:'Lexend',Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:3px;color:#7b8599;text-transform:uppercase;text-align:center;";

const orderConfirmationRenderer: Renderer<"order_confirmation"> = (locale, payload) => {
  const isDa = locale === "da";
  const orderLabel = payload.displayId != null ? `#${payload.displayId}` : payload.orderId;
  const subject = isDa ? `Tak for din ordre ${orderLabel}` : `Thanks for your order ${orderLabel}`;

  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Din ordre ${escapeHtml(orderLabel)} er modtaget og behandles nu.</p>
      <div style="margin:8px 0 28px 0;text-align:center;">
        ${ctaButton(payload.storefrontOrderUrl, "Se ordrestatus")}
      </div>
      <p style="${H_SECTION}">Dokumenter</p>
      <p style="${P_SMALL}">Hent PDF (kræver login på din konto):</p>
      <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:26px;color:#4a5568;text-align:center;">
        ${bodyLink(payload.orderConfirmationPdfUrl, "Ordrebekræftelse (PDF)")}<br><br>
        ${bodyLink(payload.invoicePdfUrl, "Faktura (PDF)")}
      </p>
    `.trim()
    : `
      <p style="${P_INTRO}">Your order ${escapeHtml(orderLabel)} has been received and is being processed.</p>
      <div style="margin:8px 0 28px 0;text-align:center;">
        ${ctaButton(payload.storefrontOrderUrl, "View order status")}
      </div>
      <p style="${H_SECTION}">Documents</p>
      <p style="${P_SMALL}">Download PDFs (login required on your account):</p>
      <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:26px;color:#4a5568;text-align:center;">
        ${bodyLink(payload.orderConfirmationPdfUrl, "Order confirmation (PDF)")}<br><br>
        ${bodyLink(payload.invoicePdfUrl, "Invoice (PDF)")}
      </p>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa
      ? `Ordre ${orderLabel} er modtaget – tak for dit køb hos Guapo.`
      : `Order ${orderLabel} received – thank you for shopping with Guapo.`,
    heroTitle: isDa ? `Tak for din ordre` : `Thanks for your order`,
    heroSubtitle: isDa
      ? `Ordre ${escapeHtml(orderLabel)} · Vi pakker med omhu`
      : `Order ${escapeHtml(orderLabel)} · We are on it`,
    mainHtml,
    closingTitle: isDa ? `Vi ses snart` : `See you soon`,
    closingSubtitle: isDa ? `Tak fordi du handler hos Guapo.` : `Thanks for shopping with Guapo.`,
    closingBody: isDa
      ? `Har du spørgsmål til din ordre, er du altid velkommen til at kontakte os.`
      : `If you have questions about your order, we are happy to help.`,
    footerLegal: isDa
      ? `Du modtager denne e-mail, fordi du har afgivet en ordre hos Guapo.`
      : `You are receiving this email because you placed an order with Guapo.`,
  });

  return {
    subject,
    html,
    data: {
      order_id: payload.orderId,
      display_id: payload.displayId != null ? String(payload.displayId) : "",
      storefront_order_url: payload.storefrontOrderUrl,
      order_confirmation_pdf_url: payload.orderConfirmationPdfUrl,
      invoice_pdf_url: payload.invoicePdfUrl,
    },
  };
};

const subscriptionCreatedRenderer: Renderer<"subscription_created"> = (locale, payload) => {
  const isDa = locale === "da";
  const subject = isDa ? "Dit abonnement er oprettet" : "Your subscription is active";

  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Tak for din ordre. Dit abonnement er nu aktivt, og du kan administrere det når som helst på din konto.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Gå til abonnementer")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">Thank you for your order. Your subscription is now active — manage it anytime from your account.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Go to subscriptions")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa
      ? "Dit Guapo-abonnement er oprettet – administrer leverancer og betaling på din konto."
      : "Your Guapo subscription is set up — manage deliveries and billing in your account.",
    heroTitle: isDa ? "Abonnement aktivt" : "Subscription active",
    heroSubtitle: isDa ? "Koreansk hudpleje på dine præmisser" : "Korean skincare on your terms",
    mainHtml,
    closingTitle: isDa ? "Velkommen til fællesskabet" : "Welcome to the club",
    closingSubtitle: isDa ? "Vi er glade for at have dig med." : "We are glad you are here.",
    closingBody: isDa
      ? `Du kan pause, springe en leverance over eller opsige efter bindingsperioden – alt fra din konto.`
      : `You can pause, skip a delivery, or cancel after the commitment period — all from your account.`,
    footerLegal: isDa
      ? `Du modtager denne e-mail, fordi du har oprettet et abonnement hos Guapo.`
      : `You are receiving this email because you created a subscription with Guapo.`,
  });

  return {
    subject,
    html,
    data: {
      order_id: payload.orderId,
      storefront_subscriptions_url: payload.storefrontSubscriptionsUrl,
    },
  };
};

export function renderTransactionalTemplate<T extends TransactionalTemplate>(
  template: T,
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate[T]
): TransactionalRenderResult {
  if (template === "order_confirmation") {
    return orderConfirmationRenderer(locale, payload as TransactionalPayloadByTemplate["order_confirmation"]);
  }
  if (template === "subscription_created") {
    return subscriptionCreatedRenderer(locale, payload as TransactionalPayloadByTemplate["subscription_created"]);
  }
  return renderLifecycleTransactionalTemplate(
    template,
    locale,
    payload as Parameters<typeof renderLifecycleTransactionalTemplate>[2]
  );
}
