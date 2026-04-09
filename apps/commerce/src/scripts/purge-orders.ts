/**
 * Purge ALL orders and related data from the database.
 *
 * This script performs a hard delete of every order and all child/linked
 * records across the order, payment, fulfillment, and cart modules.
 *
 * DESTRUCTIVE – run only when all existing orders are expendable test data.
 * The entire operation runs inside a single transaction; on any error
 * everything is rolled back and the database is left untouched.
 *
 * Run with:  medusa exec ./src/scripts/purge-orders.ts
 */

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function purgeOrders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const knex: any = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  if (process.env.CONFIRM_PURGE_ORDERS !== "DELETE_ALL_ORDERS") {
    logger.error("Refusing to purge orders. Re-run with CONFIRM_PURGE_ORDERS=DELETE_ALL_ORDERS.");
    process.exitCode = 1;
    return;
  }

  const [{ count }] = await knex("medusa.order").count();
  if (count === "0") {
    logger.info("No orders found — nothing to purge.");
    return;
  }

  logger.warn(
    `⚠️  About to permanently delete ${count} orders and ALL related data.`,
  );
  logger.warn("   This is irreversible. Starting in 3 seconds…");
  await new Promise((r) => setTimeout(r, 3000));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await knex.transaction(async (trx: any) => {
    // ── Phase 0: collect IDs ─────────────────────────────────────────────
    const ids = async (table: string, col: string, filterCol: string, filterIds: string[]) =>
      filterIds.length
        ? (await trx(table).whereIn(filterCol, filterIds).select(col)).map((r: Record<string, string>) => r[col])
        : [];

    const orderIds = (await trx("medusa.order").select("id")).map((r: { id: string }) => r.id);

    const returnIds = await ids("medusa.return", "id", "order_id", orderIds);
    const claimIds = await ids("medusa.order_claim", "id", "order_id", orderIds);
    const exchangeIds = await ids("medusa.order_exchange", "id", "order_id", orderIds);

    const shippingMethodIds = await ids("medusa.order_shipping", "shipping_method_id", "order_id", orderIds);
    const lineItemIds = (
      await trx("medusa.order_item").whereIn("order_id", orderIds).select("item_id")
    ).map((r: { item_id: string }) => r.item_id);

    const orderAddressIds = [
      ...(await trx("medusa.order").whereIn("id", orderIds).select("billing_address_id")).map((r: Record<string, string>) => r.billing_address_id),
      ...(await trx("medusa.order").whereIn("id", orderIds).select("shipping_address_id")).map((r: Record<string, string>) => r.shipping_address_id),
    ].filter(Boolean);

    const paymentCollectionIds = await ids("medusa.order_payment_collection", "payment_collection_id", "order_id", orderIds);
    const fulfillmentIds = [
      ...await ids("medusa.order_fulfillment", "fulfillment_id", "order_id", orderIds),
      ...await ids("medusa.return_fulfillment", "fulfillment_id", "return_id", returnIds),
    ];
    const cartIds = await ids("medusa.order_cart", "cart_id", "order_id", orderIds);

    const fulfillmentAddressIds = fulfillmentIds.length
      ? (await trx("medusa.fulfillment").whereIn("id", fulfillmentIds).whereNotNull("delivery_address_id").select("delivery_address_id"))
          .map((r: Record<string, string>) => r.delivery_address_id)
      : [];

    const del = async (table: string, col: string, values: string[]) => {
      if (!values.length) return 0;
      return trx(table).whereIn(col, values).del();
    };

    // ── Phase 1: reservations + product reviews ─────────────────────────
    const resDeleted = await del("medusa.reservation_item", "line_item_id", lineItemIds);
    if (resDeleted) logger.info(`  Deleted ${resDeleted} reservation_item(s)`);

    // product_review has order_id (no FK) — clean up reviews tied to purged orders
    const reviewIds = await ids("medusa.product_review", "id", "order_id", orderIds);
    if (reviewIds.length) {
      await del("medusa.product_review_response", "product_review_id", reviewIds);
      await del("medusa.product_review_image", "product_review_id", reviewIds);
      await del("medusa.product_review", "id", reviewIds);
      logger.info(`  Deleted ${reviewIds.length} product_review(s)`);
    }

    // ── Phase 2: claims / exchanges / returns ────────────────────────────
    if (claimIds.length) {
      const claimItemIds = await ids("medusa.order_claim_item", "id", "claim_id", claimIds);
      await del("medusa.order_claim_item_image", "claim_item_id", claimItemIds);
      await del("medusa.order_claim_item", "claim_id", claimIds);
      await del("medusa.order_claim", "id", claimIds);
      logger.info(`  Deleted ${claimIds.length} claim(s)`);
    }
    if (exchangeIds.length) {
      await del("medusa.order_exchange_item", "exchange_id", exchangeIds);
      await del("medusa.order_exchange", "id", exchangeIds);
      logger.info(`  Deleted ${exchangeIds.length} exchange(s)`);
    }
    if (returnIds.length) {
      await del("medusa.return_item", "return_id", returnIds);
      await del("medusa.return", "id", returnIds);
      logger.info(`  Deleted ${returnIds.length} return(s)`);
    }

    // ── Phase 3: link / pivot tables ─────────────────────────────────────
    await del("medusa.subscriptionmodule_subscription_order_order", "order_id", orderIds);
    await del("medusa.return_fulfillment", "return_id", returnIds);
    await del("medusa.order_promotion", "order_id", orderIds);
    await del("medusa.order_fulfillment", "order_id", orderIds);
    await del("medusa.order_payment_collection", "order_id", orderIds);
    await del("medusa.order_cart", "order_id", orderIds);
    await del("medusa.cart_payment_collection", "payment_collection_id", paymentCollectionIds);
    await del("medusa.cart_promotion", "cart_id", cartIds);
    logger.info("  Deleted link/pivot rows");

    // ── Phase 4: order_shipping_method (not FK-cascaded) ─────────────────
    await del("medusa.order_shipping_method_tax_line", "shipping_method_id", shippingMethodIds);
    await del("medusa.order_shipping_method_adjustment", "shipping_method_id", shippingMethodIds);
    await del("medusa.order_shipping_method", "id", shippingMethodIds);
    logger.info(`  Deleted ${shippingMethodIds.length} order_shipping_method(s)`);

    // ── Phase 5: orphaned order_line_items (totals_id NULL escapes cascade) ─
    if (lineItemIds.length) {
      await trx("medusa.order_line_item")
        .whereIn("id", lineItemIds)
        .whereNull("totals_id")
        .del();
    }

    // ── Phase 6: orders ──────────────────────────────────────────────────
    // CASCADE handles: order_item → order_line_item (via totals_id) → adj/tax,
    //   order_change → order_change_action, order_credit_line,
    //   order_shipping, order_summary, order_transaction
    await del("medusa.order", "id", orderIds);
    logger.info(`  Deleted ${orderIds.length} order(s)`);

    // ── Phase 6: order addresses (now orphaned) ──────────────────────────
    await del("medusa.order_address", "id", orderAddressIds);

    // ── Phase 7: fulfillments ────────────────────────────────────────────
    // CASCADE handles: fulfillment_item, fulfillment_label
    await del("medusa.fulfillment", "id", fulfillmentIds);
    await del("medusa.fulfillment_address", "id", fulfillmentAddressIds);
    if (fulfillmentIds.length) logger.info(`  Deleted ${fulfillmentIds.length} fulfillment(s)`);

    // ── Phase 8: payment collections ─────────────────────────────────────
    // CASCADE handles: payment → capture/refund, payment_session,
    //   payment_collection_payment_providers
    await del("medusa.payment_collection", "id", paymentCollectionIds);
    if (paymentCollectionIds.length) logger.info(`  Deleted ${paymentCollectionIds.length} payment_collection(s)`);

    // ── Phase 9: carts ───────────────────────────────────────────────────
    // credit_line FK is NO ACTION — must go first
    await del("medusa.credit_line", "cart_id", cartIds);
    // CASCADE handles: cart_line_item → adj/tax, cart_shipping_method → adj/tax
    await del("medusa.cart", "id", cartIds);
    if (cartIds.length) logger.info(`  Deleted ${cartIds.length} cart(s)`);

    // Clean orphaned cart addresses
    await trx.raw(`
      DELETE FROM medusa.cart_address
      WHERE id NOT IN (
        SELECT billing_address_id  FROM medusa.cart WHERE billing_address_id  IS NOT NULL
        UNION
        SELECT shipping_address_id FROM medusa.cart WHERE shipping_address_id IS NOT NULL
      )
    `);

    // ── Phase 10: reconcile inventory reserved counts ───────────────────
    // Direct SQL deletes of reservation_item do not update inventory_level.reserved_quantity /
    // raw_reserved_quantity (Medusa normally adjusts these via the inventory service). Recompute
    // from remaining reservation rows so UI does not show stale "reserved" after a purge.
    const schema = process.env.DATABASE_SCHEMA || "medusa";
    const reconciled = await trx.raw(`
      UPDATE "${schema}"."inventory_level" il
      SET
        reserved_quantity = COALESCE((
          SELECT SUM(ri.quantity)
          FROM "${schema}"."reservation_item" ri
          WHERE ri.inventory_item_id = il.inventory_item_id
            AND ri.location_id = il.location_id
            AND ri.deleted_at IS NULL
        ), 0),
        raw_reserved_quantity = jsonb_build_object(
          'value', COALESCE((
            SELECT SUM(ri.quantity)::text
            FROM "${schema}"."reservation_item" ri
            WHERE ri.inventory_item_id = il.inventory_item_id
              AND ri.location_id = il.location_id
              AND ri.deleted_at IS NULL
          ), '0'),
          'precision', 20
        )
      WHERE il.deleted_at IS NULL
    `);
    const n = reconciled?.rowCount ?? 0;
    if (n) logger.info(`  Reconciled reserved_quantity on ${n} inventory_level row(s)`);

    // ── Phase 11: reset display_id sequences ─────────────────────────────
    for (const seq of [
      `${schema}.order_display_id_seq`,
      `${schema}.order_claim_display_id_seq`,
      `${schema}.order_exchange_display_id_seq`,
      `${schema}.return_display_id_seq`,
      `${schema}.order_change_action_ordering_seq`,
    ]) {
      await trx.raw(`SELECT setval('${seq}', 1, false)`);
    }
    logger.info("  Reset order-related sequences → next order will be #1");
  });

  logger.info("✅ Purge complete — order list is clean.");
}
