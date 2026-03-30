import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add 'text-only-left' to content block layout enum (Content Block: Text Only left-aligned).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "payload"."enum_homepage_blocks_content_block_layout"
    ADD VALUE IF NOT EXISTS 'text-only-left';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing enum values; leave as no-op.
  // Reverting would require recreating the type and column.
}
