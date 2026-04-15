# Payload migrations: localization (Categories/Brands/ProductTypes) fix

## What happened

You have two migrations:

1. **20260205_163856** – Full initial schema (all tables, including `categories`, `brands`, `product_types` with columns `name`, `slug`, `meta_*`, `body` on the main tables).
2. **20260205_164613** – Adds `categories_locales`, `brands_locales`, `product_types_locales` and **drops** those columns from the main tables.

`pnpm payload migrate` runs them in order. It often fails because:

- The database **already has** the payload schema (e.g. from an earlier `migrate` or `db push`), so the first migration fails with **"relation already exists"** (or type/enum already exists).

## Fix: baseline and run only the second migration

If your DB already has the full payload schema **and** `categories` / `brands` / `product_types` still have the old columns (`name`, `slug`, `meta_title`, etc.):

1. **Check status** (from `apps/cms`):
   ```bash
   pnpm payload migrate:status
   ```
   Note which migrations are "Applied" or "Pending".

2. **Mark the first migration as applied** so Payload won’t run it again. In your DB (e.g. Supabase SQL editor or `psql`), in the `payload` schema:
   ```sql
   INSERT INTO payload.payload_migrations (name, batch, created_at, updated_at)
   VALUES ('20260205_163856', 1, now(), now())
   ON CONFLICT DO NOTHING;
   ```
   (If your table has no unique constraint on `name`, use only `INSERT` without `ON CONFLICT`.)

3. **Run migrations again** (only the second one will run):
   ```bash
   pnpm payload migrate
   ```

That will create `categories_locales`, `brands_locales`, `product_types_locales` and drop the localized columns from the main tables. **Existing rows in `categories`/`brands`/`product_types` will have no locale rows yet** – you’ll need to open each document in the admin and save once (with default locale) so Payload can create the first locale row, or run a small data-migration script.

## If the first migration fails for another reason

- If you see a different error (e.g. timeout, or a specific table/type name), copy the **full** error message. For "relation X already exists", the baseline above is the right fix.
- If the DB is **empty** and the first migration still fails, the SQL might be too large for one `execute()` call; then we’d need to split `20260205_163856.ts` into several smaller migrations (e.g. by table group).

## Baseline when dev has already pushed (e.g. 20260205_165847)

If you see `relation "product_guidance_locales" already exists` (or similar) when running `pnpm payload migrate`, the schema was already applied by Payload in dev mode. Mark the migration as applied without running it:

```sql
INSERT INTO payload.payload_migrations (name, batch, created_at, updated_at)
VALUES ('20260205_165847', (SELECT COALESCE(MAX(batch),0)+1 FROM payload.payload_migrations), now(), now());
```

Run that in Supabase SQL (or `execute_sql`). Then `pnpm payload migrate` will skip this migration and future ones will apply normally.

## After a clean DB (no schema yet)

If you start from an empty DB:

1. Run `pnpm payload migrate` once. Both migrations should run.
2. If only the first runs and the second fails (e.g. "column does not exist"), the first migration was generated from a config that already had localization for categories/brands/product_types, so it might not create those columns on the main table. In that case the second migration’s `DROP COLUMN` would fail – then we’d adjust the second migration to not drop columns that don’t exist.
