import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Brands: `medusa_id` on parent table (storefront join) + SEO OG image on locales.
 * Aligns DB with Brands collection (SEO plugin MetaImageField + Medusa sync id).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
ALTER TABLE "payload"."brands" ADD COLUMN IF NOT EXISTS "medusa_id" varchar;

CREATE INDEX IF NOT EXISTS "brands_medusa_id_idx" ON "payload"."brands" USING btree ("medusa_id");

ALTER TABLE "payload"."brands_locales" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload"."brands_locales"
    ADD CONSTRAINT "brands_locales_meta_image_id_media_id_fk"
    FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "brands_meta_meta_image_idx"
  ON "payload"."brands_locales" USING btree ("meta_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
DROP INDEX IF EXISTS "payload"."brands_meta_meta_image_idx";

DO $$ BEGIN
  ALTER TABLE "payload"."brands_locales" DROP CONSTRAINT IF EXISTS "brands_locales_meta_image_id_media_id_fk";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE "payload"."brands_locales" DROP COLUMN IF EXISTS "meta_image_id";

DROP INDEX IF EXISTS "payload"."brands_medusa_id_idx";

ALTER TABLE "payload"."brands" DROP COLUMN IF EXISTS "medusa_id";
  `)
}
