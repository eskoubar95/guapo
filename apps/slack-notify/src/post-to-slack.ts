import { WebClient } from "@slack/web-api";
import type { SlackNotifyEnvelope } from "./types.js";
import { channelHintForEvent, resolveSlackChannelId } from "./channels.js";
import { buildBlocksForEnvelope } from "./blocks/build-messages.js";

let client: WebClient | null = null;

function getClient(): WebClient {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not set");
  }
  if (!client) {
    client = new WebClient(token);
  }
  return client;
}

export async function postEnvelopeToSlack(envelope: SlackNotifyEnvelope): Promise<void> {
  const hint = channelHintForEvent(envelope.type, envelope.channel);
  const channel = resolveSlackChannelId(hint);
  if (!channel) {
    throw new Error(
      `No Slack channel configured for "${hint}" (set SLACK_CHANNELS_JSON or SLACK_CHANNEL_* )`
    );
  }
  const { text, blocks } = buildBlocksForEnvelope(envelope);
  const slack = getClient();
  await slack.chat.postMessage({
    channel,
    text,
    blocks,
  });
}
