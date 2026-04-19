import type { SlackNotifyChannelHint, SlackNotifyEventType } from "./types.js";

export function resolveSlackChannelId(hint: SlackNotifyChannelHint): string | undefined {
  const mapJson = process.env.SLACK_CHANNELS_JSON;
  if (mapJson) {
    try {
      const m = JSON.parse(mapJson) as Record<string, string>;
      const key =
        hint === "shop" ? "shop" : hint === "alerts" ? "alerts" : "inventory";
      const id = m[key];
      if (typeof id === "string" && id.startsWith("C")) return id;
    } catch {
      /* fall through */
    }
  }
  if (hint === "shop") return process.env.SLACK_CHANNEL_SHOP;
  if (hint === "alerts") return process.env.SLACK_CHANNEL_ALERTS;
  return process.env.SLACK_CHANNEL_INVENTORY;
}

export function channelHintForEvent(
  type: SlackNotifyEventType,
  envelopeChannel?: SlackNotifyChannelHint
): SlackNotifyChannelHint {
  if (envelopeChannel) return envelopeChannel;
  if (type === "subscription.alert") return "alerts";
  if (type === "inventory.test") return "inventory";
  return "shop";
}
