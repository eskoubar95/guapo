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

**Objective:** Integrate Plunk + consent/analytics + SEO/structured data and satisfy launch/staging gates. (Payment: M9 Stripe. Shipping: M10 Shipmondo.)

**In scope:**
- Plunk transactional emails (order + subscription notifications)
- Subscription recurring billing validation plan + renewal simulation in staging (Stripe; see M9)
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

## M6 — Storefront design system-integration

**Objective:** Integrate Figma design from the Ecommercestorefrontdesign repo into Guapo storefront with refactoring to design tokens, reusable components, and dynamic data (Medusa/CMS).

**In scope:**
- Access to and placement of design repo in monorepo (clone/copy/submodule; decision documented)
- Analysis of design repo (structure, components, tokens, mockup data)
- Tokens/theme: map to spec/07, base layout
- Refactor and integration of UI components (header, footer, buttons, cards, inputs) in `apps/storefront`
- Page-by-page integration (Home, PLP, PDP, Cart, Checkout, Account, Content/Support/Policies) with refactor and data-wiring
- Replacement of mockup data with Medusa/Payload
- Fixes and touch-ups (build/runtime, focus states, responsiveness)

**Out of scope:**
- New functionality beyond what the design covers; full M5 integration (Adyen, Shipmondo, etc.) remains in M5

**Exit criteria:**
- Design repo is accessible and placement decision is documented in spec/05-decisions.md (if new decision)
- Guapo tokens and conventions from spec/07 are applied; no raw hex ad hoc
- Primary sitemap pages are covered with refactored UI and dynamic data where relevant
- Loading/empty/error states are implemented for core flows (per spec/07)
- Focus states use active border (no focus ring)

**Traceability:** spec/05-decisions.md (design source), spec/07-design-system.md, spec/03-risks.md (Figma risk), spec/09-sitemap.md

## M7 — Backend-optimering: Payload CMS + Medusa alignment

**Objective:** Payload CMS kører fejlfrit mod Supabase; redaktører kan logge ind, oprette og redigere indhold; lokalisation og SEO er planlagt/implementeret i CMS; Payload-plugins er undersøgt og valgt. Medusa-kataloget er opdateret med korrekte produkttyper, kategorier, tags og brand-metadata, så alt er klart til senere storefront-integration (ingen storefront-ændringer i M7).

**In scope:**
- Diagnostik og fix af Payload (opstart, login, DB, migrations) så admin kan åbnes og bruges uden fejl
- Verifikation af end-to-end CMS: login, opret/rediger pages, articles, media, product-guidance; database og schema `payload` fungerer
- Lokalisation (flere sprog) og SEO i CMS: behov dokumenteret og evt. felter/struktur tilføjet (da/en, meta/SEO) uden at røre storefront
- Research af Payload CMS-plugins (i18n, SEO, storage, etc.) og anbefaling til MVP
- Medusa: rette produkttyper (cleanser, serum, moisturizer, SPF, toner, etc.), kategorier (hierarki), tags (skin type + concern), product metadata (brand, primary_skin_type, primary_concern) og evt. product_collection til brands — i tråd med synergy-research
- Dokumentation af CMS–Commerce-synergy og canonical nøgle (product.handle) så storefront senere kan forbinde uden tvetydighed

**Out of scope:**
- Ændringer i apps/storefront
- Adyen, Shipmondo, Plunk, consent/analytics (M5)
- Nye features ud over det, der er nødvendigt for at få Payload + Medusa "klar" til storefront

**Exit criteria:**
- Payload admin åbnes og bruges uden fejl; login og CRUD på relevante collections virker
- Schema `payload` eksisterer i Supabase og migrations kører cleanly
- Lokalisation/SEO i CMS er besluttet og (hvis relevant) implementeret eller dokumenteret med konkrete tasks
- Payload-plugins er undersøgt og anbefaling er skrevet ned (evt. i spec eller work/backlog)
- Medusa har korrekte product_type, kategorier, tags og metadata (brand + primary tags); dokumentation for handle-baserede links mellem CMS og Medusa findes

## M8 — Customer Authentication

**Objective:** Kunder kan oprette konto (email/password) og logge ind med email eller Google. Auth-gated routes virker.

**In scope:**
- Medusa Auth module konfigureret (emailpass + Google providers)
- Login- og register-sider i storefront
- Google social login flow (redirect → callback → validering via Medusa)
- Auth state management (session/JWT, auth context/hook, beskyttede routes)
- Account-området wiret med sign out, kundedata, redirect til login

**Out of scope:**
- Andre social providers (Apple, Microsoft, GitHub) end Google

**Exit criteria:**
- Kunder kan registrere og logge ind med email/password
- Kunder kan logge ind med Google
- Account-sider er auth-gated; sign out virker

## M9 — Stripe Payments

**Objective:** Kunder kan betale med kort via Stripe i checkout. Stripe erstatter Adyen som payment provider. Subscription: recurring payment method (mandate) ved subscription-checkout, renewal charge + webhook, staging renewal simulation.

**In scope:**
- Stripe Payment Module registreret i Medusa
- Stripe aktiveret i Denmark-regionen
- Stripe PaymentElement i storefront checkout
- Stripe webhook endpoint for deployed miljø
- Spec-filer opdateret (Adyen → Stripe)
- Recurring payment method (mandate) ved subscription-checkout; gem token til renewal
- Subscription renewal charge (webhook/cron); opret order ved success; retry/recovery (2 retries over 3 dage)
- Staging gate: mindst én renewal simulation gennemført i staging

**Out of scope:**
- MobilePay/Klarna via Stripe (kan tilføjes senere)

**Exit criteria:**
- End-to-end betaling med test-kort virker i staging
- Webhook håndterer payment events (succeeded, failed, refunded)
- Subscription: betalingsmetode til abonnement ved checkout; renewal flow med retry/recovery; renewal simulation i staging

## M10 — Shipmondo Shipping

**Objective:** Kunder kan vælge GLS/DAO pakkeshop ved checkout. Shipping koster 39 DKK flat rate. Labels kan genereres.

**In scope:**
- Shipmondo API research og dokumentation
- Custom Fulfillment Module Provider (validateOption, calculatePrice, createFulfillment, getFulfillmentDocuments)
- Shipmondo provider registreret i Medusa
- Pakkeshop-valg i storefront checkout (søgning, kort/liste, gem valgt)

**Out of scope:**
- Andre carriers end GLS + DAO parcel shop
- Hjemlevering (kun pakkeshop i MVP)

**Exit criteria:**
- Pakkeshop kan vælges ved checkout
- Flat rate 39 DKK anvendt
- Fulfillment/label-flow testet end-to-end
