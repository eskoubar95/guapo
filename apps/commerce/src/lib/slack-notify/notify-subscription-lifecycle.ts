import type { MedusaContainer } from "@medusajs/framework/types";
import { sendSlackNotify } from "./send-slack-notify";

export async function notifySubscriptionLifecycleSlack(
  container: MedusaContainer,
  input: {
    subscriptionId: string;
    action: "paused" | "resumed" | "cancelled" | "skipped";
    status: string;
  }
): Promise<void> {
  await sendSlackNotify(container, {
    type: "subscription.updated",
    payload: {
      subscriptionId: input.subscriptionId,
      action: input.action,
      status: input.status,
    },
  });
}
