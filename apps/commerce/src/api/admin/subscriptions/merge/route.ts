import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../modules/subscription/service";

/**
 * POST /admin/subscriptions/merge
 * Merge two or more subscriptions for the same customer into a group.
 * All subscriptions are assigned the same group_id and optionally
 * aligned to the earliest next_renewal_at in the group.
 *
 * Body:
 *   { subscription_ids: string[], align_dates?: boolean }
 *
 * - All subscriptions must belong to the same customer_id.
 * - Existing group_ids in the selection are collapsed into one.
 * - align_dates=true (default: true): sets all next_renewal_at to the
 *   earliest date in the group so they renew together.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { subscription_ids?: string[]; align_dates?: boolean };
  const { subscription_ids, align_dates = true } = body;

  if (!Array.isArray(subscription_ids) || subscription_ids.length < 2) {
    return res.status(400).json({
      message: "subscription_ids must be an array of at least 2 subscription IDs",
      code: "INVALID_MERGE_INPUT",
    });
  }

  const subscriptionService = req.scope.resolve<SubscriptionModuleService>(
    SUBSCRIPTION_MODULE
  );

  const subs = await Promise.all(
    subscription_ids.map((id) =>
      subscriptionService.retrieveSubscription(id).catch(() => null)
    )
  );

  const missing = subscription_ids.filter((id, i) => !subs[i]);
  if (missing.length) {
    return res.status(404).json({
      message: `Subscriptions not found: ${missing.join(", ")}`,
      code: "SUBSCRIPTION_NOT_FOUND",
    });
  }

  const validSubs = subs.filter(Boolean) as NonNullable<typeof subs[0]>[];

  const customerIds = [...new Set(validSubs.map((s) => s.customer_id))];
  if (customerIds.length > 1) {
    return res.status(400).json({
      message: "All subscriptions must belong to the same customer to be merged",
      code: "MERGE_CUSTOMER_MISMATCH",
      customer_ids: customerIds,
    });
  }

  // Use first subscription's ID as the group_id, unless one already has a group_id
  const existingGroupId = validSubs
    .map((s) => (s as unknown as Record<string, unknown>).group_id as string | null | undefined)
    .find((g) => !!g);
  const groupId = existingGroupId ?? validSubs[0].id;

  // Determine earliest next_renewal_at if aligning dates
  let alignedDate: Date | null = null;
  if (align_dates) {
    const dates = validSubs
      .map((s) => s.next_renewal_at ? new Date(s.next_renewal_at) : null)
      .filter(Boolean) as Date[];
    if (dates.length) {
      alignedDate = dates.reduce((earliest, d) => (d < earliest ? d : earliest));
    }
  }

  // Update all subscriptions
  const updates = validSubs.map((s) => ({
    id: s.id,
    group_id: groupId,
    ...(alignedDate ? { next_renewal_at: alignedDate } : {}),
  }));

  await subscriptionService.updateSubscriptions(updates);

  const updated = await Promise.all(
    subscription_ids.map((id) => subscriptionService.retrieveSubscription(id))
  );

  res.json({
    group_id: groupId,
    aligned_renewal_at: alignedDate?.toISOString() ?? null,
    subscriptions: updated,
  });
};
