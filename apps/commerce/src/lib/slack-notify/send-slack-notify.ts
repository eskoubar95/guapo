import { createHmac } from "node:crypto";
import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { SlackNotifyEnvelope } from "./types";

const NOTIFY_FETCH_TIMEOUT_MS = 5_000;

/** HMAC over `${timestamp}.${body}` — paired with X-Notify-Timestamp (replay protection). */
function signBodyV2(timestamp: string, raw: string, secret: string): string {
  return (
    "sha256=" +
    createHmac("sha256", secret)
      .update(`${timestamp}.${raw}`, "utf8")
      .digest("hex")
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
  const timestamp = Date.now().toString();
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as
    | { warn?: (m: string) => void }
    | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOTIFY_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Notify-Timestamp": timestamp,
        "X-Notify-Signature": signBodyV2(timestamp, raw, secret),
      },
      body: raw,
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}
