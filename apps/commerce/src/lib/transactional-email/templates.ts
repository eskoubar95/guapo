import type {
  TransactionalLocale,
  TransactionalPayloadByTemplate,
  TransactionalTemplate,
} from "./types";

type TemplateRenderResult = {
  subject: string;
  html: string;
  data: Record<string, string>;
};

type Renderer<T extends TransactionalTemplate> = (
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate[T]
) => TemplateRenderResult;

const orderConfirmationRenderer: Renderer<"order_confirmation"> = (locale, payload) => {
  const isDa = locale === "da";
  const orderLabel = payload.displayId != null ? `#${payload.displayId}` : payload.orderId;
  const subject = isDa ? `Tak for din ordre ${orderLabel}` : `Thanks for your order ${orderLabel}`;
  const html = isDa
    ? `
      <h2>Tak for din ordre ${orderLabel}</h2>
      <p>Din ordre er modtaget og behandles nu.</p>
      <p>
        <a href="${payload.storefrontOrderUrl}">Se ordrestatus</a>
      </p>
      <p>
        PDF-dokumenter (kræver login):
      </p>
      <ul>
        <li><a href="${payload.orderConfirmationPdfUrl}">Download ordrebekræftelse (PDF)</a></li>
        <li><a href="${payload.invoicePdfUrl}">Download faktura (PDF)</a></li>
      </ul>
    `.trim()
    : `
      <h2>Thanks for your order ${orderLabel}</h2>
      <p>Your order has been received and is now being processed.</p>
      <p>
        <a href="${payload.storefrontOrderUrl}">View order status</a>
      </p>
      <p>
        PDF documents (login required):
      </p>
      <ul>
        <li><a href="${payload.orderConfirmationPdfUrl}">Download order confirmation (PDF)</a></li>
        <li><a href="${payload.invoicePdfUrl}">Download invoice (PDF)</a></li>
      </ul>
    `.trim();

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
  const html = isDa
    ? `
      <h2>Dit abonnement er oprettet</h2>
      <p>Tak for din ordre. Du kan administrere dit abonnement på din konto.</p>
      <p><a href="${payload.storefrontSubscriptionsUrl}">Gå til abonnementer</a></p>
    `.trim()
    : `
      <h2>Your subscription is active</h2>
      <p>Thanks for your order. You can manage your subscription from your account.</p>
      <p><a href="${payload.storefrontSubscriptionsUrl}">Go to subscriptions</a></p>
    `.trim();

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
): TemplateRenderResult {
  if (template === "order_confirmation") {
    return orderConfirmationRenderer(locale, payload as TransactionalPayloadByTemplate["order_confirmation"]);
  }
  return subscriptionCreatedRenderer(
    locale,
    payload as TransactionalPayloadByTemplate["subscription_created"]
  );
}
