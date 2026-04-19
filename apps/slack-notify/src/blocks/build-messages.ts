import type { KnownBlock } from "@slack/web-api";
import type { SlackNotifyEnvelope, SlackNotifyEventType } from "../types.js";

function adminOrderUrl(orderId: string): string {
  const base = process.env.GUAPO_MEDUSA_ADMIN_BASE_URL ?? "";
  if (!base) return orderId;
  const u = base.replace(/\/$/, "");
  return `${u}/orders/${encodeURIComponent(orderId)}`;
}

function adminSubscriptionUrl(subscriptionId: string): string {
  const base = process.env.GUAPO_MEDUSA_ADMIN_BASE_URL ?? "";
  if (!base) return subscriptionId;
  const u = base.replace(/\/$/, "");
  return `${u}/subscriptions/${encodeURIComponent(subscriptionId)}`;
}

export function buildBlocksForEnvelope(envelope: SlackNotifyEnvelope): {
  text: string;
  blocks: KnownBlock[];
} {
  const { type, payload } = envelope;
  switch (type) {
    case "order.placed":
      return buildOrderPlaced(payload, false);
    case "subscription.renewal_order":
      return buildOrderPlaced(payload, true);
    case "subscription.created":
      return buildSubscriptionCreated(payload);
    case "subscription.updated":
      return buildSubscriptionUpdated(payload);
    case "subscription.alert":
      return buildSubscriptionAlert(payload);
    case "inventory.test":
      return buildInventoryTest(payload);
    default:
      return buildGeneric(type, payload);
  }
}

function buildOrderPlaced(
  payload: Record<string, unknown>,
  isRenewal: boolean
): { text: string; blocks: KnownBlock[] } {
  const orderId = String(payload.orderId ?? "");
  const displayId = payload.displayId != null ? String(payload.displayId) : "—";
  const total = payload.total != null ? String(payload.total) : "—";
  const currency = String(payload.currencyCode ?? "dkk").toUpperCase();
  const singleSub =
    typeof payload.subscriptionId === "string" ? payload.subscriptionId : undefined;
  const subscriptionIds = Array.isArray(payload.subscriptionIds)
    ? (payload.subscriptionIds as unknown[]).filter((id): id is string => typeof id === "string")
    : singleSub
      ? [singleSub]
      : [];
  const title = isRenewal ? "Subscription renewal order" : "New order";
  const text = `${title}: #${displayId} (${total} ${currency})`;
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: title, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Order ID*\n\`${orderId}\`` },
        { type: "mrkdwn", text: `*Display #*\n${displayId}` },
        { type: "mrkdwn", text: `*Total*\n${total} ${currency}` },
        {
          type: "mrkdwn",
          text: `*Subscriptions*\n${
            subscriptionIds.length ? subscriptionIds.map((id) => `\`${id}\``).join(", ") : "—"
          }`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `<${adminOrderUrl(orderId)}|Open in Medusa Admin>`,
        },
      ],
    },
  ];
  return { text, blocks };
}

function buildSubscriptionCreated(payload: Record<string, unknown>): {
  text: string;
  blocks: KnownBlock[];
} {
  const id = String(payload.subscriptionId ?? "");
  const orderId = payload.orderId != null ? String(payload.orderId) : undefined;
  const cycleWeeks = payload.cycleWeeks != null ? String(payload.cycleWeeks) : "—";
  const text = `New subscription: \`${id}\``;
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "New subscription", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Subscription*\n\`${id}\`` },
        { type: "mrkdwn", text: `*Cycle*\n${cycleWeeks} weeks` },
        {
          type: "mrkdwn",
          text: `*Source order*\n${orderId ? `\`${orderId}\`` : "—"}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `<${adminSubscriptionUrl(id)}|Open in Medusa Admin>` },
      ],
    },
  ];
  return { text, blocks };
}

function buildSubscriptionUpdated(payload: Record<string, unknown>): {
  text: string;
  blocks: KnownBlock[];
} {
  const id = String(payload.subscriptionId ?? "");
  const action = String(payload.action ?? "updated");
  const status = String(payload.status ?? "—");
  const text = `Subscription ${action}: \`${id}\` → ${status}`;
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `Subscription ${action}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Subscription*\n\`${id}\`` },
        { type: "mrkdwn", text: `*Status*\n${status}` },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `<${adminSubscriptionUrl(id)}|Open in Medusa Admin>` },
      ],
    },
  ];
  return { text, blocks };
}

function buildSubscriptionAlert(payload: Record<string, unknown>): {
  text: string;
  blocks: KnownBlock[];
} {
  const id = String(payload.subscriptionId ?? "");
  const reason = String(payload.reason ?? "alert");
  const detail = payload.detail != null ? String(payload.detail) : "";
  const text = `Subscription alert (${reason}): \`${id}\``;
  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Subscription alert", emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Subscription* \`${id}\`\n*Reason:* ${reason}${detail ? `\n${detail}` : ""}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `<${adminSubscriptionUrl(id)}|Open in Medusa Admin>` },
      ],
    },
  ];
  return { text, blocks };
}

function buildInventoryTest(payload: Record<string, unknown>): {
  text: string;
  blocks: KnownBlock[];
} {
  const note = String(payload.note ?? "Inventory channel test");
  return {
    text: note,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Inventory (test)*\n${note}` },
      },
    ],
  };
}

function buildGeneric(type: SlackNotifyEventType, payload: Record<string, unknown>): {
  text: string;
  blocks: KnownBlock[];
} {
  const text = `Guapo notify: ${type}`;
  return {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`${type}\`\n\`\`\`${JSON.stringify(payload, null, 2).slice(0, 2800)}\`\`\``,
        },
      },
    ],
  };
}
