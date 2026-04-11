# Guapo CMS (Payload)

Payload CMS for Guapo: pages, blog/articles, navigation/footer, homepage builder, and PDP guidance content.

## Setup

1. **Environment:** Copy `env.template` to `.env` in this directory. Set:
   - `DATABASE_URL` – Supabase Postgres connection string (same instance as Commerce; Payload uses schema `payload`).
   - `PAYLOAD_SECRET` – Required in production; dev uses a fallback if unset.

2. **Database:** Payload uses schema `payload` in the same Supabase database as Medusa (schema `medusa`). In development, Drizzle push syncs schema automatically. For production or migration-based workflow:
   - Generate migration: `pnpm migrate:create [name]`
   - Apply migrations: `pnpm migrate`
   - Status: `pnpm migrate:status`

3. **First run:** From repo root: `pnpm --filter @guapo/cms dev`. Admin: http://localhost:3001/admin. Create the first user when prompted.

## Scripts

- `pnpm dev` – Start Next.js + Payload (port 3001, Turbopack)
- `pnpm dev:webpack` – Same without Turbopack (use if you see hydration mismatch in admin list views)
- `pnpm build` / `pnpm start` – Production build and start
- `pnpm payload` – Payload CLI (migrate, etc.)
- `pnpm migrate` – Apply pending migrations
- `pnpm migrate:create` – Create a new migration
- `pnpm migrate:status` – Show migration status
- `pnpm generate:types` – Regenerate payload-types.ts
- `pnpm generate:schema` – Regenerate Drizzle schema

## Schema

Tables live in Postgres schema `payload`. Do not mix with Medusa schema `medusa`.

### Product categories (marketing)

1. In **Medusa Admin**, ensure product categories exist, then open **Settings → Payload CMS sync** and run **Categories** (creates Payload documents with `medusa_id` + `handle`).
2. In **Payload Admin → Categories**, switch **locale** (DA/EN) and edit:
   - **Content:** display name (H1), optional intro rich text.
   - **SEO:** meta title, meta description, OG image — use **Generate** for a starter from the display name, then refine.
3. Live storefront URL remains `/{locale}/categories/{handle}` from Medusa until a future slug-routing feature. The optional **slug** field in Payload is reserved for later.

## Troubleshooting: "Tenant or user not found"

This error comes from Supabase’s pooler when the tenant (project) or credentials are not accepted.

1. **Use the correct password**  
   In Supabase: **Project Settings → Database**. Use the **Database password** (the one you set at project creation or reset under “Database password”). Do not use the `anon` or `service_role` key.

2. **Check project reference**  
   In **Project Settings → General**, find **Reference ID**. In the connection string the username must be `postgres.<reference-id>` (e.g. `postgres.abcdefghijk`). No typos, no extra characters.

3. **Special characters in password**  
   If the password contains `@`, `#`, `%`, `:`, `/`, etc., it must be [URL-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) in `DATABASE_URL` (e.g. `@` → `%40`, `#` → `%23`).

4. **Try direct connection (no pooler)**  
   In **Project Settings → Database**, under “Connection string” choose **URI** and the **Direct** (non-pooler) option. Format:
   ```text
   postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
   Replace `[YOUR_PASSWORD]` and `[PROJECT_REF]` with your database password and Reference ID. If this works, the pooler was the issue; you can keep using direct for local dev or fix the pooler URL (Session mode) using the same password and ref.

## Troubleshooting: Hydration mismatch i Admin (list view)

Hvis du får "hydration mismatch" i konsollen når du åbner eller genindlæser en collection list (fx Products) – typisk `aria-describedby` eller `id` forskellige mellem server og client – er det ofte relateret til Turbopack + Payload UI. **Workaround:** Kør CMS uden Turbopack:

```bash
pnpm dev:webpack
```

Så bruges Webpack i stedet for Turbopack; det kan fjerne fejlen. Produktionsbuild (`pnpm build`) er uændret.
