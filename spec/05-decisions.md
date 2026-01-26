# Guapo — Decisions

This log captures **actual decisions** made during specification and delivery. Keep entries short and unambiguous.

## 2026-01-26 — Focus indicator (no focus rings)
- **Decision**: Do not use focus rings. Use a clear **active/focus border** as the focus indicator (especially on inputs).
- **Why**: Visual preference for a cleaner, less “glowy” UI.
- **Consequences**: Ensure keyboard accessibility remains strong (contrast + consistent border focus style).
- **Where**: `spec/07-design-system.md`

## 2026-01-26 — Subscription controls required in MVP
- **Decision**: MVP subscriptions must support **skip next delivery**, **pause**, and **cancel**.
- **Why**: Subscription UX should feel flexible and reduce friction/support burden.
- **Consequences**: Increased implementation complexity for recurring billing + scheduling; impacts backend + customer account UX.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Subscription cycles, discount, and minimum commitment (MVP)
- **Decision**:
  - Cycles: 4 / 8 / 12 weeks
  - Discount: 5% on subscription deliveries (all renewals)
  - Minimum commitment: 2 fulfilled deliveries before cancellation is allowed
- **Why**: Balanced customer value (discount + flexible cadence) while protecting unit economics and reducing “subscribe-then-cancel” abuse.
- **Consequences**: Must implement entitlement logic (cancel gating) while still supporting skip/pause.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Subscription notifications + payment retries (MVP)
- **Decision**:
  - Channel: email only
  - Upcoming renewal reminder: 3 days before
  - Emails sent for: renewal receipt, payment failed, payment recovered, skip/pause/resume/cancel confirmations, and shipping/tracking for subscription orders
  - Payment retry policy: 2 retries over 3 days, then subscription is put on hold until payment method is updated
- **Why**: Reduce support load and churn with clear comms, while keeping MVP scope manageable.
- **Consequences**: Requires solid email deliverability and a simple “update payment method” flow in account.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Subscription returns/refunds handling (MVP)
- **Decision**:
  - Subscription orders follow the same returns policy as one-time orders (14 days; customer pays return label).
  - If a subscription delivery is refunded/returned, the subscription is auto-paused until the customer resumes.
  - Opened products are not returnable (except defective/faulty items).
  - Partial refunds are supported.
- **Why**: Keep customer support predictable and reduce accidental repeat shipments after a return.
- **Consequences**: Must implement a clear “auto-paused due to return/refund” state and comms to resume.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Cookie consent + analytics + marketing pixels (MVP)
- **Decision**:
  - Cookie consent is required in MVP with categories: necessary / analytics / marketing.
  - Analytics platform: PostHog (behind analytics consent).
  - Marketing pixels: Meta + Google Ads (behind marketing consent).
- **Why**: Enable compliant measurement and marketing iteration from day one.
- **Consequences**: Requires a consent manager, consent-aware script loading, and basic UTM/attribution handling.
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Payment methods required in MVP (DK)
- **Decision**: MVP must support cards, Apple Pay, Google Pay, MobilePay, and Klarna (via Adyen).
- **Why**: Reduce checkout friction in Denmark and cover expected payment preferences.
- **Consequences**: Must confirm Adyen configuration/contract supports each method; may impact delivery timeline.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Guest checkout allowed
- **Decision**: Guest checkout is allowed in MVP (account is optional).
- **Why**: Lower friction for first-time buyers.
- **Consequences**: Subscription flows may still require an account for ongoing management (TBD).
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Shipping via Shipmondo (DK)
- **Decision**: Use Shipmondo for shipping in MVP.
- **Why**: One integration layer with access to multiple carriers.
- **Consequences**: Still need to choose which carriers and service levels to enable within Shipmondo.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Shipping options, pricing, and returns (MVP)
- **Decision**: MVP delivery option is parcel shop only. Shipping price policy is flat rate (amount TBD). Returns: 14-day window; customer pays return label.
- **Why**: Keep MVP operationally simple while launching.
- **Consequences**: Must set clear customer expectations and ensure support flow covers returns and subscription edge cases.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — CMS scope includes homepage composition
- **Decision**: Payload CMS will manage static pages, blog/articles, landing pages, navigation/footer links, PDP guidance fields, and homepage composition (reorderable sections/components).
- **Why**: Enable fast iteration on content and merchandising without deployments.
- **Consequences**: Requires a clear homepage component model and content governance to avoid inconsistent UX.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Homepage page builder (predefined section library)
- **Decision**: Implement a homepage page builder in Payload using **predefined section types** (component library). Editors can reorder sections and edit per-section fields (title/content/selection).
- **Why**: Balance flexibility (reordering and fast merchandising) with control (consistent UX and fewer “free-form” surprises).
- **Consequences**: Need to define each section schema clearly and decide which blocks are manual vs automatically populated.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Homepage dynamic blocks rules (MVP)
- **Decision**:
  - Max homepage sections: 10
  - Best sellers: auto (top sold over last 30 days)
  - New arrivals: hybrid (auto default + manual override)
  - Routine block: simple rules (e.g., per skin type) in MVP
