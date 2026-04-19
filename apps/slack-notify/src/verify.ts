import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_MS = 5 * 60 * 1000;

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verifies `X-Notify-Signature` = sha256(HMAC(secret, `${timestamp}.${rawBody}`))
 * with `X-Notify-Timestamp` (Unix ms) within ±5 minutes (replay protection).
 */
export function verifyNotifySignature(
  rawBody: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined
): boolean {
  const secret = process.env.NOTIFY_SHARED_SECRET;
  if (!secret || !signatureHeader || !timestampHeader) return false;

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) {
    return false;
  }

  const expected =
    "sha256=" +
    createHmac("sha256", secret)
      .update(`${timestampHeader}.${rawBody}`, "utf8")
      .digest("hex");

  return timingSafeEqualHex(signatureHeader, expected);
}
