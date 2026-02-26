# Guapo — Early Risks

This document lists risks that are already visible at the /spec/init stage. It is intentionally lightweight and will evolve.

## Product & scope risks
- **MVP scope is large**: Catalog + CMS + SEO + accounts + reviews + subscriptions + payments/shipping is a lot for a 1–2 month launch window.
- **Positioning tension**: “Competitive pricing” vs “premium brands” can compress margins and create confusing perception if not communicated clearly.
- **Curation quality risk**: Guidance (skin type, ingredients, routines) must be accurate and consistent, or it can hurt trust and conversion.

## Commerce & subscription risks
- **Recurring billing complexity**: Product subscriptions require recurring billing; payment provider capabilities, compliance, retries, and cancellation flows can be non-trivial.
- **Subscription policy ambiguity**: Discount model, minimum commitment, pausing/skipping, and cancellation rules can create customer support load if unclear.

## Supplier / catalog risks
- **Qogita dependency uncertainty**: API access, data model quality (stock/pricing), and operational fit are unknown until investigated.
- **Stock accuracy**: Even with own-stock fulfillment, inventory accuracy is critical (overselling/underselling impacts trust).

## SEO & content risks
- **SEO “basics” are not trivial**: Metadata, canonical strategy, sitemaps, indexation, and content quality require consistent rules, not ad-hoc pages.
- **Content operations**: Blog/articles and SEO fields add an editorial workflow burden (who writes, reviews, and maintains it?).

## Operational risks
- **Fulfillment operations**: Own-stock shipping requires packing, carrier integration, returns handling, and customer support processes from day one.
- **Customer support load**: Subscriptions + product guidance can increase inbound questions; MVP support tooling must be sufficient even if “lightweight”.
- **Shipping integration**: Even with Shipmondo, carrier selection, service levels, and label/return workflows must be configured correctly to avoid operational friction at launch.
- **Multi-service deployment complexity**: Railway project with multiple services (storefront, Medusa server, Medusa worker, Payload, Redis) increases operational coordination (env vars, networking, deploy order).
- **Redis dependency risk**: Medusa relies on Redis-backed capabilities in production; misconfiguration can break background jobs, eventing, or workflows.
- **Shared Postgres schema separation risk**: Running Medusa + Payload on the same Supabase Postgres instance requires careful schema separation; schema misconfig can cause migration failures or cross-service coupling.
- **Payload admin stability**: Errors when opening or running Payload admin can block CMS work until DATABASE_URL, schema `payload`, and migrations are validated; M7 task t7.1 addresses this.
- **Media storage risk**: Using Supabase Storage requires correct bucket policies/URLs; misconfig can cause broken images or accidental exposure.
- **Observability gaps**: Without Sentry + alerting, payment/subscription issues can go unnoticed and hurt revenue and trust.

## Delivery risks
- **Time-to-market**: 1–2 months leaves limited slack for unknowns (Stripe subscription setup, CMS modeling, SEO rules, Qogita investigation).
- **Integration surface area**: Multiple systems (commerce backend + CMS + payment provider) increases integration failure modes early.
- **Figma export code quality**: Figma-generated code often has redundancy, weak modularization, and hardcoded values. Mitigation: dedicated refactoring toward `spec/07-design-system.md` (tokens, component rules) and reuse of existing storefront data flows (Medusa/CMS).

## Auth, payment & shipping risks (M8, M9, M10)
- **Google OAuth credentials**: Google Cloud Console setup required; callback URL must match deployed storefront URL (staging/production).
- **Stripe DK payment methods**: MobilePay via Stripe requires separate setup/approval; Klarna via Stripe is available but must be enabled. Card payments are primary for MVP.
- **Shipmondo API availability**: Custom fulfillment provider requires robust error handling; parcel-shop data can be unstable or rate-limited.
- **Payment provider change (Adyen → Stripe)**: Subscription recurring billing and method availability (MobilePay, Klarna) differ; Stripe subscription lifecycle vs Medusa-managed subscriptions must be aligned.