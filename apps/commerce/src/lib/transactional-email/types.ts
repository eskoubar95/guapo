export type TransactionalLocale = "da" | "en";

export type TransactionalTemplate =
  | "order_confirmation"
  | "subscription_created"
  | "renewal_reminder_3_days"
  | "payment_failed_retry_1"
  | "payment_failed_final_on_hold"
  | "payment_recovered"
  | "subscription_paused"
  | "subscription_resumed"
  | "subscription_cancelled"
  | "shipment_tracking_available";

export type OrderConfirmationEmailPayload = {
  orderId: string;
  displayId?: number;
  storefrontOrderUrl: string;
  orderConfirmationPdfUrl: string;
  invoicePdfUrl: string;
};

export type SubscriptionCreatedEmailPayload = {
  orderId: string;
  storefrontSubscriptionsUrl: string;
};

export type RenewalReminderPayload = {
  storefrontSubscriptionsUrl: string;
  nextRenewalAtIso: string;
  cycleWeeks: number;
};

export type PaymentFailedRetryPayload = {
  storefrontSubscriptionsUrl: string;
  /** 1 = first failure, 2 = second scheduled retry */
  failureAttempt: 1 | 2;
};

export type PaymentFailedFinalPayload = {
  storefrontSubscriptionsUrl: string;
  /** Card retries exhausted vs SCA / 3DS required */
  reason: "payment_exhausted" | "authentication_required";
};

export type PaymentRecoveredPayload = {
  storefrontSubscriptionsUrl: string;
};

export type SubscriptionLifecyclePayload = {
  storefrontSubscriptionsUrl: string;
};

export type ShipmentTrackingPayload = {
  orderDetailUrl: string;
  displayLabel: string;
  trackingUrl: string;
  trackingNumber: string;
};

export type TransactionalPayloadByTemplate = {
  order_confirmation: OrderConfirmationEmailPayload;
  subscription_created: SubscriptionCreatedEmailPayload;
  renewal_reminder_3_days: RenewalReminderPayload;
  payment_failed_retry_1: PaymentFailedRetryPayload;
  payment_failed_final_on_hold: PaymentFailedFinalPayload;
  payment_recovered: PaymentRecoveredPayload;
  subscription_paused: SubscriptionLifecyclePayload;
  subscription_resumed: SubscriptionLifecyclePayload;
  subscription_cancelled: SubscriptionLifecyclePayload;
  shipment_tracking_available: ShipmentTrackingPayload;
};

export type TransactionalEmailInput<T extends TransactionalTemplate> = {
  template: T;
  to: string;
  locale: TransactionalLocale;
  payload: TransactionalPayloadByTemplate[T];
  idempotencyKey: string;
};

export type TransactionalRenderResult = {
  subject: string;
  html: string;
  data: Record<string, string>;
};
