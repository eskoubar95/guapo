/**
 * Purge ALL subscription rows and subscription↔order link rows.
 *
 * Does not delete orders, carts, or Stripe subscriptions — only local DB state.
 * Cancel or clean up Stripe separately if needed.
 *
 * DESTRUCTIVE – run only when all subscriptions are expendable test data.
 *
 * Run with:  medusa exec ./src/scripts/purge-subscriptions.ts
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function purgeSubscriptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const knex: any = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  if (process.env.CONFIRM_PURGE_SUBSCRIPTIONS !== "DELETE_ALL_SUBSCRIPTIONS") {
    logger.error(
      "Refusing to purge subscriptions. Re-run with CONFIRM_PURGE_SUBSCRIPTIONS=DELETE_ALL_SUBSCRIPTIONS.",
    );
    process.exitCode = 1;
    return;
  }

  const schema = process.env.DATABASE_SCHEMA || "medusa";
  const subscriptionTable = `${schema}.subscription`;
  const linkTable = `${schema}.subscriptionmodule_subscription_order_order`;

  const [{ count }] = await knex(subscriptionTable).count();
  const n = typeof count === "string" ? parseInt(count, 10) : Number(count);
  if (!n || n === 0) {
    logger.info("No subscriptions found — nothing to purge.");
    return;
  }

  logger.warn(`⚠️  About to permanently delete ${n} subscription(s) and their order links.`);
  logger.warn("   Stripe is unchanged — cancel subs in Stripe Dashboard if required.");
  logger.warn("   This is irreversible. Starting in 3 seconds…");
  await new Promise((r) => setTimeout(r, 3000));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await knex.transaction(async (trx: any) => {
    const subscriptionIds = (await trx(subscriptionTable).select("id")).map(
      (r: { id: string }) => r.id,
    );

    const del = async (table: string, col: string, values: string[]) => {
      if (!values.length) return 0;
      return trx(table).whereIn(col, values).del();
    };

    const linkDeleted = await del(linkTable, "subscription_id", subscriptionIds);
    if (linkDeleted) {
      logger.info(`  Deleted ${linkDeleted} subscription↔order link row(s)`);
    }

    const subDeleted = await del(subscriptionTable, "id", subscriptionIds);
    logger.info(`  Deleted ${subDeleted} subscription row(s)`);
  });

  logger.info("✅ Subscription purge complete.");
}
