import { bodyLink, buildGuapoEmailDocument, ctaButton, escapeHtml } from "./email-layout";
import type {
  TransactionalLocale,
  TransactionalPayloadByTemplate,
  TransactionalRenderResult,
} from "./types";

export type LifecycleTransactionalTemplate = Exclude<
  import("./types").TransactionalTemplate,
  "order_confirmation" | "subscription_created"
>;

const P_INTRO =
  "margin:0 0 16px 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:15px;line-height:26px;color:#4a5568;text-align:center;";

function formatRenewalDate(iso: string, locale: TransactionalLocale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "da" ? "da-DK" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

export function renderLifecycleTransactionalTemplate<T extends LifecycleTransactionalTemplate>(
  template: T,
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate[T]
): TransactionalRenderResult {
  switch (template) {
    case "renewal_reminder_3_days":
      return renderRenewalReminder(
        locale,
        payload as TransactionalPayloadByTemplate["renewal_reminder_3_days"]
      );
    case "payment_failed_retry_1":
      return renderPaymentFailedRetry(
        locale,
        payload as TransactionalPayloadByTemplate["payment_failed_retry_1"]
      );
    case "payment_failed_final_on_hold":
      return renderPaymentFailedFinal(
        locale,
        payload as TransactionalPayloadByTemplate["payment_failed_final_on_hold"]
      );
    case "payment_recovered":
      return renderPaymentRecovered(
        locale,
        payload as TransactionalPayloadByTemplate["payment_recovered"]
      );
    case "subscription_paused":
      return renderSubscriptionPaused(
        locale,
        payload as TransactionalPayloadByTemplate["subscription_paused"]
      );
    case "subscription_resumed":
      return renderSubscriptionResumed(
        locale,
        payload as TransactionalPayloadByTemplate["subscription_resumed"]
      );
    case "subscription_cancelled":
      return renderSubscriptionCancelled(
        locale,
        payload as TransactionalPayloadByTemplate["subscription_cancelled"]
      );
    case "shipment_tracking_available":
      return renderShipmentTracking(
        locale,
        payload as TransactionalPayloadByTemplate["shipment_tracking_available"]
      );
  }
}

function renderRenewalReminder(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["renewal_reminder_3_days"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const when = formatRenewalDate(payload.nextRenewalAtIso, locale);
  const subject = isDa ? "Dit abonnement fornyes snart" : "Your subscription renews soon";
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Vi trækker betaling for din næste leverance om ca. tre dage (${escapeHtml(when)}). Leveringsinterval: hver ${payload.cycleWeeks}. uge.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Administrer abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">We will charge your next delivery in about three days (${escapeHtml(when)}). Your plan renews every ${payload.cycleWeeks} weeks.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Manage subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa
      ? `Fornyelse ${when} – tjek betalingsmetode og levering.`
      : `Renewal on ${when} – check payment and delivery.`,
    heroTitle: isDa ? "Snart fornyelse" : "Renewal coming up",
    heroSubtitle: isDa ? "Dit Guapo-abonnement" : "Your Guapo subscription",
    mainHtml,
    closingTitle: isDa ? "Alt ser godt ud?" : "All set?",
    closingSubtitle: isDa ? "Opdater gerne betalingskort eller leveringsadresse i god tid." : "Update your card or delivery details if needed.",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail, fordi du har et aktivt abonnement hos Guapo.`
      : `You are receiving this email because you have an active Guapo subscription.`,
  });

  return {
    subject,
    html,
    data: {
      storefront_subscriptions_url: payload.storefrontSubscriptionsUrl,
      next_renewal_at: payload.nextRenewalAtIso,
      cycle_weeks: String(payload.cycleWeeks),
    },
  };
}

function renderPaymentFailedRetry(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["payment_failed_retry_1"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const second = payload.failureAttempt === 2;
  const subject = isDa
    ? second
      ? "Vi kunne stadig ikke gennemføre betalingen"
      : "Vi kunne ikke gennemføre din abonnementsbetaling"
    : second
      ? "We still could not charge your subscription"
      : "We could not charge your subscription";

  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">${
        second
          ? "Andet forsøg mislykkedes. Vi prøver igen automatisk. Tjek at dit betalingskort er gyldigt, eller opdatér det under dit abonnement."
          : "Betalingen for din næste leverance gik ikke igennem. Vi prøver igen automatisk. Opdatér gerne dit betalingskort nu, så undgår du afbrydelser."
      }</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Opdatér abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">${
        second
          ? "The second attempt failed. We will retry automatically. Please verify your card or update it in your subscription settings."
          : "We could not charge your next delivery. We will retry automatically. Please update your payment method to avoid interruption."
      }</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Manage subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Handling kræves: abonnementsbetaling." : "Action needed: subscription payment.",
    heroTitle: isDa ? "Betalingsproblem" : "Payment issue",
    heroSubtitle: isDa ? "Abonnement hos Guapo" : "Guapo subscription",
    mainHtml,
    closingTitle: isDa ? "Vi hjælper gerne" : "We are here to help",
    closingSubtitle: "",
    closingBody: isDa
      ? "Opdatér betalingsmetode under Abonnementer – så er du klar til næste trækning."
      : "Update your payment method under Subscriptions to stay on schedule.",
    footerLegal: isDa
      ? `Du modtager denne e-mail pga. en mislykket abonnementsbetaling hos Guapo.`
      : `You are receiving this email because a subscription payment failed at Guapo.`,
  });

  return {
    subject,
    html,
    data: {
      storefront_subscriptions_url: payload.storefrontSubscriptionsUrl,
      failure_attempt: String(payload.failureAttempt),
    },
  };
}

function renderPaymentFailedFinal(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["payment_failed_final_on_hold"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const auth = payload.reason === "authentication_required";
  const subject = isDa
    ? auth
      ? "Bekræft betaling for dit abonnement"
      : "Dit abonnement er sat på pause"
    : auth
      ? "Confirm payment for your subscription"
      : "Your subscription is on hold";

  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">${
        auth
          ? "Din bank kræver ekstra godkendelse (3D Secure). Åbn dit abonnement og gennemfør betalingen, så vi kan genoptage leverancerne."
          : "Vi har forsøgt at trække betaling flere gange uden held. Dit abonnement er sat på pause, indtil der er en gyldig betalingsmetode."
      }</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Gå til abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">${
        auth
          ? "Your bank requires additional authentication. Open your subscription and complete the payment to resume deliveries."
          : "We could not collect payment after multiple attempts. Your subscription is on hold until a valid payment method is added."
      }</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Go to subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Abonnement kræver handling." : "Your subscription needs attention.",
    heroTitle: isDa ? "Handling påkrævet" : "Action required",
    heroSubtitle: isDa ? "Guapo-abonnement" : "Guapo subscription",
    mainHtml,
    closingTitle: isDa ? "Genoptag når du er klar" : "Resume when you are ready",
    closingSubtitle: "",
    closingBody: isDa
      ? "Når betalingen er på plads, kan leverancerne fortsætte efter dit planlagte interval."
      : "Once payment succeeds, deliveries can continue on your schedule.",
    footerLegal: isDa
      ? `Du modtager denne e-mail pga. dit abonnementsstatus hos Guapo.`
      : `You are receiving this email regarding your Guapo subscription status.`,
  });

  return {
    subject,
    html,
    data: {
      storefront_subscriptions_url: payload.storefrontSubscriptionsUrl,
      reason: payload.reason,
    },
  };
}

function renderPaymentRecovered(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["payment_recovered"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const subject = isDa ? "Betaling gennemført – abonnement aktivt" : "Payment successful – subscription active";
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Vi har modtaget betalingen, og dit abonnement kører igen som planlagt.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Se abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">Your payment went through and your subscription is active again.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "View subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Tak – dit abonnement er opdateret." : "Thanks — your subscription is updated.",
    heroTitle: isDa ? "Alt er i orden" : "You are all set",
    heroSubtitle: isDa ? "Tak fordi du er med" : "Thanks for sticking with us",
    mainHtml,
    closingTitle: isDa ? "Vi ses ved næste leverance" : "See you at the next delivery",
    closingSubtitle: "",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail i forbindelse med dit abonnement hos Guapo.`
      : `You are receiving this email about your Guapo subscription.`,
  });

  return {
    subject,
    html,
    data: { storefront_subscriptions_url: payload.storefrontSubscriptionsUrl },
  };
}

