import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "payload"."site_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "favicon_id" integer,
      "apple_touch_icon_id" integer,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
  await db.execute(sql`
    ALTER TABLE "payload"."site_settings"
      ADD CONSTRAINT "site_settings_favicon_id_media_id_fk"
      FOREIGN KEY ("favicon_id") REFERENCES "payload"."media"("id")
      ON DELETE set null ON UPDATE no action;
  `)
  await db.execute(sql`
    ALTER TABLE "payload"."site_settings"
      ADD CONSTRAINT "site_settings_apple_touch_icon_id_media_id_fk"
      FOREIGN KEY ("apple_touch_icon_id") REFERENCES "payload"."media"("id")
      ON DELETE set null ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload"."site_settings" CASCADE;`)
}
