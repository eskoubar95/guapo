import { MedusaService } from "@medusajs/framework/utils";
import { Subscription } from "./models/subscription";
import type { SubscriptionStatus } from "./models/subscription";

class SubscriptionModuleService extends MedusaService({
  Subscription,
}) {
  async updateStatus(id: string, status: SubscriptionStatus) {
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

  async setOnHold(id: string) {
    const [updated] = await this.updateSubscriptions([
      { id, status: "on_hold" as const, on_hold_at: new Date() },
    ]);
    return updated;
  }

  async setSkipNext(id: string, skip: boolean) {
    const [updated] = await this.updateSubscriptions([{ id, skip_next: skip }]);
    return updated;
  }

  /** TODO: use atomic DB update (e.g. delivery_count = delivery_count + 1) to avoid races under concurrent workers. */
  async incrementDeliveryCount(id: string) {
    const sub = await this.retrieveSubscription(id);
    const [updated] = await this.updateSubscriptions([
      {
        id,
        delivery_count: (sub.delivery_count ?? 0) + 1,
        last_renewal_at: new Date(),
      },
    ]);
    return updated;
  }

  /** TODO: use atomic DB update for next_renewal_at to avoid races under concurrent workers. */
  async advanceNextRenewal(id: string) {
    const sub = await this.retrieveSubscription(id);
    const next = new Date(sub.next_renewal_at);
    next.setDate(next.getDate() + (sub.cycle_weeks ?? 8) * 7);
    const [updated] = await this.updateSubscriptions([
      { id, next_renewal_at: next },
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
}

export default SubscriptionModuleService;
