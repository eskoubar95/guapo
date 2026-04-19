import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { sendSlackNotify } from "./send-slack-notify";

export async function notifySubscriptionLifecycleSlack(
  container: MedusaContainer,
  input: {
    subscriptionId: string;
    action: "paused" | "resumed" | "cancelled" | "skipped";
    status: string;
  }
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as
    | { warn?: (m: string) => void }
    | undefined;
  try {
    await sendSlackNotify(container, {
      type: "subscription.updated",
      payload: {
        subscriptionId: input.subscriptionId,
        action: input.action,
        status: input.status,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(
      `[slack-notify] lifecycle ${input.action} failed for ${input.subscriptionId}: ${msg}`
    );
  }
}
