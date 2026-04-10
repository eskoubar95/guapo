/**
 * Align with commerce `subscription-cycle-metadata.ts` — Medusa may return string or number.
 */

export function getSubscriptionCycleWeeksFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): number {
  if (!metadata || typeof metadata !== "object") return 0;
  const raw = metadata.subscription_cycle;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : 0;
  }
  if (typeof raw === "string") {
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
}

export function cartItemHasSubscription(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  return getSubscriptionCycleWeeksFromMetadata(metadata) > 0;
}