- **Why**: Keep merchandising flexible while keeping MVP implementation manageable.
- **Consequences**: Need to define exact rule scope and ensure deterministic, cache-friendly queries.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Curation: skin types + manual product tagging (MVP)
- **Decision**:
  - MVP supports skin types: dry, oily, combination, normal, sensitive
  - Product tagging for skin type/concern is manual/editorial (no auto-tagging in MVP)
- **Why**: Keep guidance accurate and controllable at launch.
- **Consequences**: Requires editorial workflow to tag products consistently.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Curation: concerns + routine templates (MVP)
- **Decision**:
  - Concerns supported (MVP): acne, dryness, sensitivity/irritation, redness, hyperpigmentation, dullness/glow
  - Routine templates (MVP): both skin-type routines and concern routines (simple templates)
  - Steps strategy (MVP): 3-step baseline + 5-step variant (K-beauty) via optional add-on steps
- **Why**: Provide clear guidance options while keeping the model simple and explainable.
- **Consequences**: Requires consistent editorial tagging and deterministic selection rules for templates/products.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Tagging model: primary + secondary (MVP)
- **Decision**:
  - Each product has 0–1 **primary** skin type and 0–1 **primary** concern, plus optional secondary tags.
  - Products may appear in multiple concerns if tagged, but **primary drives sorting** (primary first).
- **Why**: Improves curation quality and keeps UX predictable without complex automation.
- **Consequences**: Requires disciplined editorial tagging to avoid noisy overlaps.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Routine step taxonomy + ordering (MVP)
- **Decision**:
  - Supported routine product types: cleanser, toner (optional), serum, face cream/moisturizer, SPF (AM required), eye cream (optional), face mask (optional weekly).
  - Step order:
    - AM 3-step: cleanser → serum → SPF
    - PM 3-step: cleanser → serum → face cream
    - 5-step: cleanser → toner → serum → eye cream → SPF/face cream (AM/PM)
    - Face mask: 1–2x/week after cleanser (and toner if used), before serum
- **Why**: Keeps routines consistent and easy to explain while supporting a K-beauty “upgrade” path.
- **Consequences**: Requires clear editorial selection rules for how many products to recommend per step.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Routine recommendations per step (MVP)
- **Decision**:
  - Show up to 3 products per step: 1 primary + up to 2 alternatives.
  - Primary recommendation uses primary-tag match (skin-type routine: primary skin type; concern routine: primary concern).
  - Alternatives may use secondary tags, but must remain relevant.
- **Why**: Gives choice without overwhelming users; keeps logic simple and deterministic.
- **Consequences**: Need a clear “conflict” rule and disciplined tagging to prevent noisy recommendations.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Conflicting tag policy (MVP)
- **Decision**: A product is considered **conflicting** for a routine if it does not match the routine context in that dimension:
  - skin-type routine: product does not have the routine skin type as primary or secondary
  - concern routine: product does not have the routine concern as primary or secondary
  Conflicting products must not be shown as alternatives.
- **Why**: Prevent noisy recommendations and keep curation trustworthy.
- **Consequences**: Requires disciplined tagging; “broad” products must be tagged to appear.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — SEO fields + structured data required at launch
- **Decision**: Content pages/blog require meta title/description, OpenGraph, canonical, robots directive, and structured data where applicable. Structured data schemas required at launch: Product, BreadcrumbList, Organization, WebSite+SearchAction, Article, FAQPage.
- **Why**: Ensure strong SEO foundations from day one.
- **Consequences**: Adds implementation and content QA overhead; must define canonical rules for filtered/search pages.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — URL language strategy
- **Decision**: Use language prefixes: `/da/...` and `/en/...`.
- **Why**: Clear SEO and content separation while staying on one domain.
- **Consequences**: Requires consistent hreflang, routing, and sitemap strategy.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Sitemap + canonical policy (MVP)
- **Decision**:
  - Sitemap: single `sitemap.xml` (covering `/da` and `/en` routes as applicable)
  - Canonical: filtered/search pages canonical to base category (do not index filter combinations by default)
