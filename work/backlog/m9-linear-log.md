# M9 — Linear sync log

Status og Linear-mapping for tasks under M9 (Stripe Payments + Subscription).

## Linear issues (oprettes før batch)

| Task  | Linear ID | Status | Beskrivelse |
|-------|-----------|--------|-------------|
| t9.1  |           |        | Stripe Payment Module + env |
| t9.2  |           |        | Stripe i Denmark-regionen |
| t9.3  |           |        | PaymentElement i checkout |
| t9.4  |           |        | Webhook endpoint |
| t9.5  |           |        | E2E test staging |
| t9.6  |           |        | Spec Adyen → Stripe |
| t9.7  |           |        | Recurring/mandate subscription-checkout |
| t9.8  |           |        | Renewal charge + webhook/cron |
| t9.9  |           |        | Staging gate renewal simulation |

Tilføj **Notes: Linear: GUA-xxx** i `work/backlog/tasks.local.md` for hver task når Linear-issues er oprettet.

## Scheduler (9 tasks)

Efter tilføjelse af t9.7–t9.9: `node .cursor/scripts/sdd-scheduler.cjs M9` — køreplan med 9 tasks.
