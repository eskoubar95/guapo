import type { ReplayRequestBody, SlackNotifyEnvelope } from "./types.js";
import type { SlackNotifyChannelHint, SlackNotifyEventType } from "./types.js";

const EVENT_TYPES = new Set<SlackNotifyEventType>([
  "order.placed",
  "subscription.created",
  "subscription.updated",
  "subscription.renewal_order",
  "subscription.alert",
  "inventory.test",
]);

const CHANNEL_HINTS = new Set<SlackNotifyChannelHint>(["shop", "alerts", "inventory"]);

const REPLAY_KINDS = new Set<ReplayRequestBody["kind"]>([
  "order",
  "subscription",
  "inventory",
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSlackNotifyEnvelope(raw: unknown): SlackNotifyEnvelope | null {
  if (!isRecord(raw)) return null;
  const t = raw.type;
  if (typeof t !== "string" || !EVENT_TYPES.has(t as SlackNotifyEventType)) {
    return null;
  }
  if (!isRecord(raw.payload)) return null;
  const ch = raw.channel;
  if (
    ch !== undefined &&
    (typeof ch !== "string" || !CHANNEL_HINTS.has(ch as SlackNotifyChannelHint))
  ) {
    return null;
  }
  return raw as SlackNotifyEnvelope;
}

export function parseReplayRequestBody(raw: unknown): ReplayRequestBody | null {
  if (!isRecord(raw)) return null;
  const kind = raw.kind;
  const strategy = raw.strategy;
  if (typeof kind !== "string" || !REPLAY_KINDS.has(kind as ReplayRequestBody["kind"])) {
    return null;
  }
  if (strategy !== "latest") return null;
  return { kind: kind as ReplayRequestBody["kind"], strategy: "latest" };
}