- **Why**: Keep SEO foundations strong while minimizing index bloat and complexity in MVP.
- **Consequences**: If we later want to rank for specific filter pages, we must introduce an allowlist strategy.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Transactional email provider (MVP)
- **Decision**: Use Plunk for transactional emails.
- **Why**: Prefer a single platform that can cover both transactional + marketing email needs over time (EU-friendly positioning is a plus).
- **Consequences**: Must configure domain authentication (SPF/DKIM/DMARC), suppression/bounce handling, and consent-aware sending streams (marketing vs transactional).
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Hosting and database topology (MVP)
- **Decision**:
  - Compute hosting: Railway (multi-service project)
  - Database hosting: Supabase Postgres
  - Redis: Railway managed Redis (required for Medusa background jobs/eventing)
  - Medusa runs as separate instances in production: `server` + `worker`
- **Why**: Fits preferred deployment UX (Railway projects), while leveraging Supabase-managed Postgres and a scalable Medusa topology.
- **Consequences**: Multi-service operations (env vars, networking, deploy coordination) become part of MVP readiness.
- **Where**: `spec/02-architecture.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Bootstrapping approach for versions (MVP)
- **Decision**: Bootstrap using official CLIs to avoid manual dependency drift:
  - Medusa: `npx create-medusa-app@latest` and install the Next.js starter storefront, then customize.
  - Payload: `npx create-payload-app` (template TBD), then integrate with the system architecture.
- **Why**: Ensures versions align with upstream expectations; lockfile becomes the single source of truth for exact versions.
- **Consequences**: Exact framework versions are pinned only after scaffold (via lockfile) and should be recorded in repo.
- **Where**: `spec/08-infrastructure.md`

## 2026-01-26 — Schema separation in one Postgres (Supabase)
- **Decision**: Use schema separation when sharing the same Supabase Postgres instance:
  - Payload uses `schemaName=\"payload\"` (adapter-supported).
  - Medusa uses a dedicated schema (e.g., `medusa`) or a dedicated database if schema configuration becomes problematic.
- **Why**: Keeps logical separation and reduces table naming collisions while keeping one Postgres provider.
- **Consequences**: Must validate Medusa’s schema configuration during scaffold; fallback is separate DB.
- **Where**: `spec/08-infrastructure.md`

## 2026-01-26 — Environment strategy (MVP)
- **Decision**: Use staging + production environments (plus local development).
- **Why**: Safely validate Adyen, subscriptions, and shipping integrations before release.
- **Consequences**: Requires separate Railway services/env vars (or separate Railway environments) and separate Supabase projects or schema strategy for staging.
- **Where**: `spec/08-infrastructure.md`, `spec/06-acceptance.md`

## 2026-01-26 — Media storage (Payload uploads)
- **Decision**: Use Supabase Storage for Payload uploads in MVP.
- **Why**: Align with Supabase adoption and avoid relying on ephemeral compute filesystem.
- **Consequences**: Requires storage bucket setup, access policies, and CDN strategy (TBD).
- **Where**: `spec/08-infrastructure.md`

## 2026-01-26 — Shipping carriers and flat rate (MVP)
- **Decision**: Shipmondo carriers enabled in MVP: GLS + DAO. Flat-rate shipping: 39 DKK.
- **Why**: Keep shipping options simple while covering common Danish parcel shop preferences.
- **Consequences**: Carrier/service availability must be configured correctly in Shipmondo.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Adyen risk/3DS and refund operations (MVP)
- **Decision**:
  - 3DS: risk-based (default) to optimize conversion.
  - Refunds: performed by customer support in Medusa admin/backoffice (partial refunds supported).
