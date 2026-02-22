import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix: products_locales.description was varchar; Products collection uses richText (jsonb).
 * PostgreSQL cannot auto-cast varchar to jsonb. Convert plain text to Lexical structure.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."products_locales"
    ALTER COLUMN "description" SET DATA TYPE jsonb USING (
      CASE
        WHEN "description" IS NULL OR trim("description") = '' THEN
          '{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}'::jsonb
        WHEN "description"::text ~ E'^\\s*\\{' THEN
          "description"::text::jsonb
        ELSE
          (
            '{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":' ||
            to_json("description"::text) ||
            '}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
          )::jsonb
      END
    )
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."products_locales"
    ALTER COLUMN "description" SET DATA TYPE varchar
    USING (
      CASE
        WHEN "description" IS NULL OR "description" = '{}'::jsonb THEN NULL
        ELSE "description"::text
      END
    )
  `)
}
