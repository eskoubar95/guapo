import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rename application → subtitle in Products (field rename).
 * Preserves existing data.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload' AND table_name = 'products_locales' AND column_name = 'application'
      ) THEN
        ALTER TABLE "payload"."products_locales" RENAME COLUMN "application" TO "subtitle";
      ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload' AND table_name = 'products_locales' AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE "payload"."products_locales" ADD COLUMN "subtitle" varchar;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'payload' AND table_name = 'products_locales' AND column_name = 'subtitle'
      ) THEN
        ALTER TABLE "payload"."products_locales" RENAME COLUMN "subtitle" TO "application";
      END IF;
    END $$;
  `)
}
