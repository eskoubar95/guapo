# Acceptance Criteria / Ship Checklist

This document defines what “done” means for the **MVP**.
Use it as the project’s **ship gate** during planning and validation.

## MVP definition (1–5 bullets)
- A Denmark-first Guapo storefront is live with **/da** and **/en** URLs and core face skincare catalog.
- Customers can complete purchases with Stripe (cards, Apple Pay, Google Pay, MobilePay, Klarna when enabled).
- Product subscriptions are live (cycles 4/8/12, 5% discount) with skip/pause/resume/cancel (cancel gated by 2 deliveries).
- CMS-driven content + SEO foundations are live (pages/blog/landing/homepage builder + structured data).
- Consent-aware analytics + marketing tracking is live (PostHog + Meta/Google Ads behind consent).

## Success criteria (measurable if possible)
- Primary early success signal (first 60–90 days): **10 orders/week**
  - Definition: calendar week (Mon–Sun)
  - Source of truth: Medusa orders

## Scope boundaries

### In scope (MVP)
- Catalog + search/filters + PDP
- Guidance + routines (3-step baseline + optional 5-step variant)
- Cart + checkout + order confirmation
- Guest checkout + accounts (order history)
- Reviews + FAQ + contact/support entry point
- Subscriptions (cycles/discount/commitment + notifications + retries + returns/refunds behavior)
- CMS (Payload): pages, blog, landing pages, homepage builder, nav/footer links, PDP guidance fields
- SEO: required fields, structured data schemas, i18n routing, single sitemap, canonical strategy
- Shipping via Shipmondo (parcel shop only) + returns policy
- Transactional emails via Plunk

### Out of scope (MVP)
- Private label / own manufactured products
- Physical retail
- Multi-vendor marketplace
- International expansion beyond Denmark
- Membership club with points/loyalty perks
- Advanced personalization/AI recommendations

### Future ideas / Roadmap (park here)
- Membership club + loyalty/points
- Category expansion beyond face skincare
- Qogita API integration (after investigation)
- Advanced subscription features (bundles/rules beyond MVP)
- Self-serve returns portal

## Non-functional requirements (MVP)
- **Performance**: Core pages (home/PLP/PDP/checkout) feel fast; no obvious layout shift; basic web vitals monitoring TBD.
- **Reliability**: Payment failures are handled gracefully; subscription retry/on-hold states are clear.
- **Security**: No secrets in git; payment handled via Stripe; basic rate limiting and input validation where applicable.
- **Accessibility**: WCAG AA target; keyboard flows must work. Focus indicator uses **active borders** (no focus rings).
- **Privacy/Compliance**: Consent banner with necessary/analytics/marketing; PostHog behind analytics consent; pixels behind marketing consent.

## Quality gates (must pass to ship MVP)
- [ ] Core journeys verified end-to-end:
  - [ ] Browse → PDP → add to cart → checkout → order confirmation
  - [ ] Subscription purchase → account shows subscription → skip/pause/resume → cancel after commitment
- [ ] Payment methods validated in staging at least once: cards + one wallet + one alt method (MobilePay/Klarna) (full matrix can follow post-launch)
- [ ] Stripe subscription recurring is validated in staging (tokenization/mandates + at least one successful renewal simulation)
- [ ] Supabase schema separation is validated in staging (Medusa + Payload migrations run cleanly). Fallback: separate DB if needed.
- [ ] Subscription compliance (DK) reviewed and copy/policies updated (renewal notices, cancellation rights, required disclosures).
- [ ] Email deliverability basics configured (SPF/DKIM/DMARC) and key emails render correctly
- [ ] Consent gating works (no analytics/pixels before consent; correct behavior after)
- [ ] Error/empty/loading states implemented for primary flows (search empty, cart empty, checkout errors, payment failed, subscription on hold)
- [ ] **M11 Storefront–CMS synergi:** Forside hentes fra CMS (Payload Homepage global); menu (og evt. footer) fra CMS; blog list + artikel fra Payload; søgning viser produkter fra Medusa med loading/empty states; auth-feedback (toast/returnUrl) ved beskyttede routes; toast-system til brugerbeskeder; sitemap-sider gennemgået (design-tokens, states, data-kilde).
- [ ] SEO checks:
  - [ ] structured data present on PDP/blog/FAQ where applicable
  - [ ] sitemap present
  - [ ] canonical rules implemented for filter/search pages
  - [ ] hreflang strategy implemented for `/da` and `/en` (details TBD)
- [ ] Shipping label workflow works via Shipmondo; parcel shop option available
- [ ] Returns/refunds workflow supports partial refunds; opened-products rule documented
- [ ] CI checks passing (lint/typecheck/tests/build as applicable)
- [ ] Deployment process documented and repeatable (preview + production)

## Test plan (MVP)

### Manual smoke tests
- Consent banner: accept/deny analytics + marketing; verify scripts behavior
- Product discovery: category browse + search + filters
- PDP: guidance content present; subscription selector shows 4/8/12 + 5% discount
- Checkout: guest checkout; payment success; order confirmation email received
- Subscription:
  - create subscription
  - simulate payment failed → retry → on-hold
  - update payment method → recovered
  - skip next delivery; pause; resume; cancel after 2 deliveries
- Returns/refunds: partial refund workflow; subscription auto-pauses after refund/return event

### Automated tests
- Unit: TBD
- Integration: TBD
- E2E: TBD (recommended for core purchase + subscription flows)

## Release plan (MVP)
- **Rollout**: full rollout (Denmark-first)
- **Rollback**: ability to rollback frontend deployment; plan for disabling subscription purchases if needed (feature flag TBD)
- **Monitoring**: PostHog funnels for product_view → add_to_cart → begin_checkout → purchase; subscription events tracked
- **Support**: define on-call/response owner (TBD) and support workflow (email/contact form)

