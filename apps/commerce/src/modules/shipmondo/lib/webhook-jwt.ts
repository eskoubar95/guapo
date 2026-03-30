import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Decode base64url segment (JWT part).
 */
function base64UrlToBuffer(segment: string): Buffer {
  const pad = (4 - (segment.length % 4)) % 4;
  const b64 = segment.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

/**
 * Verify HS256 JWT signature and return parsed payload (object).
 * Shipmondo webhook body: `{ "data": "<jwt>" }` where the JWT payload matches
 * https://shipmondo.dev/docs/webhooks/requirements-and-structure
 */
export function verifyShipmondoWebhookJwt(token: string, secret: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 segments");
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedMac = createHmac("sha256", secret).update(signingInput).digest();
  const sigBuf = base64UrlToBuffer(sigB64);
  if (sigBuf.length !== expectedMac.length || !timingSafeEqual(sigBuf, expectedMac)) {
    throw new Error("Invalid JWT signature");
  }
  const json = base64UrlToBuffer(payloadB64).toString("utf8");
  const payload = JSON.parse(json) as unknown;
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid JWT payload");
  }
  return payload as Record<string, unknown>;
}

export type ShipmondoWebhookInnerPayload = {
  webhook?: string;
  data?: Record<string, unknown>;
  url?: string;
};

/** Normalize decrypted JWT payload to inner structure. */
export function parseShipmondoWebhookPayload(payload: Record<string, unknown>): ShipmondoWebhookInnerPayload {
  const data = payload.data;
  const inner =
    data != null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;
  return {
    webhook: typeof payload.webhook === "string" ? payload.webhook : undefined,
    data: inner,
    url: typeof payload.url === "string" ? payload.url : undefined,
  };
}
