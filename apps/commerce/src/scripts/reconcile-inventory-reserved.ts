/**
 * Recompute inventory_level.reserved_quantity (and raw_reserved_quantity) from
 * medusa.reservation_item rows. Use after manual SQL deletes or if admin shows
 * stale "reserved" counts.
 *
 * Run: medusa exec ./src/scripts/reconcile-inventory-reserved.ts
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function reconcileInventoryReserved({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const knex: any = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const schema = process.env.DATABASE_SCHEMA || "medusa";

  const result = await knex.raw(`
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

  const n = result?.rowCount ?? 0;
  logger.info(`✅ Reconciled reserved_quantity on ${n} inventory_level row(s).`);
}
