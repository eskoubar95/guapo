import { MedusaService } from "@medusajs/framework/utils";
import { MedusaError } from "@medusajs/framework/utils";
import { Pool } from "pg";
import { Subscription } from "./models/subscription";
import type { SubscriptionStatus } from "./models/subscription";

const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  active: ["paused", "on_hold", "cancelled"],
  paused: ["active", "cancelled"],
  on_hold: ["active", "expired", "cancelled"],
  cancelled: [],
  expired: [],
};

let subscriptionPool: Pool | null = null;

function getSubscriptionPool(): Pool {
  if (subscriptionPool) return subscriptionPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "DATABASE_URL is not set"
    );
  }
  subscriptionPool = new Pool({
    connectionString,
    max: 3,
  });
  return subscriptionPool;
}

function getSubscriptionTableFqn(): string {
  const schema = process.env.DATABASE_SCHEMA || "medusa";
  return `"${schema}"."subscription"`;
}

class SubscriptionModuleService extends MedusaService({
  Subscription,
}) {
  private async validateTransition(
    id: string,
    targetStatus: SubscriptionStatus
  ) {
    const current = await this.retrieveSubscription(id);
    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid status transition from ${current.status} to ${targetStatus}`
      );
    }
  }

  async updateStatus(id: string, status: SubscriptionStatus) {
    await this.validateTransition(id, status);
    const [updated] = await this.updateSubscriptions([{ id, status }]);
    return updated;
  }

  async pause(id: string) {
    return this.updateStatus(id, "paused");
  }

  async resume(id: string) {
    return this.updateStatus(id, "active");
  }

  async cancel(id: string) {
    return this.updateStatus(id, "cancelled");
  }

  async setOnHold(id: string, reason?: string) {
    const current = await this.retrieveSubscription(id);
    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes("on_hold")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid status transition from ${current.status} to on_hold`
      );
    }
    const metadata = {
      ...((current.metadata as Record<string, unknown> | null) ?? {}),
      ...(reason ? { on_hold_reason: reason } : {}),
    };
    const [updated] = await this.updateSubscriptions([
      {
        id,
        status: "on_hold" as const,
        on_hold_at: new Date(),
        last_failure_reason: reason ?? null,
        metadata,
      },
    ]);
    return updated;
  }

  async setSkipNext(id: string, skip: boolean) {
    const [updated] = await this.updateSubscriptions([{ id, skip_next: skip }]);
    return updated;
  }

  async incrementDeliveryCount(id: string) {
    const pool = getSubscriptionPool();
    const table = getSubscriptionTableFqn();
    await pool.query(
      `update ${table}
       set delivery_count = coalesce(delivery_count, 0) + 1,
           last_renewal_at = now(),
           updated_at = now()
       where id = $1`,
      [id]
    );
    return this.retrieveSubscription(id);
  }

  async advanceNextRenewal(id: string, lastRenewalOrderId?: string | null) {
    const pool = getSubscriptionPool();
    const table = getSubscriptionTableFqn();
    await pool.query(
      `update ${table}
       set next_renewal_at = next_renewal_at + ((coalesce(cycle_weeks, 8) * 7)::text || ' days')::interval,
           last_renewal_order_id = coalesce($2, last_renewal_order_id),
           updated_at = now()
       where id = $1`,
      [id, lastRenewalOrderId ?? null]
    );
    return this.retrieveSubscription(id);
  }

  async setLastRenewalOrderId(id: string, orderId: string) {
    const [updated] = await this.updateSubscriptions([
      { id, last_renewal_order_id: orderId },
    ]);
    return updated;
  }

  async setRetryState(
    id: string,
    retryCount: number,
    nextRetryAt: Date | null
  ) {
    const [updated] = await this.updateSubscriptions([
      { id, retry_count: retryCount, next_retry_at: nextRetryAt },
    ]);
    return updated;
  }

  async clearRetryState(id: string) {
    return this.setRetryState(id, 0, null);
  }

  /**
   * Atomic claim: prevents concurrent workers from double-processing the same
   * subscription renewal. Returns true if this caller won the claim, false if
   * another worker already holds it (claims expire after 30 minutes).
   */
  async claimForRenewal(id: string): Promise<boolean> {
    const pool = getSubscriptionPool();
    const table = getSubscriptionTableFqn();
    const staleSec = 1800;
    const result = await pool.query(
      `UPDATE ${table}
       SET metadata = jsonb_set(
         coalesce(metadata, '{}')::jsonb,
         '{_renewal_claim_at}',
         to_jsonb(extract(epoch from now())::bigint)
       ),
       updated_at = now()
       WHERE id = $1
         AND status = 'active'
         AND (
           metadata IS NULL
           OR (metadata::jsonb)->>'_renewal_claim_at' IS NULL
           OR ((metadata::jsonb)->>'_renewal_claim_at')::bigint < extract(epoch from now())::bigint - $2
         )`,
      [id, staleSec]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async setFailureContext(id: string, reason: string, data?: Record<string, unknown>) {
    const current = await this.retrieveSubscription(id);
    const metadata = {
      ...((current.metadata as Record<string, unknown> | null) ?? {}),
      ...(data ?? {}),
    };
    const [updated] = await this.updateSubscriptions([
      {
        id,
        last_failure_reason: reason,
        metadata,
      },
    ]);
    return updated;
  }

  async retrieveByIdempotencyKey(key: string) {
    const normalized = String(key ?? "").trim();
    if (!normalized) return null;

    const pool = getSubscriptionPool();
    const table = getSubscriptionTableFqn();
    const { rows } = await pool.query<{ id: string }>(
      `select id from ${table} where idempotency_key = $1 limit 1`,
      [normalized]
    );
    const id = rows[0]?.id;
    if (!id) return null;

    return this.retrieveSubscription(id);
  }

  /**
   * Subscriptions linked to an order (initial via metadata.order_id, renewals via last_renewal_order_id).
   * Indexed SQL — avoids scanning all subscriptions for Slack / notifications.
   */
  async listSubscriptionIdsByOrderId(orderId: string): Promise<string[]> {
    const pool = getSubscriptionPool();
    const table = getSubscriptionTableFqn();
    const { rows } = await pool.query<{ id: string }>(
      `select id from ${table}
       where deleted_at is null
         and (
           last_renewal_order_id = $1
           or (metadata::jsonb->>'order_id') = $1
         )
       limit 50`,
      [orderId]
    );
    return (rows ?? []).map((r) => r.id);
  }
}

export default SubscriptionModuleService;