- **Why**: Balance conversion with fraud control; centralize refund operations for support.
- **Consequences**: Requires reliable admin tooling and clear support rules.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Subscriptions require account (MVP)
- **Decision**: Subscription purchases require an account (one-time purchases may use guest checkout).
- **Why**: Subscription management (skip/pause/resume/cancel) requires authenticated access.
- **Consequences**: Checkout must enforce account creation/login when subscription is in cart.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`, `spec/09-sitemap.md`

## 2026-01-26 — Support SLA (MVP)
- **Decision**: Support via contact form + email response within 48 business hours.
- **Why**: Set clear expectations while keeping operations manageable at launch.
- **Consequences**: Requires support process and copy on-site.
- **Where**: `spec/04-open-questions.md`, `spec/09-sitemap.md`

## 2026-01-26 — Price claim and initial assortment size (MVP)
- **Decision**:
  - Avoid strict “cheapest” pricing claim in MVP; communicate “competitive pricing”.
  - Start with ~20–30 products across 3–5 brands; core routine first + a few add-ons.
- **Why**: Reduce legal/brand risk and keep launch operationally focused.
- **Consequences**: Merchandising must be curated carefully to support routines and key concerns.
- **Where**: `spec/00-root-spec.md`, `spec/04-open-questions.md`

## 2026-01-26 — Qogita research gate (Sprint 1)
- **Decision**: Qogita integration is not a blocker for /spec/plan; it is a Sprint 1 research issue.
  - Deadline: end of Sprint 1.
  - Output: confirm API access + endpoint list + recommended import scope (products/pricing/stock) + effort/risks, plus a mini integration plan (dataflow + sync model + decision recommendation).
- **Why**: De-risk integration without delaying MVP planning.
- **Consequences**: Must allocate research time and define a go/no-go criterion.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Subscription commitment semantics (MVP)
- **Decision**: Pause/skip is allowed before commitment is met, but does not count as deliveries. Cancellation unlocks after 2 fulfilled deliveries.
- **Why**: Keeps the subscription UX flexible while still enforcing a minimum commitment.
- **Consequences**: Must implement a clear “deliveries fulfilled” counter and ensure skip/pause does not increment it.
- **Where**: `spec/04-open-questions.md`, `spec/00-root-spec.md`

## 2026-01-26 — Claims/disclaimer policy (MVP)
- **Decision**: Strict non-medical policy: no medical claims; cosmetic/well-being language only + clear disclaimer (“not medical advice”).
- **Why**: Reduce legal/regulatory risk and keep guidance trustworthy.
- **Consequences**: Requires content review discipline and consistent copy guidelines.
- **Where**: `spec/04-open-questions.md`, `spec/07-design-system.md`

## 2026-01-26 — PDP guidance fields (MVP)
- **Decision**: PDP must include skin types, concerns, routine step, key ingredients + explanations, how to use (AM/PM), good for, cautions/patch test, and editorial “pair with”.
- **Why**: Minimum dataset to deliver curation value without overwhelming content operations.
- **Consequences**: Payload schema must support these fields; editorial workflow must populate them for initial SKUs.
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — CMS workflow and roles (MVP)
- **Decision**: CMS workflow is Draft → Review → Publish. Roles: Admin, Editor, Writer, Support.
- **Why**: Add control and quality for content without heavy process.
- **Consequences**: Requires role-based permissions in Payload.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Reviews policy (MVP)
- **Decision**: On-site reviews only + pre-moderation in MVP.
- **Why**: Reduce spam and reputational risk at launch.
- **Consequences**: Requires moderation UI/process; may reduce review velocity early.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — PostHog event tracking (MVP minimum)
- **Decision**: Track product_view, search, filter_apply, add_to_cart, remove_from_cart, begin_checkout, payment_failed, purchase, subscription_purchase, subscription_pause/skip/cancel, consent_changed.
- **Why**: Enables funnels and operational visibility without over-instrumentation.
- **Consequences**: Requires consistent event naming and consent-aware tracking.
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Observability minimum (MVP)
- **Decision**: Sentry error tracking + alerts, structured logs (request IDs), uptime monitor, alerts for elevated payment failures and subscriptions on hold.
- **Why**: Reduce time-to-diagnose issues in the most revenue-critical flows.
- **Consequences**: Requires configuration in Railway and alert thresholds.
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`, `spec/06-acceptance.md`

## 2026-01-26 — Premium/value messaging (MVP)
- **Decision**: Balanced messaging: curated premium assortment + competitive pricing (without a “cheapest” claim).
- **Why**: Keeps brand trustworthy while still communicating value.
- **Consequences**: Requires consistent copy across homepage/PLP/PDP.
- **Where**: `spec/04-open-questions.md`, `spec/01-prd.md`

