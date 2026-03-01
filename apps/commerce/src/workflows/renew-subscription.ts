import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { runSubscriptionRenewalStep } from "./steps/run-subscription-renewal";

type RenewSubscriptionInput = { subscriptionId: string };

/**
 * Renewal workflow: charge off-session, create order, update subscription.
 * Called by subscription-renewal job for each due subscription.
 */
export const renewSubscriptionWorkflow = createWorkflow(
  "renew-subscription",
  (input: RenewSubscriptionInput) => {
    const result = runSubscriptionRenewalStep(input);
    return new WorkflowResponse(result);
  }
);
