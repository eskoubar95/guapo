import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Support FAQ global (support_faq + locales) and optional Concerns listing SEO (meta_* on concerns_locales).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
CREATE TABLE IF NOT EXISTS "payload"."support_faq" (
  "id" serial PRIMARY KEY NOT NULL,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "payload"."support_faq_locales" (
  "id" serial PRIMARY KEY NOT NULL,
  "page_title" varchar,
  "categories" jsonb,
  "_locale" "payload"."_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "payload"."support_faq_locales"
    ADD CONSTRAINT "support_faq_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."support_faq"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "support_faq_locales_locale_parent_id_unique"
  ON "payload"."support_faq_locales" USING btree ("_locale","_parent_id");

INSERT INTO "payload"."support_faq" ("updated_at", "created_at")
SELECT NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "payload"."support_faq" LIMIT 1);
  `)

  await db.execute(sql`
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'payload' AND table_name = 'concerns_locales'
  ) THEN
    ALTER TABLE "payload"."concerns_locales" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
    ALTER TABLE "payload"."concerns_locales" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
  END IF;
END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
ALTER TABLE "payload"."concerns_locales" DROP COLUMN IF EXISTS "meta_description";
ALTER TABLE "payload"."concerns_locales" DROP COLUMN IF EXISTS "meta_title";
  `)

  await db.execute(sql`
DROP TABLE IF EXISTS "payload"."support_faq_locales" CASCADE;
DROP TABLE IF EXISTS "payload"."support_faq" CASCADE;
  `)
}
