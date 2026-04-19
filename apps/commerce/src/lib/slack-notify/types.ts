/** Must match apps/slack-notify/src/types.ts */
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
  channel?: SlackNotifyChannelHint;
  payload: Record<string, unknown>;
};
