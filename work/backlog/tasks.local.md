# Tasks — Guapo MVP

Tasks are grouped by milestone. Each task is designed to be small/validatable, with clear acceptance signals.

## M1 — Foundations

## Task: t1.1

**Description:** Decide repo layout (monorepo `apps/*` vs single app) and document the decision.

**Workspace:** .

**Status:** backlog

**Tags:** documentation, infrastructure

**Milestone:** M1

**Acceptance:**
- A short decision note exists (what we chose and why).
- All subsequent scaffold tasks align to the chosen layout.

**Estimate:** S

## Task: t1.2

**Description:** Decide package manager (npm vs pnpm) and lockfile policy.

**Workspace:** .

**Status:** done

**Tags:** infrastructure, documentation

**Milestone:** M1

**Acceptance:**
- Package manager choice is recorded.
- A lockfile policy is stated (lockfile committed; CI uses same tool).

**Estimate:** S

## Task: t1.3

**Description:** Define local env baseline + env var inventory (names only, no secrets).

**Workspace:** .

**Status:** done

**Tags:** infrastructure, security, documentation

**Milestone:** M1

**Acceptance:**
- An env var inventory exists (e.g., `.env.example` or equivalent doc).
- No secrets are committed.

**Estimate:** S

## Task: t1.4

**Description:** Linear sync readiness: confirm mapping + labels + cycles strategy are documented and consistent.

**Workspace:** .

**Status:** done

**Tags:** documentation, infrastructure

**Milestone:** M1

