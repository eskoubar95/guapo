import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Image + Text (Breakout) block: visualType + video upload.
 * Required after adding fields to sectionBlocks — Postgres block tables need new columns.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
DO $$ BEGIN
  CREATE TYPE "payload"."enum_pages_blocks_image_text_breakout_visual_type" AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "payload"."enum__pages_v_blocks_image_text_breakout_visual_type" AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "payload"."enum_homepage_blocks_image_text_breakout_visual_type" AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "payload"."pages_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "visual_type" "payload"."enum_pages_blocks_image_text_breakout_visual_type" DEFAULT 'image'::"payload"."enum_pages_blocks_image_text_breakout_visual_type";

ALTER TABLE "payload"."pages_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "video_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload"."pages_blocks_image_text_breakout"
    ADD CONSTRAINT "pages_blocks_image_text_breakout_video_id_media_id_fk"
    FOREIGN KEY ("video_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "pages_blocks_image_text_breakout_video_idx"
  ON "payload"."pages_blocks_image_text_breakout" USING btree ("video_id");

ALTER TABLE "payload"."_pages_v_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "visual_type" "payload"."enum__pages_v_blocks_image_text_breakout_visual_type" DEFAULT 'image'::"payload"."enum__pages_v_blocks_image_text_breakout_visual_type";

ALTER TABLE "payload"."_pages_v_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "video_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload"."_pages_v_blocks_image_text_breakout"
    ADD CONSTRAINT "_pages_v_blocks_image_text_breakout_video_id_media_id_fk"
    FOREIGN KEY ("video_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "_pages_v_blocks_image_text_breakout_video_idx"
  ON "payload"."_pages_v_blocks_image_text_breakout" USING btree ("video_id");

ALTER TABLE "payload"."homepage_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "visual_type" "payload"."enum_homepage_blocks_image_text_breakout_visual_type" DEFAULT 'image'::"payload"."enum_homepage_blocks_image_text_breakout_visual_type";

ALTER TABLE "payload"."homepage_blocks_image_text_breakout"
  ADD COLUMN IF NOT EXISTS "video_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload"."homepage_blocks_image_text_breakout"
    ADD CONSTRAINT "homepage_blocks_image_text_breakout_video_id_media_id_fk"
    FOREIGN KEY ("video_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "homepage_blocks_image_text_breakout_video_idx"
  ON "payload"."homepage_blocks_image_text_breakout" USING btree ("video_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
ALTER TABLE "payload"."pages_blocks_image_text_breakout" DROP COLUMN IF EXISTS "video_id" CASCADE;
ALTER TABLE "payload"."pages_blocks_image_text_breakout" DROP COLUMN IF EXISTS "visual_type" CASCADE;
ALTER TABLE "payload"."_pages_v_blocks_image_text_breakout" DROP COLUMN IF EXISTS "video_id" CASCADE;
ALTER TABLE "payload"."_pages_v_blocks_image_text_breakout" DROP COLUMN IF EXISTS "visual_type" CASCADE;
ALTER TABLE "payload"."homepage_blocks_image_text_breakout" DROP COLUMN IF EXISTS "video_id" CASCADE;
ALTER TABLE "payload"."homepage_blocks_image_text_breakout" DROP COLUMN IF EXISTS "visual_type" CASCADE;
  `)
}
