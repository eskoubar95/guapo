import type { PayloadMedia } from "@/lib/payload-homepage";

const PAYLOAD_BASE =
  process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? process.env.PAYLOAD_API_URL ?? "";

/** Absolute URL for a Payload media field (storefront / RSC safe). */
export function resolvePayloadMediaUrl(
  media: PayloadMedia | number | null | undefined,
): string {
  if (!media) return "";
  if (typeof media === "number") return "";
  const m = media as PayloadMedia;
  if (m.url) {
    return m.url.startsWith("http") ? m.url : `${PAYLOAD_BASE.replace(/\/$/, "")}${m.url}`;
  }
  return "";
}
