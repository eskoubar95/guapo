# Guapo — Open Questions

These items must be clarified to reduce risk before /spec/plan and implementation. Keep answers short and decisive.

## Staging / launch acceptance gates (not blockers for /spec/plan)

- **Subscriptions compliance (DK)**: confirm any specific consumer law requirements for subscriptions in Denmark (copy, cancellation rights, renewal notices) before launch.
- **Stripe recurring capabilities**: confirm tokenization/mandates + at least one successful renewal simulation in staging.
- **Stripe method availability**: confirm MobilePay, Klarna, and wallets are enabled and functional in DK when enabled in Stripe (staging).
- **DB schema separation validation**: validate Medusa + Payload can migrate and run in Supabase with schema separation (fallback: separate DB).

## Sprint 1 research gate (not a blocker)

- **Qogita**: create a Sprint 1 research issue.
  - Deadline: end of Sprint 1.
  - Output: confirm API access + endpoint list + recommended scope (import products/pricing/stock) + effort/risks, plus a mini integration plan (dataflow + sync model + decision recommendation).