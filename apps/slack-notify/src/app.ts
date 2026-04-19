import { Hono } from "hono";
import type { SlackNotifyEnvelope } from "./types.js";
import type { ReplayRequestBody } from "./types.js";
import { verifyNotifySignature } from "./verify.js";
import { postEnvelopeToSlack } from "./post-to-slack.js";

export function createApp() {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, service: "guapo-slack-notify" }));

  app.post("/v1/events", async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header("x-notify-signature");
    if (!verifyNotifySignature(rawBody, sig)) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    let envelope: SlackNotifyEnvelope;
    try {
      envelope = JSON.parse(rawBody) as SlackNotifyEnvelope;
    } catch {
      return c.json({ message: "Invalid JSON" }, 400);
    }
    if (!envelope?.type || typeof envelope.payload !== "object" || envelope.payload === null) {
      return c.json({ message: "Invalid envelope" }, 400);
    }
    try {
      await postEnvelopeToSlack(envelope);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ message: "Slack post failed", detail: msg }, 502);
    }
    return c.json({ ok: true });
  });

  app.post("/v1/test/replay", async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header("x-notify-signature");
    if (!verifyNotifySignature(rawBody, sig)) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    let body: ReplayRequestBody;
    try {
      body = JSON.parse(rawBody) as ReplayRequestBody;
    } catch {
      return c.json({ message: "Invalid JSON" }, 400);
    }
    if (body.strategy !== "latest") {
      return c.json({ message: "Only strategy=latest is supported" }, 400);
    }

    const commerceBase = process.env.GUAPO_COMMERCE_INTERNAL_URL?.replace(/\/$/, "");
    if (!commerceBase) {
      return c.json({ message: "GUAPO_COMMERCE_INTERNAL_URL is not set" }, 500);
    }

    const secret = process.env.NOTIFY_SHARED_SECRET;
    if (!secret) {
      return c.json({ message: "NOTIFY_SHARED_SECRET is not set" }, 500);
    }

    if (body.kind === "inventory") {
      const envelope: SlackNotifyEnvelope = {
        type: "inventory.test",
        channel: "inventory",
        payload: {
          note: "Replay test: inventory channel (no DB read)",
        },
      };
      try {
        await postEnvelopeToSlack(envelope);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return c.json({ message: "Slack post failed", detail: msg }, 502);
      }
      return c.json({ ok: true, replayed: envelope });
    }

    const kindParam = body.kind === "order" ? "order" : "subscription";
    const sampleUrl = `${commerceBase}/internal/notifications/slack/sample?kind=${encodeURIComponent(kindParam)}`;
    const sampleRes = await fetch(sampleUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });
    if (!sampleRes.ok) {
      const t = await sampleRes.text();
      return c.json(
        {
          message: "Commerce sample failed",
          status: sampleRes.status,
          detail: t.slice(0, 500),
        },
        502
      );
    }
    const envelope = (await sampleRes.json()) as SlackNotifyEnvelope;
    try {
      await postEnvelopeToSlack(envelope);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ message: "Slack post failed", detail: msg }, 502);
    }
    return c.json({ ok: true, replayed: envelope });
  });

  return app;
}
