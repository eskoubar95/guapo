export type TransactionalLocale = "da" | "en";

export type TransactionalTemplate = "order_confirmation" | "subscription_created";

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

export type TransactionalPayloadByTemplate = {
  order_confirmation: OrderConfirmationEmailPayload;
  subscription_created: SubscriptionCreatedEmailPayload;
};

export type TransactionalEmailInput<T extends TransactionalTemplate> = {
  template: T;
  to: string;
  locale: TransactionalLocale;
  payload: TransactionalPayloadByTemplate[T];
  idempotencyKey: string;
};