function renderSubscriptionPaused(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["subscription_paused"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const subject = isDa ? "Dit abonnement er sat på pause" : "Your subscription is paused";
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Vi har registreret pause på dit abonnement. Ingen nye leverancer planlægges, mens det er pauseret.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Administrer abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">Your subscription is paused. No new deliveries will be scheduled while paused.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Manage subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Bekræftelse: abonnement pauseret." : "Confirmation: subscription paused.",
    heroTitle: isDa ? "Pause" : "Paused",
    heroSubtitle: isDa ? "Guapo-abonnement" : "Guapo subscription",
    mainHtml,
    closingTitle: isDa ? "Vi er her når du er klar" : "We are here when you are ready",
    closingSubtitle: "",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail som bekræftelse på ændring af dit abonnement.`
      : `You are receiving this email to confirm a change to your subscription.`,
  });

  return {
    subject,
    html,
    data: { storefront_subscriptions_url: payload.storefrontSubscriptionsUrl },
  };
}

function renderSubscriptionResumed(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["subscription_resumed"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const subject = isDa ? "Dit abonnement er genoptaget" : "Your subscription is active again";
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Velkommen tilbage! Dit abonnement er aktivt, og leverancer følger dit planlagte interval.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Se abonnement")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">Welcome back! Your subscription is active and deliveries follow your schedule.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "View subscription")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Abonnement genoptaget." : "Subscription resumed.",
    heroTitle: isDa ? "Genoptaget" : "Resumed",
    heroSubtitle: isDa ? "Klar til næste leverance" : "Ready for the next delivery",
    mainHtml,
    closingTitle: isDa ? "Tak fordi du er med" : "Thanks for staying with us",
    closingSubtitle: "",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail som bekræftelse på ændring af dit abonnement.`
      : `You are receiving this email to confirm a change to your subscription.`,
  });

  return {
    subject,
    html,
    data: { storefront_subscriptions_url: payload.storefrontSubscriptionsUrl },
  };
}

