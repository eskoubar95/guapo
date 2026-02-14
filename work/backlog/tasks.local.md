# Tasks — Guapo MVP

Tasks are grouped by milestone. Each task is designed to be small/validatable, with clear acceptance signals.

## M1 — Foundations

## Task: t1.1

**Description:** Decide repo layout (monorepo `apps/*` vs single app) and document the decision.

**Workspace:** .

**Status:** done

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

**Status:** done

**Tags:** infrastructure, documentation

**Milestone:** M1

**Acceptance:**
- A GitHub repository exists for this project and `origin` is configured.
- `main` is pushed to `origin`.
- Task branches can be pushed and used to open PRs.
- A minimal PR workflow is documented (how to create PRs; where required checks will live once CI is added).

**Estimate:** S

## Task: t1.6

**Description:** Define branch strategy: `staging` branch for staging environment; `main` is production.

**Workspace:** .

**Status:** done

**Tags:** infrastructure, documentation

**Milestone:** M1

**Acceptance:**
- `staging` branch exists on GitHub.
- Branch strategy is documented (PRs go to `staging`; releases are `staging` → `main`).

**Estimate:** S

## M2 — CMS (Payload)

## Task: t2.1

**Description:** Scaffold Payload app and connect to Supabase Postgres using schema `payload`.

**Workspace:** apps/cms

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

**Status:** done

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

## M6 — Storefront design system-integration

## Task: t6.1

**Description:** Verify access to design repo (Ecommercestorefrontdesign) and decide placement in monorepo (copy vs submodule). Document decision in spec/05 if new.

**Workspace:** .

**Status:** backlog

**Tags:** storefront, design, infrastructure

**Milestone:** M6

**Acceptance:**
- Repo is cloneable; placement decided and documented; design files available under chosen path.

**Estimate:** S

## Task: t6.2

**Description:** Analyse design-repo: map file structure, layout/side templates, components, tokens/theme, mockup data and static copy. Map to spec/09 sitemap.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design

**Milestone:** M6

**Dependencies:** t6.1

**Acceptance:**
- Written short analysis (e.g. in task note or doc): structure, component list, token/theme usage, mockup locations, page mapping.

**Estimate:** M

## Task: t6.3

**Description:** Define theme/tokens from design and map to spec/07; implement base layout (e.g. root layout) using tokens.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design

**Milestone:** M6

**Dependencies:** t6.2, t4.1

**Acceptance:**
- Theme/tokens implemented (CSS vars or Tailwind); root layout uses tokens; no ad-hoc hex in layout.

**Estimate:** M

## Task: t6.4

**Description:** Refactor and integrate core UI components (header, footer, buttons, cards, inputs) into storefront; align with spec/07 Phase 1 and focus-border rule.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design

**Milestone:** M6

**Dependencies:** t6.3

**Acceptance:**
- Shared components live in storefront; token-driven; focus state = active border; responsive 320/768/1024.

**Estimate:** L

## Task: t6.5

**Description:** **Discovery:** Integrate Home, PLP, PDP — refactor layout and wire data (Medusa/CMS) where applicable. Loading/empty/error per spec/07.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design, cms, commerce

**Milestone:** M6

**Dependencies:** t6.4, t4.1

**Acceptance:**
- Home, category/brand/concern PLP, and PDP implemented with design; mockup replaced by real or stubbed data where available.

**Estimate:** L

**Notes:** Partial dependency on t3.x/t2.x for live data when available.

## Task: t6.6

**Description:** **Purchase:** Integrate Cart and Checkout — refactor layout and wire cart/checkout data.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design, commerce

**Milestone:** M6

**Dependencies:** t6.4, t4.1

**Acceptance:**
- Cart and Checkout pages implemented with design; add/remove/update quantities and checkout steps work (placeholder shipping OK).

**Estimate:** L

**Notes:** Partial dependency on t3.3 for cart/order.

## Task: t6.7

**Description:** **Account & content:** Integrate Account (orders, subscriptions), blog/article, policies, support/FAQ/contact.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design, cms, commerce

**Milestone:** M6

**Dependencies:** t6.4, t4.1

**Acceptance:**
- Account area, blog, policies, support pages implemented with design; auth-gating and CMS content wiring where applicable.

**Estimate:** L

**Notes:** Partial dependency on t2.2/t3.4 for data.

## Task: t6.8

**Description:** Replace remaining mockup data with Medusa (products, cart, checkout) and Payload (content, guidance); fix build/runtime and UI touch-ups.

**Workspace:** apps/storefront

**Status:** backlog

**Tags:** storefront, design, cms, commerce

**Milestone:** M6

