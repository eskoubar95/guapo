import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyNotifySignature(
  rawBody: string,
  signatureHeader: string | undefined
): boolean {
  const secret = process.env.NOTIFY_SHARED_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
