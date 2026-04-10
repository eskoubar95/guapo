import { buildGuapoEmailDocument, bodyLink, ctaButton, escapeHtml } from "./email-layout";
import { buildOrderConfirmationMoneyBlock } from "./order-confirmation-html";
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

const P_LEAD =
  "margin:0 0 14px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#4a5568;text-align:left;";
const P_SMALL =
  "margin:0 0 8px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:left;";
const P_INTRO_CENTER =
  "margin:0 0 16px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#4a5568;text-align:center;";

function formatSubscriptionNext(iso: string, locale: TransactionalLocale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "da" ? "da-DK" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function subscriptionItemsBlock(
  locale: TransactionalLocale,
  subs: TransactionalPayloadByTemplate["subscription_created"]["subscriptions"]
): string {
  const isDa = locale === "da";
  return subs
    .map((s, idx) => {
      const title = escapeHtml(s.productTitle);
      const varLine =
        s.variantTitle && s.variantTitle.trim().length > 0
          ? `<p style="margin:4px 0 0 0;font-size:13px;line-height:20px;color:#64748b;">${escapeHtml(s.variantTitle)}</p>`
          : "";
      const cycle = isDa
        ? `Leveringsinterval: hver ${s.cycleWeeks}. uge`
        : `Delivery every ${s.cycleWeeks} weeks`;
      const next = isDa
        ? `Næste planlagte fornyelse: ${escapeHtml(formatSubscriptionNext(s.nextRenewalAtIso, locale))}`
        : `Next renewal: ${escapeHtml(formatSubscriptionNext(s.nextRenewalAtIso, locale))}`;
      const disc = isDa
        ? `${s.discountPercent} % rabat på alle fornyelser`
        : `${s.discountPercent}% off renewals`;
      const qty =
        s.quantity > 1
          ? isDa
            ? `Antal: ${s.quantity}`
            : `Quantity: ${s.quantity}`
          : "";
      const head =
        subs.length > 1
          ? isDa
            ? `Abonnement ${idx + 1}`
            : `Subscription ${idx + 1}`
          : isDa
            ? "Dit abonnement"
            : "Your subscription";

      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:${idx === 0 ? "8" : "16"}px;border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;">
  <tr>
    <td style="padding:16px 18px;text-align:left;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0;font-family:'Lexend',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#051537;text-transform:uppercase;">${escapeHtml(head)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 18px 18px 18px;text-align:left;">
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:16px;line-height:24px;font-weight:600;color:#051537;">${title}</p>
      ${varLine}
      <p style="margin:12px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:22px;color:#475569;">${escapeHtml(cycle)}</p>
      <p style="margin:6px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:22px;color:#475569;">${next}</p>
      <p style="margin:6px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:22px;color:#475569;">${escapeHtml(disc)}</p>
      ${qty ? `<p style="margin:6px 0 0 0;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:20px;color:#94a3b8;">${escapeHtml(qty)}</p>` : ""}
    </td>
  </tr>
</table>`;
    })
    .join("");
}

const orderConfirmationRenderer: Renderer<"order_confirmation"> = (locale, payload) => {
  const isDa = locale === "da";
  const orderLabel = payload.displayId != null ? `#${payload.displayId}` : payload.orderId;
  const subject = isDa ? `Tak for din ordre ${orderLabel}` : `Thanks for your order ${orderLabel}`;
  const moneyBlock = buildOrderConfirmationMoneyBlock(locale, payload.money, payload.vatRatePercent);

  const mainHtml = isDa
    ? `
      <p style="${P_LEAD}">Din ordre ${escapeHtml(orderLabel)} er modtaget og behandles nu.</p>
      <p style="${P_SMALL}">Fakturaen er vedhæftet denne e-mail som PDF.</p>
      ${moneyBlock}
      <div style="margin:24px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontOrderUrl, "Se ordrestatus")}
      </div>
      <p style="margin:18px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:left;">Har du en konto, kan du også følge ordren under ${bodyLink(payload.storefrontOrderUrl, "Min konto")}.</p>
    `.trim()
    : `
      <p style="${P_LEAD}">Your order ${escapeHtml(orderLabel)} has been received and is being processed.</p>
      <p style="${P_SMALL}">Your invoice is attached to this email as a PDF.</p>
      ${moneyBlock}
      <div style="margin:24px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontOrderUrl, "View order status")}
      </div>
      <p style="margin:18px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:left;">If you have an account, you can also track your order in ${bodyLink(payload.storefrontOrderUrl, "My account")}.</p>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    tone: "commerce",
    documentTitle: subject,
    preheader: isDa
      ? `Ordre ${orderLabel} er modtaget – oversigt og tak for dit køb hos Guapo.`
      : `Order ${orderLabel} received – summary and thank you for shopping with Guapo.`,
    heroTitle: isDa ? `Tak for din ordre` : `Thanks for your order`,
    heroSubtitle: isDa
      ? `Ordre ${escapeHtml(orderLabel)} · Oversigt nedenfor`
      : `Order ${escapeHtml(orderLabel)} · Summary below`,
    mainHtml,
    mainAlign: "left",
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
    },
  };
};

const subscriptionCreatedRenderer: Renderer<"subscription_created"> = (locale, payload) => {
  const isDa = locale === "da";
  const orderLabel = payload.displayId != null ? `#${payload.displayId}` : payload.orderId;
  const subject = isDa ? "Dit abonnement er oprettet" : "Your subscription is active";
  const itemsBlock = subscriptionItemsBlock(locale, payload.subscriptions);

  const lead = isDa
    ? `Tak for din ordre. Din første ordre er registreret som ordre ${escapeHtml(orderLabel)} — vi pakker den som planlagt. Dit abonnement er aktivt, og du kan administrere det på din konto.`
    : `Thank you for your order. Your first order is recorded as order ${escapeHtml(orderLabel)} — we will pack it as planned. Your subscription is active and you can manage it from your account.`;

  const mainHtml = isDa
    ? `
      <p style="${P_INTRO_CENTER}">${lead}</p>
      ${itemsBlock}
      <div style="margin:20px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Gå til abonnementer")}
      </div>
      <p style="margin:18px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:center;">
        Du kan også se ordren her: ${bodyLink(payload.storefrontOrderUrl, `Ordre ${escapeHtml(orderLabel)}`)}
      </p>
    `.trim()
    : `
      <p style="${P_INTRO_CENTER}">${lead}</p>
      ${itemsBlock}
      <div style="margin:20px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Go to subscriptions")}
      </div>
      <p style="margin:18px 0 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;line-height:22px;color:#7b8599;text-align:center;">
        View your order: ${bodyLink(payload.storefrontOrderUrl, `Order ${escapeHtml(orderLabel)}`)}
      </p>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    tone: "commerce",
    documentTitle: subject,
    preheader: isDa
      ? `Abonnement bekræftet – næste fornyelse og leveringsinterval i mailen.`
      : `Subscription confirmed — renewal schedule and details inside.`,
    heroTitle: isDa ? "Abonnement aktivt" : "Subscription active",
    heroSubtitle: isDa ? `Ordre ${escapeHtml(orderLabel)}` : `Order ${escapeHtml(orderLabel)}`,
    mainHtml,
    mainAlign: "center",
    closingTitle: isDa ? "Velkommen til Guapo" : "Welcome to Guapo",
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
