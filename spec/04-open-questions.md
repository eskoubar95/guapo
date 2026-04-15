# Guapo — Open Questions

These items must be clarified to reduce risk before /spec/plan and implementation. Keep answers short and decisive.

## Staging / launch acceptance gates — **resolved** (2026-04-13)

Team verification: DK subscription copy and policies (storefront via CMS; transactional emails reviewed in commerce code), Stripe recurring and payment methods exercised in staging, Medusa + Payload on Supabase with schema separation confirmed.

- **Subscriptions compliance (DK)** — reviewed (cancellation, renewal notices, disclosures as implemented).
- **Stripe recurring capabilities** — tokenization/mandates + at least one successful renewal simulation in staging.
- **Stripe method availability** — intended DK methods (incl. MobilePay/Klarna/wallets as enabled) verified in staging.
- **DB schema separation validation** — Medusa + Payload migrations/runbook validated on Supabase (schemas separated; fallback to separate DB not required).

## Sprint 1 research gate (not a blocker)

- **Qogita**: create a Sprint 1 research issue.
  - Deadline: end of Sprint 1.
  - Output: confirm API access + endpoint list + recommended scope (import products/pricing/stock) + effort/risks, plus a mini integration plan (dataflow + sync model + decision recommendation).
