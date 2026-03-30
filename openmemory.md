# OpenMemory Guide — guapo

This file is a lightweight index of project facts and conventions that are useful to remember.

## Overview
- **Project**: Guapo (DK-first, unisex beauty e-commerce)
- **Focus (MVP)**: face skincare; curation-first guidance; competitive pricing; fast, clean UX
- **Core stack**: Next.js + Medusa + Payload CMS; payments via Stripe (cards, Apple Pay, Google Pay; MobilePay/Klarna when enabled); product subscriptions require recurring billing
- **Repo layout (DECIDED)**: Monorepo with `apps/*`:
  - `apps/storefront` (Next.js customer storefront)
  - `apps/commerce` (Medusa backend + worker)
  - `apps/cms` (Payload CMS as its own Next.js app/service; Payload v3+ is Next.js-native)
- **Package manager (DECIDED)**: pnpm (via Corepack); commit `pnpm-lock.yaml` and treat it as the single source of truth.
- **Env var inventory**: `env.example` (names only; no secrets).
- **GitHub repo**: `https://github.com/eskoubar95/guapo` (git remote `origin` uses HTTPS)
- **Branch strategy (DECIDED)**: `staging` = staging, `main` = production. PRs go to `staging`; releases are `staging` → `main`. Config: `.sdd/git-config.json`.
- **Guardrails (TECHNICALLY ENFORCED)**:
  - GitHub Actions PR Policy workflow blocks direct feature → `main` PRs (must come from `staging`)
  - Branch protection on `staging` and `main`: requires PR, approvals, status checks
  - CI checks validate SDD metadata and spec files
  - Commands (`/task/start`, `/task/validate`, `/task/promote`) use `.sdd/git-config.json` for branch resolution
- **Cloud Agent pilot (Cursor Cloud Agents via Linear)**:
  - Linear label: `agent-ok` (Guapo team)
  - Use only for small, isolated tasks (docs, narrow refactors, small scripts, workflow tweaks)
  - Issue must include: Scope + Out of scope + Acceptance + Workspace
  - Delegation constraint: agent opens **draft PR to `staging`** only; no feature PRs directly to `main`
  - Delegation trigger: post a comment starting with `@cursor` + the strict SDD Cloud Agent prompt
- **Task management + MCP**: Linear is the source of truth for tasks during execution (MCP: `guapo-linear`). Supabase ops use MCP: `supabase`.
- **Sprint context**: We use Linear **Cycles** as sprints (Guapo team cycles enabled).
- **Spec set**: root + PRD + architecture + acceptance + sitemap are now created in `spec/`

## Architecture (high-level)
- **Storefront**: Next.js (PLP/PDP, cart, checkout, account, content)
- **Commerce backend**: Medusa (products, carts, orders, subscriptions)
- **CMS**: Payload (static pages, blog/articles, landing pages, nav/footer links, PDP guidance fields, homepage composition via page builder)
- **Payments**: Stripe (recurring required for subscriptions)
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
- **Subscription Module (M9):** Custom Medusa module in `apps/commerce/src/modules/subscription`. Model: status (active/paused/on_hold/cancelled/expired), cycle_weeks, discount_percent, Stripe customer+payment_method IDs, retry state (retry_count, next_retry_at, on_hold_at). Link: Subscription → Order (1:many). Store API: GET /store/subscriptions, GET /store/subscriptions/:id, POST /store/subscriptions/:id/{pause|resume|skip|cancel}. Admin: Subscriptions list/detail pages, order-subscription widget. Renewal: job subscription-renewal (8 AM), workflow renew-subscription (Stripe off-session charge, create order, link, update next_renewal_at). Retry job (9 AM), expiration job (10 AM, on_hold>30d → expired). Simulation: SUBSCRIPTION_ID=xxx pnpm simulate-renewal.
- **Product Reviews (Fase 3 PDP):** Plugin `@lambdacurry/medusa-product-reviews` in apps/commerce (defaultReviewStatus: pending). Storefront: `lib/medusa-product-reviews.ts` (fetchProductReviews, fetchProductReviewStats), `ProductReviewsSection` on PDP (list approved reviews, stats, CTA to review from order history). Plugin store API: GET /store/product-reviews (filter product_id, status=approved), GET /store/product-review-stats (filter product_id). Submit review requires order_id + order_line_item_id (verified purchase); PDP shows CTA "Anmeld fra ordreoversigt" only.
- **Payload Localization (apps/cms):** Built-in localization enabled in `payload.config.ts`: `locales: ['da', 'en']`, `defaultLocale: 'da'`, `fallback: true`. Localized fields: Pages (title, slug, meta, content), Articles (title, slug, excerpt, content, meta), Products (title, keyIngredients, ingredients, beneficials), Navigation (mainMenu, ctaButton), Footer (columns, legalLinks, newsletter, copyright), Homepage (meta, sections), Media (alt). Storefront can request `?locale=da` or `?locale=en`; optional `?fallback-locale=...`.
- **Home sections**: HomePromoBars, CategoryStrip (colored circles), PromotionSlider (3 slides), FeaturedProducts, CampaignSection, RoutineBlock, ContentGrid, BrandSpotlight, CtaStrip, ServiceStrip, Newsletter. Design source: `design/Ecommercestorefrontdesign/src/app/pages/home.tsx` + `src/app/components/sections/`.
- **PR19 CMS review hardening (M11):** Storefront CMS API routes now normalize locale query params (`da|en`) at runtime, homepage API adds cache headers for non-draft responses, article-by-slug supports `draft=true` preview mode, and article list supports explicit `page` pagination plus explicit `and/or` query semantics. Payload configs were hardened with conditional validation on hidden-required fields (`Pages.content`, hero `backgroundImage`, navigation `promotionBar.text`), shared icon options in Navigation, and safer config details (removed redundant `data.path` cast and documented accepted risk for `EXPERIMENTAL_TableFeature` with pinned package version).
- **Checkout payment session (storefront):** `usePaymentSession` fingerprints `CheckoutFormData` including email, phone, and marketing opt-in so Stripe re-init runs when those change; when Medusa returns multiple fulfillment options, shipping method must be selected (or a single option auto-applies)—no blind `shipping_options[0]` with multiple rows. New copy key `checkout.shippingMethodRequired` (da/en). Pickup sheet search uses a monotonic request sequence so slower responses cannot overwrite newer results; failed fetches are logged and loading state is tied to the active request.
- **PR20 CodeRabbit follow-up (post-3694854):** `AccountLayout` mobile sheet: `normalizePath` for nav + section title; `matchMedia('md')` closes sheet on resize; focus moves into sheet on open and tab-cycles within dialog; trigger refocus on close. `CheckoutOrderSummary` uses `checkout.calculatedWhenDeliverySelected` and `checkout.vatIncludedBreakdown`. `usePickupPointSheetSearch` invalidates fetch seq when sheet closes; keeps selected pickup point when still in results; zip fallback uses digits-only, not `slice(0,4)` on street text. `useCheckoutPickup` resets `selectedCarrier` to `gls` when `selectedPoint` is cleared. `ContentBlockSection`: safer CTA hrefs (scheme + locale prefix); single-column grid when no image. `PromotionSlider`: optional `accessibleLabel` per slide; play/pause + focus/touch pause; lazy images except current/adjacent. `ProductCard`: wishlist button outside image link; split add vs sync errors; `viewProduct` a11y label; `??` for unit price.

## User Defined Namespaces
- [Leave blank - user populates]
