# Milestones — Guapo MVP

Milestones are the execution backbone for the MVP. Each milestone has a clear objective, scope boundaries, and exit criteria.

## M1 — Foundations: repo + environments + thin-slice

**Objective:** A runnable local dev setup + clear repo structure so we can implement quickly without operational drift.

**In scope:**
- Decide repository layout (monorepo `apps/*` vs single app)
- Decide package manager + lockfile policy
- Establish local environment baseline + env var inventory (no secrets)
- Basic scripts to run services locally (placeholder endpoints OK)
- Record Linear sync readiness (labels/statuses/cycles) in repo docs

**Out of scope:**
- Full deployment automation
- Full external integrations (Adyen/Shipmondo/Plunk)

**Exit criteria:**
- Repo layout + package manager decision is recorded and used going forward
- Local “thin slice” can start (at least storefront placeholder route)
- Environment variable names are documented (no secrets committed)

## M2 — CMS (Payload): content model + SEO + homepage builder

**Objective:** Payload runs against Supabase and can drive homepage/content/blog + PDP guidance fields.

**In scope:**
- Scaffold Payload app and connect Postgres (schema `payload`)
- Model CMS collections: pages, blog/articles, navigation/footer links
- Model PDP guidance fields (skin types, concerns, ingredients, how-to, AM/PM, pair-with)
- Homepage page builder: predefined sections, reorderable, max 10

**Out of scope:**
- Full editorial content production at scale

**Exit criteria:**
- CMS collections exist for pages/blog/home + PDP guidance fields
- Draft → Review → Publish workflow is usable
- Media storage strategy is applied (Supabase Storage)

**Note:** Before starting M2 (or any milestone), review the [Milestone Ready Checklist](MILESTONE-READY-CHECKLIST.md) to ensure SDD workflow is configured correctly.

## M3 — Commerce (Medusa): core domain + DB wiring

**Objective:** Medusa server + worker run with Supabase + Redis and cover products, carts, orders, and accounts.

**In scope:**
- Scaffold Medusa server + worker and wire Redis
- Validate Supabase schema separation locally (schema `medusa` + migrations sanity)
- Implement baseline catalog → cart → order creation flow (no Adyen yet)
- Accounts baseline: guest checkout for one-time purchases; subscriptions require an account

**Out of scope:**
- Production-grade payment/shipping integrations (handled in M5)

**Exit criteria:**
- Core commerce flows work locally end-to-end on backend
- Admin can view orders
- Schema separation/migrations are validated locally

## M4 — Storefront (Next.js): MVP pages + core journeys

**Objective:** Build all MVP pages from sitemap with correct states and wiring to Medusa/Payload.

**In scope:**
- Next.js app scaffold with `/da` + `/en` route structure
- PLP (category/brand/concern) + search + filters + canonical rules
- PDP merges Medusa product data + Payload guidance, and exposes subscription selector UI
- Cart + checkout shell (parcel shop selection placeholder)
- Account area (orders + subscriptions shell)
- Content pages: blog/article + policies + support/FAQ/contact

**Out of scope:**
- Final visual polish; advanced personalization

**Exit criteria:**
- `/da` and `/en` pages exist for core journeys
- PLP/PDP/cart/checkout/order confirmation/account basics are usable locally
- Loading/empty/error states are implemented for key pages

## M5 — Integrations + gates + launch readiness

**Objective:** Integrate Adyen/Shipmondo/Plunk + consent/analytics + SEO/structured data and satisfy launch/staging gates.

**In scope:**
- Adyen integration baseline + method availability staging gate
- Subscription recurring billing validation plan + renewal simulation in staging
- Shipmondo parcel shop (GLS + DAO) + 39 DKK flat rate
- Plunk transactional emails (order + subscription notifications)
- Consent manager + PostHog + pixels + UTM storage in order metadata
- SEO: sitemap.xml + structured data (Product/Breadcrumb/Org/WebSite/Article/FAQ)
- Observability: Sentry + basic alerting plan for payment/subscription issues
- Sprint 1 research gate: Qogita investigation
- Launch gate: DK subscription compliance review (copy/policies)

**Out of scope:**
- Advanced CI/CD and full multi-env rollout automation (can follow once scaffolding is stable)

**Exit criteria:**
- Gates from `spec/04-open-questions.md` are represented as tasks with acceptance signals
- Staging validation approach is documented and executable
- MVP ship checklist in `spec/06-acceptance.md` can be run against the system