**Dependencies:** t6.5, t6.6, t6.7

**Acceptance:**
- No mock product/copy where live data exists; build green; key flows have required states (loading/empty/error).

**Estimate:** M

## M7 — Backend-optimering: Payload CMS + Medusa alignment

## Task: t7.1

**Description:** Diagnostiker og fix Payload-opstart: fejl ved åbning af admin (DB, migrations, env).

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, backend, infrastructure

**Milestone:** M7

**Acceptance:**
- Payload dev-server starter; admin kan åbnes uden runtime-fejl.
- DATABASE_URL og schema `payload` dokumenteret/verificeret; migrations-mappe og migreringsstatus klar.

**Estimate:** M

**Notes:** Fixes: root layout (ingen nested html/body); (site)-gruppe til public pages; `@payloadcms/next/css` + custom.scss; DATABASE_URL-check + env.template; migrations-mappe + payload CLI scripts; PAYLOAD_SECRET build-placeholder; @payloadcms/ui direkte dependency. Verificeret mod Supabase (schema payload).

## Task: t7.2

**Description:** Verificer Payload end-to-end: login, opret/rediger Pages, Articles, Media, ProductGuidance; globals (Navigation, Footer, Homepage).

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, backend

**Milestone:** M7

**Dependencies:** t7.1

**Acceptance:**
- Redaktør kan logge ind og oprette/redigere indhold i alle relevante collections og globals; data persisteres korrekt i Supabase (schema payload).

**Estimate:** M

**Notes:** E2E-checkliste i `work/backlog/t7.2-log.md` (login, 5 collections, 3 globals, persistence). Schema `payload` verificeret via Supabase MCP; config matcher. Manuel gennemgang af checklisten anbefales når CMS kører lokalt.

## Task: t7.3

**Description:** Lokalisation og SEO i CMS: dokumentér behov (da/en, meta, structured data) og tilføj/udvid felter eller struktur i Payload efter behov (ingen storefront-ændringer).

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, seo

**Milestone:** M7

**Acceptance:**
- Krav til i18n og SEO i CMS er skrevet ned; evt. nye felter/globals tilføjet i Payload så content er klar til da/en og SEO.

**Estimate:** M

**Notes:** Krav dokumenteret i `apps/cms/docs/i18n-seo-requirements.md` (i18n da/en, SEO meta + structured data). Articles: tilføjet `meta.image` (upload) for social/OG og Article structured data.

## Task: t7.4

**Description:** Research Payload CMS v3-plugins: i18n, SEO, storage (Supabase S3), andre relevante. Dokumentér anbefaling til MVP.

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, research

**Milestone:** M7

**Acceptance:**
- Kort rapport eller note: hvilke plugins anbefales, hvad de løser, og om de skal aktiveres i M7 eller senere.

**Estimate:** S

**Notes:** Rapport i `apps/cms/docs/payload-plugins-research.md`: SEO-plugin (M7 eller kort efter), Localization built-in (når da/en), storage-s3/Supabase (når media i Supabase; dep allerede).

## Task: t7.5

**Description:** Medusa: opret korrekte product_type (cleanser, toner, serum, moisturizer, SPF, eye cream, face mask); ret kategorier (rank/hierarki); opret product_tag (skin types + concerns) og knyt til produkter.

**Workspace:** apps/commerce

**Status:** done

**Tags:** commerce, backend

**Milestone:** M7

**Dependencies:** t7.1, t7.2

**Acceptance:**
- product_type bruges til produktart; kategorier har entydig rank; tags findes og er knyttet til produkter via product_tags.

**Estimate:** M

## Task: t7.6

**Description:** Medusa: indfør brand og primary-tags (product.metadata: brand, primary_skin_type, primary_concern); beslut og evt. implementer brand via metadata eller product_collection.

**Workspace:** apps/commerce

**Status:** done

**Tags:** commerce, backend

**Milestone:** M7

**Dependencies:** t7.5

**Acceptance:**
- Alle produkter har konsistent metadata for brand og (hvor relevant) primary skin type/concern; beslutning dokumenteret.

**Estimate:** M

## Task: t7.7

**Description:** Dokumentér CMS–Commerce-synergy: canonical nøgle (product.handle), hvad der bor i Payload vs Medusa, og hvordan storefront senere henter data. Opdater evt. eksisterende research-doc eller spec.

**Workspace:** .

**Status:** done

**Tags:** documentation, cms, commerce

**Milestone:** M7

**Dependencies:** t7.5, t7.6

**Acceptance:**
- En kort, præcis dokumentation findes (i repo eller spec) så udviklere ved, hvordan Payload og Medusa hænger sammen og hvad der skal trackes.

