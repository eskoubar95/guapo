import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix: Lexical editor requires root to have at least one child.
 * Update empty description states to include one empty paragraph.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."products_locales"
    SET "description" = '{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":""}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'::jsonb
    WHERE "description" IS NULL
       OR "description"->'root'->'children' = '[]'::jsonb
       OR jsonb_array_length(COALESCE("description"->'root'->'children', '[]'::jsonb)) = 0
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* No revert - data is fixed, down would lose content */
}
