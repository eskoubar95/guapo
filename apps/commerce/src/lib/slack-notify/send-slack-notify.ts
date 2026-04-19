import { createHmac } from "node:crypto";
import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { SlackNotifyEnvelope } from "./types";

function signBody(raw: string, secret: string): string {
  return (
    "sha256=" + createHmac("sha256", secret).update(raw, "utf8").digest("hex")
  );
}

/**
 * POST signed envelope to apps/slack-notify. No-op if SLACK_NOTIFY_URL / NOTIFY_SHARED_SECRET unset.
 */
export async function sendSlackNotify(
  container: MedusaContainer,
  envelope: SlackNotifyEnvelope
): Promise<void> {
  const url = process.env.SLACK_NOTIFY_URL?.replace(/\/$/, "");
  const secret = process.env.NOTIFY_SHARED_SECRET;
  if (!url || !secret) {
    return;
  }
  const raw = JSON.stringify(envelope);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as
    | { warn?: (m: string) => void }
    | undefined;
  try {
    const res = await fetch(`${url}/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Notify-Signature": signBody(raw, secret),
      },
      body: raw,
    });
    if (!res.ok) {
      const t = await res.text();
      logger?.warn?.(
        `[slack-notify] ${envelope.type} failed: ${res.status} ${t.slice(0, 200)}`
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(`[slack-notify] ${envelope.type} error: ${msg}`);
  }
}
