import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Payload `select` hasMany on globals → enum + `site_settings_enabled_storefront_locales` junction table.
 * Seeds `da` for each existing `site_settings` row.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "payload"."enum_site_settings_enabled_storefront_locales" AS ENUM ('da', 'en');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload"."site_settings_enabled_storefront_locales" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "payload"."enum_site_settings_enabled_storefront_locales" NOT NULL
    );
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload"."site_settings_enabled_storefront_locales"
        ADD CONSTRAINT "site_settings_enabled_storefront_locales_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "payload"."site_settings"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_enabled_storefront_locales_order_idx"
      ON "payload"."site_settings_enabled_storefront_locales" USING btree ("order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "site_settings_enabled_storefront_locales_parent_idx"
      ON "payload"."site_settings_enabled_storefront_locales" USING btree ("parent_id");
  `)
  await db.execute(sql`
    INSERT INTO "payload"."site_settings_enabled_storefront_locales" ("order", "parent_id", "value")
    SELECT 0, s."id", 'da'::"payload"."enum_site_settings_enabled_storefront_locales"
    FROM "payload"."site_settings" s
    WHERE NOT EXISTS (
      SELECT 1 FROM "payload"."site_settings_enabled_storefront_locales" j WHERE j."parent_id" = s."id"
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(
    sql`DROP TABLE IF EXISTS "payload"."site_settings_enabled_storefront_locales" CASCADE;`,
  )
  await db.execute(
    sql`DROP TYPE IF EXISTS "payload"."enum_site_settings_enabled_storefront_locales" CASCADE;`,
  )
}
