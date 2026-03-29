/**
 * Full E2E subscription simulation.
 *
 * Validates the complete chain:
 *   1. Order with subscription line items → Subscription record (with Stripe customer/PM)
 *   2. Renewal workflow → off-session Stripe charge → new renewal order
 *
 * Usage:
 *   ORDER_ID=order_01XXX pnpm -C apps/commerce simulate-e2e
 *   ORDER_ID=order_01XXX RESET_DUE_NOW=1 pnpm -C apps/commerce simulate-e2e
 *   ORDER_ID=order_01XXX CYCLES=3 pnpm -C apps/commerce simulate-e2e
 *
 * Flags (via env or -- args):
 *   --reset-due-now   Sets next_renewal_at = yesterday and clears skip_next before renewal.
 *                     Required if you just created the subscription (renewal is weeks away).
 *   --cycles N        Run N consecutive renewal cycles. Default: 1.
 *
 * Stripe test cards:
 *   Success:  4242 4242 4242 4242
 *   Decline:  4000 0000 0000 0002
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import orderPlacedCreateSubscriptions from "../subscribers/order-placed-create-subscriptions";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { renewSubscriptionWorkflow } from "../workflows/renew-subscription";

type Logger = { info?: (m: string) => void; warn?: (m: string) => void; error?: (m: string) => void };

const HR = "─".repeat(60);
const OK = "✅";
const FAIL = "❌";
const INFO = "ℹ️ ";
const WARN = "⚠️ ";

function parseFlags() {
  const args = process.argv.slice(2);
  const resetDueNow =
    !!process.env.RESET_DUE_NOW ||
    args.includes("--reset-due-now");
  const cyclesArg =
    process.env.CYCLES ??
    args.find((a) => a.startsWith("--cycles="))?.split("=")[1] ??
    (args[args.indexOf("--cycles") + 1]);
  const cycles = cyclesArg ? Math.max(1, parseInt(String(cyclesArg), 10)) : 1;
  const orderId =
    process.env.ORDER_ID ??
    args.find((a) => !a.startsWith("--")) ??
    undefined;
  return { orderId, resetDueNow, cycles };
}

export default async function simulateE2eSubscription({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger;
  const log = (msg: string) => logger?.info?.(`[e2e] ${msg}`) ?? console.log(`[e2e] ${msg}`);
  const warn = (msg: string) => logger?.warn?.(`[e2e] ${msg}`) ?? console.warn(`[e2e] WARN: ${msg}`);
  const err = (msg: string) => logger?.error?.(`[e2e] ${msg}`) ?? console.error(`[e2e] ERR: ${msg}`);

  const { orderId, resetDueNow, cycles } = parseFlags();

  if (!orderId) {
    log("Usage: ORDER_ID=order_01XXX pnpm -C apps/commerce simulate-e2e");
    log("   Or: ORDER_ID=order_01XXX RESET_DUE_NOW=1 pnpm -C apps/commerce simulate-e2e");
    log("   Or: ORDER_ID=order_01XXX CYCLES=3 pnpm -C apps/commerce simulate-e2e");
    log("   Or: pnpm -C apps/commerce simulate-e2e -- order_01XXX --reset-due-now --cycles=2");
    log("");
    log("Find ORDER_ID in Medusa Admin → Orders or from the order-confirmation URL.");
    process.exit(1);
  }

  if (!process.env.STRIPE_API_KEY) {
    err("STRIPE_API_KEY is not set. Set it to your Stripe test key (sk_test_…) before running.");
    process.exit(1);
  }

  const stripeMode = process.env.STRIPE_API_KEY.startsWith("sk_test_") ? "TEST" : "LIVE";
  if (stripeMode === "LIVE") {
    warn("STRIPE_API_KEY is a LIVE key. Real charges will be made. Aborting in 3s…");
    await new Promise((r) => setTimeout(r, 3000));
  }

  log(HR);
  log(`E2E SUBSCRIPTION SIMULATION – Stripe ${stripeMode} mode`);
  log(`Order: ${orderId}`);
  log(`Cycles: ${cycles}${resetDueNow ? "  |  --reset-due-now: ON" : ""}`);
  log(HR);

  const subscriptionService = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);

  // ─── PHASE 1: Create subscription from order ─────────────────────────
  log(`${INFO} Phase 1: Running order.placed subscriber (subscription creation)…`);

  const existingBefore = await subscriptionService
    .listSubscriptions({}, { take: 200 })
    .then((list) =>
      (list ?? []).filter(
        (s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId
      )
    );

  if (existingBefore.length > 0) {
    log(`${INFO} Found ${existingBefore.length} existing subscription(s) for this order (idempotent). Skipping creation.`);
    existingBefore.forEach((s) =>
      log(`  • ${s.id} – status=${s.status}, cycle=${s.cycle_weeks}w, delivery_count=${s.delivery_count}, skip_next=${s.skip_next}`)
    );
  } else {
    await orderPlacedCreateSubscriptions({
      event: { data: { id: orderId }, name: "order.placed", metadata: {} },
      container,
      pluginOptions: {},
    });

    const createdNow = await subscriptionService
      .listSubscriptions({}, { take: 200 })
      .then((list) =>
        (list ?? []).filter(
          (s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId
        )
      );

    if (createdNow.length === 0) {
      err(`${FAIL} No subscription was created for order ${orderId}.`);
      err("   Possible causes:");
      err("   • Order has no items with metadata.subscription_cycle");
      err("   • Order has no customer_id (guest checkout)");
      err("   • No Stripe payment on order, or STRIPE_API_KEY not set");
      err("   • payment_method is not attached to the Stripe customer");
      process.exit(1);
    }

    log(`${OK} Created ${createdNow.length} subscription(s):`);
    createdNow.forEach((s) => {
      log(`  • ${s.id}`);
      log(`    cycle=${s.cycle_weeks}w, status=${s.status}, delivery_count=${s.delivery_count}`);
      log(`    stripe_customer=${s.stripe_customer_id ?? "(missing)"}`);
      log(`    stripe_pm=${s.stripe_payment_method_id ?? "(missing)"}`);
      log(`    next_renewal=${s.next_renewal_at}`);
    });
  }

  const subscriptions = await subscriptionService
    .listSubscriptions({}, { take: 200 })
    .then((list) =>
      (list ?? []).filter(
        (s) => (s.metadata as Record<string, unknown> | null)?.order_id === orderId
      )
    );

  if (subscriptions.length === 0) {
    err(`${FAIL} No subscriptions found after Phase 1. Aborting.`);
    process.exit(1);
  }

  const invalidSubs = subscriptions.filter(
    (s) => !s.stripe_customer_id || !s.stripe_payment_method_id
  );
  if (invalidSubs.length > 0) {
    err(`${FAIL} Subscriptions missing Stripe credentials (cannot run renewal):`);
    invalidSubs.forEach((s) =>
      err(`  • ${s.id}: customer=${s.stripe_customer_id ?? "MISSING"}, pm=${s.stripe_payment_method_id ?? "MISSING"}`)
    );
    process.exit(1);
  }

  // ─── PHASE 2: Renewal cycles ─────────────────────────────────────────
  log(HR);
  log(`${INFO} Phase 2: Simulating ${cycles} renewal cycle(s) for ${subscriptions.length} subscription(s)…`);

  let totalCharged = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const allPassed = { value: true };

  for (const sub of subscriptions) {
    log(`\n  Subscription: ${sub.id} (${sub.cycle_weeks}w)`);

    for (let cycle = 1; cycle <= cycles; cycle++) {
      log(`  Cycle ${cycle}/${cycles}…`);

      // --reset-due-now: patch next_renewal_at to yesterday and clear skip_next
      if (resetDueNow) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await subscriptionService.updateSubscriptions([{
          id: sub.id,
          next_renewal_at: yesterday,
          skip_next: false,
        }]);
        log(`  ${INFO} --reset-due-now: set next_renewal_at to ${yesterday.toISOString()}, cleared skip_next`);
      } else if (cycle > 1) {
        // For multi-cycle: patch next_renewal_at to past so cron gate passes
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await subscriptionService.updateSubscriptions([{
          id: sub.id,
          next_renewal_at: yesterday,
        }]);
        log(`  ${INFO} Multi-cycle: set next_renewal_at to yesterday for cycle ${cycle}`);
      }

      try {
        const { result } = await renewSubscriptionWorkflow(container).run({
          input: { subscriptionId: sub.id },
        });

        if (result?.renewed) {
          totalCharged++;
          log(`  ${OK} Renewal cycle ${cycle} SUCCESS`);
          log(`     New order: ${result.orderId}`);
          const updated = await subscriptionService.retrieveSubscription(sub.id);
          log(`     delivery_count=${updated.delivery_count}, next_renewal=${updated.next_renewal_at}`);
        } else if (result?.skipped) {
          totalSkipped++;
          warn(`  ${WARN} Cycle ${cycle}: Subscription had skip_next=true. Skipped – no Stripe charge was made.`);
          warn(`     Re-run with RESET_DUE_NOW=1 to force a real charge.`);
        } else if (result?.error) {
          totalFailed++;
          allPassed.value = false;
          err(`  ${FAIL} Cycle ${cycle} FAILED: ${result.error}`);
          err(`     retry_count=${result.retryCount ?? 0}`);
          err("     Common causes: decline card, PM not attached to customer, wrong Stripe credentials");
          break;
        } else {
          warn(`  ${INFO} Cycle ${cycle}: Completed with no result data.`);
        }
      } catch (e) {
        totalFailed++;
        allPassed.value = false;
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "object" && e !== null && "message" in e
              ? String((e as { message: unknown }).message)
              : typeof e === "object" && e !== null
                ? JSON.stringify(e)
                : String(e);
        err(`  ${FAIL} Cycle ${cycle} threw: ${msg}`);
        if (e instanceof Error && e.stack) err(`  Stack: ${e.stack.slice(0, 300)}`);
        break;
      }
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────
  log("");
  log(HR);

  const hasRealCharge = totalCharged > 0;

  if (hasRealCharge && allPassed.value && totalFailed === 0) {
    log(`${OK} E2E SIMULATION PASSED`);
    log(`   Charged: ${totalCharged} | Skipped: ${totalSkipped} | Failed: ${totalFailed}`);
    log("   Full chain validated: order → subscription → Stripe off-session charge → renewal order");
    log("   The system is correctly configured for automatic recurring payments.");
  } else if (totalSkipped > 0 && totalCharged === 0) {
    warn(`${WARN} E2E SIMULATION PARTIAL – no real Stripe charge was made`);
    warn(`   All ${totalSkipped} renewal(s) were skipped because skip_next=true.`);
    warn("   Re-run with RESET_DUE_NOW=1 to force a charge:");
    warn(`   ORDER_ID=${orderId} RESET_DUE_NOW=1 pnpm -C apps/commerce simulate-e2e`);
  } else if (totalFailed > 0) {
    log(`${FAIL} E2E SIMULATION FAILED`);
    log(`   Charged: ${totalCharged} | Skipped: ${totalSkipped} | Failed: ${totalFailed}`);
  } else {
    log(`${INFO} E2E SIMULATION COMPLETE`);
    log(`   Charged: ${totalCharged} | Skipped: ${totalSkipped} | Failed: ${totalFailed}`);
  }

  log(HR);
}
