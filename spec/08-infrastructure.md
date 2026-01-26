# Infrastructure

## Technology Stack

This is the **source of truth** for technologies, frameworks, and tooling used in this project.

- Frontend Framework: Next.js
- Backend Framework: Medusa (commerce backend)
- CMS: Payload CMS
- Database: PostgreSQL (Supabase)
- Cache/Queue: Redis (Railway)
- Build Tool: pnpm (via Corepack; lockfile is source of truth)
- Language: TypeScript (expected for this stack)
- Other:
  - Payment: Adyen
  - Supplier (investigation): Qogita (qogita.com)
  - Subscriptions: recurring billing is required for the MVP subscription feature
    - MVP policy: cycles 4/8/12 weeks, 5% discount, minimum commitment 2 deliveries before cancellation

## Monorepo / Workspaces (if applicable)

DECIDED: monorepo with `apps/*` workspaces (see `spec/05-decisions.md`).

- Workspace: `apps/storefront`
  - Frontend Framework: Next.js
  - Language: TypeScript
  - Build Tool: pnpm
  - Notes: storefront UI, SEO, customer flows
- Workspace: `apps/commerce`
  - Backend Framework: Medusa
  - Language: TypeScript
  - Notes: orders, carts, subscriptions, payment integration
- Workspace: `apps/cms`
  - CMS: Payload CMS (Next.js-native in v3+)
  - Language: TypeScript
  - Notes: content pages + blog + SEO fields + admin UI. Runs as a separate Next.js service from the customer storefront.

## Hosting
- Provider: Railway (compute)
- Region: TBD (choose EU region if available)
- Pricing: TBD
- URL: TBD
 - Environments: staging + production (plus local)

## Database
- Provider: Supabase Postgres
- Type: PostgreSQL
- Connection: Managed
- Pricing: TBD
- Schema strategy:
  - Payload: use `schemaName="payload"` (supported by Payload Postgres adapter).
  - Medusa: prefer a dedicated schema (e.g. `medusa`) or a dedicated database. Exact wiring depends on Medusa connection options and should be validated during scaffolding.

## External Services
- Payment: Adyen
  - Required methods (MVP, DK): cards, Apple Pay, Google Pay, MobilePay, Klarna
- Shipping: Shipmondo
- Supplier / catalog source (future): Qogita (investigate API access and fit)
- Newsletter: TBD
- Analytics: PostHog
- Marketing pixels: Meta + Google Ads (behind marketing consent)
- Cookie consent: required (categories: necessary / analytics / marketing)
- Transactional email provider: Plunk (useplunk.com)
- Redis: Railway Redis (required for Medusa worker/eventing)
- Error tracking: Sentry
- Other: TBD

## Attribution (MVP)
- Store UTM params in checkout/order metadata (and send as PostHog properties).

## Data retention (MVP)
- Retain customer/order data as required for operations and accounting.
- Retain marketing/tracking data as long as legally permissible under GDPR and consent.
- Exact retention durations: TBD (not a planning blocker, but must be documented before launch).

## SEO / i18n (MVP)
- URL language strategy: `/da/...` and `/en/...`
- Sitemap: single `sitemap.xml` (covers `/da` + `/en` routes)
- Canonical policy: filtered/search pages canonical to base category

## Deployment topology (Railway)

Expected Railway services (MVP):
- `storefront`: Next.js
- `medusa-server`: Medusa API instance (server mode)
- `medusa-worker`: Medusa worker instance (worker mode; background jobs)
- `payload`: Payload CMS
- `redis`: Redis (Railway managed)

Database (Supabase) is external and shared across services (schema separation as above).

## Versioning & bootstrapping policy

Goal: avoid manual dependency drift and keep versions consistent.

- Bootstrap via official CLIs:
  - Medusa: `npx create-medusa-app@latest` (optionally installs Next.js starter storefront).
  - Payload: `npx create-payload-app` (template TBD).
- Pin exact versions in source control via lockfile (`pnpm-lock.yaml`).
- Minimum Node version: follow Medusa requirements (Node 20+ per Medusa docs at time of writing).

## Media storage (Payload uploads)

DECIDED: Supabase Storage.

## CI/CD
- Provider: TBD
- Deployment strategy: TBD (automatic vs manual approvals)
- Branch strategy:
  - `staging` → staging environment (development/testing)
  - `main` → production environment
  - Promotion: PR/merge `staging` → `main`
  - **Config:** `.sdd/git-config.json` (tells all commands to use `staging` as default PR target)

## GitHub Actions (if using GitHub)
- Workflows: TBD
- CI checks: TBD
- Deployment: TBD
- PR requirements: TBD (we will define required checks once CI exists; until then, PRs rely on review + local checks).

## Environment Variables

Do not commit secrets. Names below are placeholders.

Env var inventory file (names only): `env.example`.

- Required (expected):
  - `ADYEN_MERCHANT_ACCOUNT`
  - `ADYEN_API_KEY`
  - `ADYEN_CLIENT_KEY`
  - `DATABASE_URL`
  - `PAYLOAD_SECRET`
  - `REDIS_URL`
- Optional (recommended):
  - `SENTRY_DSN`
- Optional / TBD:
  - `QOGITA_API_KEY` (only if we integrate)
  - `NEXT_PUBLIC_SITE_URL`
  - `EMAIL_PROVIDER_API_KEY` (Plunk API key; exact name TBD)
  - `ANALYTICS_WRITE_KEY`

## Known Issues
- TBD

