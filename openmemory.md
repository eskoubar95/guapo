# OpenMemory Guide — guapo

This file is a lightweight index of project facts and conventions that are useful to remember.

## Overview
- **Project**: Guapo (DK-first, unisex beauty e-commerce)
- **Focus (MVP)**: face skincare; curation-first guidance; competitive pricing; fast, clean UX
- **Core stack**: Next.js + Medusa + Payload CMS; payments via Adyen (cards, Apple Pay, Google Pay, MobilePay, Klarna); product subscriptions require recurring billing
- **Repo layout (DECIDED)**: Monorepo with `apps/*`:
  - `apps/storefront` (Next.js customer storefront)
  - `apps/commerce` (Medusa backend + worker)
  - `apps/cms` (Payload CMS as its own Next.js app/service; Payload v3+ is Next.js-native)
- **Package manager (DECIDED)**: pnpm (via Corepack); commit `pnpm-lock.yaml` and treat it as the single source of truth.
- **Env var inventory**: `env.example` (names only; no secrets).
- **GitHub repo**: `https://github.com/eskoubar95/guapo` (git remote `origin` uses HTTPS)
- **Branch strategy (DECIDED)**: `staging` = staging, `main` = production. PRs go to `staging`; releases are `staging` → `main`. Config: `.sdd/git-config.json`.
- **Task management + MCP**: Linear is the source of truth for tasks during execution (MCP: `guapo-linear`). Supabase ops use MCP: `supabase`.
- **Sprint context**: We use Linear **Cycles** as sprints (Guapo team cycles enabled).
- **Spec set**: root + PRD + architecture + acceptance + sitemap are now created in `spec/`

## Architecture (high-level)
- **Storefront**: Next.js (PLP/PDP, cart, checkout, account, content)
- **Commerce backend**: Medusa (products, carts, orders, subscriptions)
- **CMS**: Payload (static pages, blog/articles, landing pages, nav/footer links, PDP guidance fields, homepage composition via page builder)
- **Payments**: Adyen (recurring required for subscriptions)
- **Shipping**: Shipmondo (parcel shop only in MVP; GLS+DAO; flat rate 39 DKK; returns 14 days, customer-paid label)
- **Hosting/DB**: Railway for compute (storefront + medusa-server + medusa-worker + payload + redis); Supabase Postgres for DB; Railway Redis for Medusa requirements
- **Supplier**: Qogita (investigation; decision later)

## Patterns
- **Focus styling**: Do **not** use focus rings. Use **active/focus borders** as the focus indicator (especially on inputs). See `spec/07-design-system.md`.
- **Subscriptions (MVP)**: Cycles 4/8/12 weeks, 5% discount on all renewals, minimum commitment 2 deliveries before cancellation. Controls: skip next delivery, pause, resume, cancel (after commitment). Email-only notifications; renewal reminder 3 days before; failed payments: 2 retries over 3 days then subscription on hold until payment method update. Returns/refunds: same 14-day policy as normal orders; opened products not returnable (except defective); partial refunds supported; if a subscription delivery is refunded/returned, subscription auto-pauses until customer resumes.
- **Checkout (MVP)**: Guest checkout allowed for one-time purchases; subscriptions require an account.
- **Messaging (MVP)**: Balanced: curated premium assortment + competitive pricing (no “cheapest” claim).
- **SEO/i18n**: Use `/da/...` and `/en/...` URL prefixes. Structured data at launch: Product, BreadcrumbList, Organization, WebSite+SearchAction, Article, FAQPage.
- **Sitemap/canonical (MVP)**: Single `sitemap.xml`. Filter/search pages canonical to base category (no indexing of filter combinations by default).
- **Homepage CMS**: Use a homepage page builder with **predefined section types** (component library). Editors can reorder sections and edit per-section fields.
- **Homepage dynamic blocks (MVP)**: Max 10 sections. Best sellers = auto (top sold last 30 days). New arrivals = hybrid (auto default + manual override). Routine block uses simple rules (e.g., per skin type).
- **Curation tags (MVP)**: Skin types supported: dry, oily, combination, normal, sensitive. Product tagging is manual/editorial.
- **Curation concerns + routines (MVP)**: Concerns supported: acne, dryness, sensitivity/irritation, redness, hyperpigmentation, dullness/glow. Routine templates: simple per skin type + per concern. Steps: 3-step baseline + optional 5-step variant.
- **Tagging model (MVP)**: Use primary + secondary tags. Products can appear in multiple concerns, but primary concern/skin type drives default sorting and routine/template selection.
- **Routine steps (MVP)**: cleanser, serum, face cream/moisturizer, SPF (AM required) + add-ons: toner, eye cream, face mask (1–2x/week). Order: AM cleanser→serum→SPF, PM cleanser→serum→face cream; 5-step adds toner+eye cream.
- **Routine recommendations (MVP)**: Show up to 3 products per step (1 primary + up to 2 alternatives). Primary uses primary-tag match; alternatives may use secondary tags if relevant.
- **Conflict rule (MVP)**: A product is “conflicting” for a routine if it does not match the routine context via primary or secondary tag in that dimension (skin type / concern). Conflicting products must not be shown as alternatives.
- **Cookie consent + analytics (MVP)**: Cookie consent required with categories necessary/analytics/marketing. Analytics via PostHog (analytics consent). Marketing pixels Meta + Google Ads (marketing consent).
- **Attribution (MVP)**: Store UTM params in checkout/order metadata (and send as PostHog properties).
- **Content ops (MVP)**: Owner-driven and handled ad hoc (no fixed cadence). CMS workflow enforces review before publish.
- **Legal docs (MVP)**: Founders draft terms/privacy/cookies using templates; legal review can follow post-launch if needed.
- **Retention (MVP)**: Keep marketing/tracking data as long as legally permissible under GDPR + consent; exact retention durations TBD.
- **Subscription compliance (DK)**: Treated as a launch acceptance gate (confirm required subscription disclosures and update copy/policies before shipping).
- **Transactional emails (MVP)**: Provider = Plunk (orders + subscriptions).
- **CMS workflow (MVP)**: Draft → Review → Publish. Roles: Admin, Editor, Writer, Support.
- **Reviews (MVP)**: On-site only + pre-moderation.
- **Observability (MVP)**: Sentry + structured logs + uptime + alerts for payment failures and subscriptions on hold.

## Components
- (TBD)

## User Defined Namespaces
- [Leave blank - user populates]
