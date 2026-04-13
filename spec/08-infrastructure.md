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
  - Payment: Stripe
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
- Payment: Stripe
  - Primary: cards; optional in Stripe: Apple Pay, Google Pay, MobilePay, Klarna (MVP, DK)
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
- Provider: GitHub Actions
- Deployment strategy: TBD (automatic vs manual approvals)
- Branch strategy:
  - `staging` → staging environment (development/testing)
  - `main` → production environment
  - Promotion: PR/merge `staging` → `main`
  - **Config:** `.sdd/git-config.json` (tells all commands to use `staging` as default PR target)
- **Release strategy:**
  - Feature PRs merge to `staging` (development)
  - Multiple milestones/features can accumulate in `staging` for integrated testing
  - Production releases happen via promotion PR (`staging` → `main`) when ready
  - Use `/task/promote` command to create promotion PRs (includes all changes since last production release)

## GitHub Actions
- **CI workflow** (`.github/workflows/ci.yml`):
  - Runs on push/PR to `staging` and `main`
  - Validates `.sdd/git-config.json` (JSON syntax + required fields)
  - Validates helper metadata (`.cursor/scripts/validate-helpers.cjs`)
  - Checks required spec files exist: `spec/00-root-spec.md`, `spec/08-infrastructure.md` (`work/backlog/` is gitignored and not part of CI)
- **PR Policy workflow** (`.github/workflows/pr-policy.yml`):
  - Enforces branch policy: PRs to `main` must come from `staging`
  - Blocks direct feature → `main` PRs
  - Validates PR descriptions
- **Required checks** (for branch protection):
  - `CI / SDD Sanity Checks`
  - `PR Policy / Enforce Branch Policy`
- **Branch protection** (see `.github/BRANCH-PROTECTION.md`):
  - `staging`: Requires PR, 1 approval, status checks
  - `main`: Requires PR, 1 approval, status checks, no direct pushes
- **PR template** (`.github/pull_request_template.md`): Standardizes PR descriptions with summary, testing, acceptance criteria

## Environment Variables

Do not commit secrets. Names below are placeholders.

Env var inventory file (names only): `env.example`.

- Required (expected):
  - `STRIPE_API_KEY`
  - `STRIPE_WEBHOOK_SECRET` (deployed environments)
  - `NEXT_PUBLIC_STRIPE_KEY` (storefront)
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