## 2026-01-26 — Recommended combinations logic (MVP)
- **Decision**: Hybrid: editorial “pair with” is the default; simple rules provide fallback when editorial data is missing.
- **Why**: Maintains quality while ensuring coverage across the initial SKU set.
- **Consequences**: Requires a clear fallback rule set and avoids “no recommendations” states.
- **Where**: `spec/04-open-questions.md`

## 2026-01-26 — Metric definition for early success (MVP)
- **Decision**: “10 orders/week” is measured as calendar week (Mon–Sun), source of truth = Medusa orders.
- **Why**: Simple shared definition for reporting and review cadence.
- **Consequences**: Requires a single reporting view/dashboard.
- **Where**: `spec/04-open-questions.md`, `spec/06-acceptance.md`

## 2026-01-26 — UTM attribution minimum (MVP)
- **Decision**: Store UTM params in checkout/order metadata (and send as PostHog properties).
- **Why**: Enables marketing attribution while keeping implementation minimal.
- **Consequences**: Requires consent-aware capture and safe storage in order metadata.
- **Where**: `spec/04-open-questions.md`, `spec/08-infrastructure.md`

## 2026-01-26 — Adyen capability checks as staging gate
- **Decision**: Adyen recurring capability confirmation and payment method availability confirmation are treated as **staging acceptance gates**, not /spec/plan blockers.
- **Why**: Allows planning to proceed while still enforcing validation before release.
- **Consequences**: Must be explicitly tested in staging before shipping.
- **Where**: `spec/04-open-questions.md`, `spec/06-acceptance.md`

## 2026-01-26 — Subscription compliance as launch gate (DK)
- **Decision**: Subscription-specific consumer law compliance requirements for Denmark are treated as a launch acceptance gate (not a /spec/plan blocker).
- **Why**: Allows planning to proceed while ensuring we do not ship subscriptions without compliant copy and policies.
- **Consequences**: Must be reviewed and confirmed before launch; update checkout copy + policies accordingly.
- **Where**: `spec/04-open-questions.md`, `spec/06-acceptance.md`

## 2026-01-26 — Content ownership and cadence (MVP)
- **Decision**: Content work (guidance + blog) is owner-driven and handled ad hoc in MVP (no fixed weekly cadence).
- **Why**: Keep operations light while the team validates product/market fit.
- **Consequences**: Risk of content drift; use CMS review workflow to maintain quality.
- **Where**: `spec/04-open-questions.md`, `spec/06-acceptance.md`

## 2026-01-26 — Legal content ownership (MVP)
- **Decision**: Founders draft terms/privacy/cookie policies using templates; legal review can happen after launch unless a blocker emerges.
- **Why**: Avoid delaying launch while still having compliant baseline docs.
- **Consequences**: Must be careful with copy accuracy and align with GDPR/consent implementation.
- **Where**: `spec/09-sitemap.md`, `spec/06-acceptance.md`

## 2026-01-26 — Data retention posture (MVP)
- **Decision**: Retain customer/order data as required for operations and accounting. Retain marketing/tracking data as long as legally permissible under GDPR and consent. Exact retention durations remain TBD but are not blockers for /spec/plan.
- **Why**: Preserve marketing learnings while staying compliant.
- **Consequences**: Requires consent-aware tracking, documented retention policy, and ability to honor deletion/access requests.
- **Where**: `spec/08-infrastructure.md`

## 2026-01-26 — Returns wording for opened products (MVP)
- **Decision**: Policy copy: “Opened products are not returnable (except defective/faulty items).”
- **Why**: Hygiene and customer clarity.
- **Consequences**: Must appear consistently on the returns policy page and in support templates.
- **Where**: `spec/04-open-questions.md`, `spec/09-sitemap.md`

## 2026-01-26 — DB schema separation validation as staging gate
- **Decision**: Validate Medusa + Payload schema separation in Supabase as a staging acceptance gate; fallback is separate DB if schema separation fails.
- **Why**: Reduce early architectural complexity while still preserving an escape hatch.
- **Consequences**: Must be validated before release to avoid migration/runtime failures.
- **Where**: `spec/04-open-questions.md`, `spec/06-acceptance.md`, `spec/08-infrastructure.md`

