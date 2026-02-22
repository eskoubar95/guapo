import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix products_locales where title/subtitle/description were stored as JSON objects
 * like {"da":"...","en":"..."} instead of proper per-locale values.
 * Extracts the value for this row's _locale from the JSON.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."products_locales"
    SET "title" = (
      CASE WHEN "_locale" = 'da' THEN "title"::jsonb->>'da'
           WHEN "_locale" = 'en' THEN "title"::jsonb->>'en'
           ELSE "title"::jsonb->>'da' END
    )::varchar
    WHERE "title" IS NOT NULL
      AND "title"::text ~ E'^\\s*\\{'
      AND "title"::jsonb ? 'da'
  `)

  await db.execute(sql`
    UPDATE "payload"."products_locales"
    SET "subtitle" = (
      CASE WHEN "_locale" = 'da' THEN "subtitle"::jsonb->>'da'
           WHEN "_locale" = 'en' THEN "subtitle"::jsonb->>'en'
           ELSE "subtitle"::jsonb->>'da' END
    )::varchar
    WHERE "subtitle" IS NOT NULL
      AND "subtitle"::text ~ E'^\\s*\\{'
      AND "subtitle"::jsonb ? 'da'
  `)

  await db.execute(sql`
    UPDATE "payload"."products_locales"
    SET "description" = (
      CASE
        WHEN "description"::text ~ E'^\\s*\\{\\"da\\":' OR "description"::text ~ E'^\\s*\\{\\"en\\":'
        THEN COALESCE(
          CASE WHEN "_locale" = 'da' THEN "description"::jsonb->'da'
               WHEN "_locale" = 'en' THEN "description"::jsonb->'en' END,
          "description"::jsonb->'da',
          "description"::jsonb->'en',
          '{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":""}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'::jsonb
        )
        WHEN ("description"->'root') IS NULL
          OR jsonb_array_length(COALESCE("description"->'root'->'children', '[]'::jsonb)) = 0
        THEN '{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":""}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'::jsonb
        ELSE "description"
      END
    )
    WHERE "description" IS NOT NULL
      AND (
        "description"::text ~ E'^\\s*\\{\\"da\\":'
        OR "description"::text ~ E'^\\s*\\{\\"en\\":'
        OR ("description"->'root') IS NULL
        OR jsonb_array_length(COALESCE("description"->'root'->'children', '[]'::jsonb)) = 0
      )
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* No revert - data is fixed */
}