**Estimate:** S

## Task: t7.8

**Description:** Env + CMS API-ruter: MEDUSA_STORE_URL i env.template; Next.js API routes /api/medusa/products, /api/medusa/categories, /api/medusa/product-types, /api/medusa/brands der kalder Medusa Store API og returnerer forenklede lister til admin dropdowns. Fejlhåndtering: tom array ved fejl.

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, backend, infrastructure

**Milestone:** M7

**Acceptance:**
- MEDUSA_STORE_URL dokumenteret i env.template.
- GET /api/medusa/products, /categories, /product-types, /brands returnerer forventet format; kort cache OK.

**Estimate:** M

**Notes:** Env i apps/cms/env.template. Proxy: apps/cms/src/lib/medusa.ts (5 min cache). API-ruter: apps/cms/src/app/api/medusa/products, categories, product-types, brands. Tomme arrays ved fejl. Linear: GUA-63.

## Task: t7.9

**Description:** Commerce: GET /store/brands endpoint der returnerer { brands: string[] } (distinct product.metadata.brand).

**Workspace:** apps/commerce

**Status:** done

**Tags:** commerce, backend

**Milestone:** M7

**Acceptance:**
- GET /store/brands returnerer brands-array; CMS proxy kan bruge det.

**Estimate:** S

**Notes:** apps/commerce/src/api/store/brands/route.ts (GET). Returnerer { brands: string[] } fra distinct product.metadata.brand. Linear: GUA-60.

## Task: t7.10

**Description:** Products-collection (handle fra Medusa) + Ingredients, Routines, Beneficials collections. Products har relationships til Ingredients, Routines, Beneficials; how-to, routineTime, pair-with (til andre Products), precautions. ProductGuidance beholdes; ny indhold anbefales via Products.

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, backend

**Milestone:** M7

**Dependencies:** t7.8

**Acceptance:**
- Collections Products, Ingredients, Routines, Beneficials findes; Products har alle planlagte felter og relationships.
- Payload build kører.

**Estimate:** L

**Notes:** Ingredients, Routines, Beneficials, Products collections i apps/cms/src/collections/; Products med handle, title, howTo, routineTime, pairWithRecommended/Avoid, precautions, relationships til Ingredients/Routines/Beneficials. Alle i payload.config.ts. ProductGuidance beholdt. Linear: GUA-61.

## Task: t7.11

**Description:** Categories- og Brands-collections: handle/brandKey (fra Medusa) + CMS-felter (hero, SEO, body). Registreret i payload.config.

**Workspace:** apps/cms

**Status:** done

**Tags:** cms, backend

**Milestone:** M7

**Acceptance:**
- Categories og Brands collections findes; redaktør kan oprette dokumenter med handle/brandKey.

**Estimate:** M

**Notes:** Categories.ts (handle + CMS-felter), Brands.ts (brandKey + CMS-felter) i apps/cms/src/collections/; begge i payload.config.ts. Linear: GUA-62.

## Task: t7.12

**Description:** Homepage: featured products (relationship til Products + fallback productHandles), categories section (relationship til Category pr. item), testimonials (product relationship + productHandle fallback), brands banner (relationship til Brand pr. item). Ingen storefront-ændringer.

**Workspace:** apps/cms

**Status:** done

**Tags:** cms

**Milestone:** M7

**Dependencies:** t7.10, t7.11

**Acceptance:**
- Homepage globals har relationship-felter til Products, Categories, Brands hvor planlagt; bagudkompatibilitet med handles/tekst hvor relevant.

**Estimate:** M

**Notes:** Homepage.ts: featured-products (products + productHandles), categories (category), testimonials (product + productHandle), brands-banner (brand + fallback). Kun CMS; ingen storefront-ændringer. Linear: GUA-59.

## Task: t7.13

**Description:** Dokumentation: opdater spec/10-cms-commerce-synergy.md (resolved/follow-ups, references); tilføj apps/cms/docs/medusa-proxy.md; opdater work/backlog/tasks.local.md med t7.8–t7.13.

**Workspace:** .

**Status:** done

**Tags:** documentation, cms, commerce

**Milestone:** M7

**Acceptance:**
- spec/10 opdateret; medusa-proxy.md beskriver env og API-ruter; tasks.local.md indeholder nye M7-tasks.

**Estimate:** S

**Notes:** spec/10-cms-commerce-synergy.md sektion 5 (Resolved/follow-ups). apps/cms/docs/medusa-proxy.md (env, ruter, cache). tasks.local.md med t7.8–t7.13. Linear: GUA-58.
