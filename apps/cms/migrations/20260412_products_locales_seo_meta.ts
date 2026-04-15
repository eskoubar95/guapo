import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Products: SEO plugin meta (title, description, OG image) on `products_locales`.
 * Aligns DB with Products collection meta group (localized).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
ALTER TABLE "payload"."products_locales" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
ALTER TABLE "payload"."products_locales" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
ALTER TABLE "payload"."products_locales" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload"."products_locales"
    ADD CONSTRAINT "products_locales_meta_image_id_media_id_fk"
    FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "products_meta_meta_image_idx"
  ON "payload"."products_locales" USING btree ("meta_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
DROP INDEX IF EXISTS "payload"."products_meta_meta_image_idx";

DO $$ BEGIN
  ALTER TABLE "payload"."products_locales" DROP CONSTRAINT IF EXISTS "products_locales_meta_image_id_media_id_fk";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE "payload"."products_locales" DROP COLUMN IF EXISTS "meta_image_id";
ALTER TABLE "payload"."products_locales" DROP COLUMN IF EXISTS "meta_description";
ALTER TABLE "payload"."products_locales" DROP COLUMN IF EXISTS "meta_title";
  `)
}
