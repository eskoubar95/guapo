# Database Schema Separation

## Overview

Guapo uses a single Supabase PostgreSQL database with schema separation to isolate different services:

| Service | Schema | Purpose |
|---------|--------|---------|
| Payload CMS | `payload` | Content, pages, blog, navigation |
| Medusa Commerce | `medusa` | Products, carts, orders, customers |
| Supabase | `public` (reserved) | Supabase internal tables |

## Configuration

### Medusa (apps/commerce)

Schema is configured in `medusa-config.ts`:

```typescript
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseSchema: "medusa",
    // ...
  },
});
```

### Payload (apps/cms)

Schema is configured in `payload.config.ts`:

```typescript
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL },
  schemaName: "payload",
}),
```

## Benefits

1. **Isolation**: Each service's tables are isolated, preventing naming conflicts
2. **Migrations**: Each service can run migrations independently
3. **Backup/Restore**: Can backup/restore schemas separately if needed
4. **Security**: Can apply different permissions per schema

## Creating Schemas

Schemas are created automatically when running migrations for the first time. If you need to create them manually:

```sql
-- In Supabase SQL Editor
CREATE SCHEMA IF NOT EXISTS medusa;
CREATE SCHEMA IF NOT EXISTS payload;
```

## Migrations

### Medusa
```bash
cd apps/commerce
pnpm db:migrate
```

### Payload
```bash
cd apps/cms
pnpm dev  # Auto-runs migrations on startup
```

## Verification

To verify schema separation is working correctly:

```sql
-- List all schemas
SELECT schema_name FROM information_schema.schemata;

-- List tables in medusa schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'medusa';

-- List tables in payload schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';
```

## Troubleshooting

### Tables appearing in public schema

If Medusa tables appear in `public` instead of `medusa`:
1. Check `databaseSchema` is set in `medusa-config.ts`
2. Ensure the schema exists before running migrations
3. Clear existing tables and re-run migrations

### Migration conflicts

If migrations fail with schema-related errors:
1. Check schema permissions for the database user
2. Ensure each service uses its designated schema
3. Never modify tables in another service's schema manually