function renderSubscriptionCancelled(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["subscription_cancelled"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const subject = isDa ? "Dit abonnement er opsagt" : "Your subscription is cancelled";
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Vi har registreret opsigelsen af dit abonnement. Tak fordi du har været kunde hos Guapo.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "Se konto")}
      </div>
    `.trim()
    : `
      <p style="${P_INTRO}">Your subscription has been cancelled. Thank you for being a Guapo customer.</p>
      <div style="margin:8px 0 0 0;text-align:center;">
        ${ctaButton(payload.storefrontSubscriptionsUrl, "View account")}
      </div>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? "Bekræftelse: abonnement opsagt." : "Confirmation: subscription cancelled.",
    heroTitle: isDa ? "Farvel for nu" : "Goodbye for now",
    heroSubtitle: isDa ? "Du er altid velkommen tilbage" : "You are always welcome back",
    mainHtml,
    closingTitle: isDa ? "På gensyn" : "Until next time",
    closingSubtitle: "",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail som bekræftelse på opsigelse af abonnement.`
      : `You are receiving this email to confirm your subscription cancellation.`,
  });

  return {
    subject,
    html,
    data: { storefront_subscriptions_url: payload.storefrontSubscriptionsUrl },
  };
}

function renderShipmentTracking(
  locale: TransactionalLocale,
  payload: TransactionalPayloadByTemplate["shipment_tracking_available"]
): TransactionalRenderResult {
  const isDa = locale === "da";
  const subject = isDa
    ? `Din ordre er på vej (${payload.displayLabel})`
    : `Your order is on the way (${payload.displayLabel})`;
  const mainHtml = isDa
    ? `
      <p style="${P_INTRO}">Vi har afsendt din ordre ${escapeHtml(payload.displayLabel)}. Spor forsendelsen med linket nedenfor.</p>
      <p style="margin:0 0 8px 0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#7b8599;text-align:center;">${escapeHtml(payload.trackingNumber)}</p>
      <div style="margin:8px 0 16px 0;text-align:center;">
        ${ctaButton(payload.trackingUrl, "Spor pakke")}
      </div>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:22px;color:#4a5568;text-align:center;">
        ${bodyLink(payload.orderDetailUrl, "Se ordre")}
      </p>
    `.trim()
    : `
      <p style="${P_INTRO}">We have shipped your order ${escapeHtml(payload.displayLabel)}. Track your package below.</p>
      <p style="margin:0 0 8px 0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#7b8599;text-align:center;">${escapeHtml(payload.trackingNumber)}</p>
      <div style="margin:8px 0 16px 0;text-align:center;">
        ${ctaButton(payload.trackingUrl, "Track package")}
      </div>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:22px;color:#4a5568;text-align:center;">
        ${bodyLink(payload.orderDetailUrl, "View order")}
      </p>
    `.trim();

  const html = buildGuapoEmailDocument({
    lang: locale,
    documentTitle: subject,
    preheader: isDa ? `Tracking: ${payload.trackingNumber}` : `Tracking: ${payload.trackingNumber}`,
    heroTitle: isDa ? "Pakken er sendt" : "Shipped",
    heroSubtitle: isDa ? `Ordre ${escapeHtml(payload.displayLabel)}` : `Order ${escapeHtml(payload.displayLabel)}`,
    mainHtml,
    closingTitle: isDa ? "God fornøjelse" : "Enjoy",
    closingSubtitle: isDa ? "Tak fordi du handler hos Guapo." : "Thanks for shopping with Guapo.",
    closingBody: "",
    footerLegal: isDa
      ? `Du modtager denne e-mail, fordi du har en ordre hos Guapo.`
      : `You are receiving this email because you have an order with Guapo.`,
  });

  return {
    subject,
    html,
    data: {
      order_detail_url: payload.orderDetailUrl,
      tracking_url: payload.trackingUrl,
      tracking_number: payload.trackingNumber,
      display_label: payload.displayLabel,
    },
  };
}