**Acceptance:**
- `work/linear/sync-config.md` contains required status mappings and connection name.
- Tags used in tasks match existing Linear issue labels.
- Sprint 1 / Cycle strategy is written down (Sprint 1 = Cycle #1).

**Estimate:** S

## Task: t1.5

**Description:** Set up GitHub remote (`origin`) and PR-ready workflow baseline (push branches + create PRs).

**Workspace:** .

**Status:** backlog

**Tags:** infrastructure, documentation

**Milestone:** M1

**Acceptance:**
- A GitHub repository exists for this project and `origin` is configured.
- `main` is pushed to `origin`.
- Task branches can be pushed and used to open PRs.
- A minimal PR workflow is documented (how to create PRs; where required checks will live once CI is added).

**Estimate:** S

## M2 — CMS (Payload)

## Task: t2.1

**Description:** Scaffold Payload app and connect to Supabase Postgres using schema `payload`.

**Workspace:** apps/cms

**Status:** backlog

**Tags:** cms, backend, infrastructure

**Milestone:** M2

**Dependencies:** t1.1, t1.2, t1.3

**Acceptance:**
- Payload runs locally and connects to Postgres.
- Tables/migrations land in schema `payload`.

**Estimate:** M

## Task: t2.2

**Description:** Define CMS content types: pages, blog/articles, navigation/footer.

**Workspace:** apps/cms

**Status:** backlog

**Tags:** cms

**Milestone:** M2

**Dependencies:** t2.1

**Acceptance:**
- Collections exist for pages and blog/articles.
- Navigation/footer links can be managed via CMS.

**Estimate:** M

## Task: t2.3

**Description:** Define PDP guidance fields in CMS (skin types/concerns/ingredients/how-to/AM-PM/pair-with).

**Workspace:** apps/cms

**Status:** backlog

**Tags:** cms, seo

**Milestone:** M2

**Dependencies:** t2.1

**Acceptance:**
- PDP guidance model exists in CMS.
- Guidance fields cover the MVP dataset described in spec.

**Estimate:** M

## Task: t2.4

**Description:** Implement homepage builder in CMS: predefined section types, ordering, max 10.

**Workspace:** apps/cms

**Status:** backlog

**Tags:** cms, design

**Milestone:** M2

**Dependencies:** t2.2

**Acceptance:**
- Editors can reorder homepage sections.
- Max sections enforced (10).
- Section types match MVP homepage needs (hero, featured products, etc.).

**Estimate:** M

## M3 — Commerce (Medusa)

## Task: t3.1

**Description:** Scaffold Medusa server + worker and wire Redis.

**Workspace:** apps/commerce

**Status:** backlog

**Tags:** commerce, backend, infrastructure

**Milestone:** M3

**Dependencies:** t1.1, t1.2, t1.3

**Acceptance:**
- Medusa server runs locally.
- Worker runs locally.
- Redis is connected and required workflows/jobs can execute.

**Estimate:** L

## Task: t3.2

**Description:** Validate Supabase schema separation locally: create/use schema `medusa` and ensure migrations run cleanly.

**Workspace:** apps/commerce

**Status:** backlog

**Tags:** commerce, database, infrastructure, gate

**Milestone:** M3

**Dependencies:** t3.1

**Acceptance:**
- Schema `medusa` exists (or equivalent) and Medusa uses it.
- Migrations run cleanly without touching Payload schema.

**Estimate:** M

## Task: t3.3

**Description:** Implement core commerce flows (backend): products, cart, checkout creates order (no Adyen yet).

**Workspace:** apps/commerce

**Status:** backlog

**Tags:** commerce, backend

**Milestone:** M3

**Dependencies:** t3.1

**Acceptance:**
- Products can be fetched/listed.
- Cart can be created/updated.
- Checkout can create an order (in a local/test flow).

**Estimate:** L

## Task: t3.4

**Description:** Accounts baseline: guest checkout for one-time purchases; subscriptions require an account.

**Workspace:** apps/commerce

**Status:** backlog

**Tags:** commerce, backend, security

**Milestone:** M3

**Dependencies:** t3.3

**Acceptance:**
- One-time purchases allow guest flow.
- Subscription creation is gated behind account/auth.

**Estimate:** M

## M4 — Storefront (Next.js)

## Task: t4.1

**Description:** Scaffold Next.js storefront and implement `/da` + `/en` routing baseline.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, seo

**Milestone:** M4

**Dependencies:** t1.1, t1.2

**Acceptance:**
- `/da` and `/en` routes exist and render.
- Language routing strategy matches spec.

**Estimate:** M

## Task: t4.2

**Description:** Implement PLP (category/brand/concern) + search + filters + canonical rules.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, seo

**Milestone:** M4

**Dependencies:** t4.1, t3.3

**Acceptance:**
- PLP pages exist for category/brand/concern.
- Search results page exists.
- Filtered pages canonicalize to base category (per spec).

**Estimate:** L

## Task: t4.3

**Description:** Implement PDP: merge Medusa product data + Payload guidance; add subscription selector UI.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, cms, subscriptions

**Milestone:** M4

**Dependencies:** t4.1, t3.3, t2.3

**Acceptance:**
- PDP renders Medusa product details/pricing.
- PDP renders guidance fields from CMS.
- Subscription selector supports cycles 4/8/12 weeks.

**Estimate:** L

## Task: t4.4

**Description:** Implement cart + checkout shell (parcel shop selection placeholder).

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, shipping

**Milestone:** M4

**Dependencies:** t4.1, t3.3

**Acceptance:**
- Cart page works for add/remove/update quantities.
- Checkout page exists and can proceed through a placeholder shipping selection step.

**Estimate:** L

## Task: t4.5

**Description:** Implement account area shell: orders + subscriptions list/detail.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, subscriptions

**Milestone:** M4

**Dependencies:** t4.1, t3.4

**Acceptance:**
- Account area is auth-gated.
- Orders list exists.
- Subscriptions list/detail shell exists (skip/pause/resume/cancel surfaces exist, even if logic lands later).

**Estimate:** L

## Task: t4.6

**Description:** Implement content pages: blog/article + policies + support/FAQ/contact.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, frontend, cms, legal

**Milestone:** M4

**Dependencies:** t4.1, t2.2

**Acceptance:**
- Blog index + article page exist.
- Policies pages exist (terms/privacy/cookies/returns).
- Support pages exist (FAQ + contact).

**Estimate:** M

## M5 — Integrations + gates

## Task: t5.1

**Description:** Adyen integration baseline + method availability gate plan (cards + MobilePay + Klarna + wallets).

**Workspace:** .

**Status:** backlog

**Tags:** payments, integration, gate

**Milestone:** M5

**Dependencies:** t3.3, t4.4

**Acceptance:**
- Integration approach is defined and implemented at least to the point of creating a payment session.
- A staging validation checklist exists for method availability in DK.

**Estimate:** L

## Task: t5.2

**Description:** Subscriptions recurring billing validation plan + renewal simulation in staging (staging gate).

**Workspace:** .

**Status:** backlog

**Tags:** subscriptions, payments, gate

**Milestone:** M5

**Dependencies:** t5.1

**Acceptance:**
- Recurring/tokenization/mandate requirements are confirmed.
- At least one renewal simulation is executed in staging (as per acceptance gate).

**Estimate:** L

## Task: t5.3

**Description:** Shipmondo integration: parcel shop + GLS/DAO + 39 DKK flat rate.

**Workspace:** .

**Status:** backlog

**Tags:** shipping, integration

**Milestone:** M5

**Dependencies:** t4.4

**Acceptance:**
- Parcel shop selection works (GLS + DAO via Shipmondo).
- Flat rate shipping is 39 DKK.

**Estimate:** L

## Task: t5.4

**Description:** Plunk transactional emails: order + subscription notifications.

**Workspace:** .

**Status:** backlog

**Tags:** integration

**Milestone:** M5

**Dependencies:** t3.3

**Acceptance:**
- Order confirmation email is sent in a test flow.
- Subscription notification emails are mapped (renewal upcoming, payment failed/recovered, pause/skip/cancel confirmations).

**Estimate:** M

## Task: t5.5

**Description:** Consent manager + PostHog + pixels (consent-gated) + UTM storage in order metadata.

**Workspace:** .

**Status:** backlog

**Tags:** analytics, seo, legal

**Milestone:** M5

**Dependencies:** t4.1

**Acceptance:**
- No analytics/pixels fire before consent.
- PostHog events fire only after analytics consent.
- Pixels fire only after marketing consent.
- UTM params are stored on orders and sent to PostHog (when consent allows).

**Estimate:** L

## Task: t5.6

**Description:** SEO: `sitemap.xml` + structured data (Product, BreadcrumbList, Organization, WebSite+SearchAction, Article, FAQPage).

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** seo, storefront

**Milestone:** M5

**Dependencies:** t4.2, t4.3, t4.6

**Acceptance:**
- `sitemap.xml` exists and includes `/da` + `/en`.
- Required structured data is emitted on relevant pages.

**Estimate:** L

## Task: t5.7

**Description:** Observability baseline: Sentry + payment/subscription alerting plan.

**Workspace:** .

**Status:** backlog

**Tags:** observability, infrastructure, gate

**Milestone:** M5

**Dependencies:** t3.1

**Acceptance:**
- Sentry is configured in all services.
- Basic alerting thresholds are defined for elevated payment failures and subscriptions on hold.

**Estimate:** M

## Task: t5.8

**Description:** Sprint 1 research gate: Qogita investigation (deadline end of Sprint 1).

**Workspace:** .

**Status:** backlog

**Tags:** research, integration

**Milestone:** M5

**Sprint:** Sprint 1

**Acceptance:**
- API access confirmed.
- Endpoint list documented.
- Recommended scope (products/pricing/stock) and sync model proposal.
- Effort estimate + risks.
- Mini integration plan (dataflow + recommendation).

**Estimate:** M

## Task: t5.9

**Description:** Launch gate: DK subscription compliance review (copy/policies).

**Workspace:** .

**Status:** backlog

**Tags:** legal, gate

**Milestone:** M5

**Acceptance:**
- Required disclosures identified.
- Checkout/policy copy updated accordingly.

**Estimate:** S

