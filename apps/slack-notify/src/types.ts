/** Event envelope from Guapo commerce → this service */
export type SlackNotifyEventType =
  | "order.placed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.renewal_order"
  | "subscription.alert"
  | "inventory.test";

export type SlackNotifyChannelHint = "shop" | "alerts" | "inventory";

export type SlackNotifyEnvelope = {
  type: SlackNotifyEventType;
  /** Optional override; default derived from type */
  channel?: SlackNotifyChannelHint;
  payload: Record<string, unknown>;
};

export type ReplayRequestBody = {
  kind: "order" | "subscription" | "inventory";
  strategy: "latest";
};
