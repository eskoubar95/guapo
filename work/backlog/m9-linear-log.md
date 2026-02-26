# M9 — Linear sync log

Status og Linear-mapping for tasks under M9 (Stripe Payments + Subscription).

## Linear issues (oprettes før batch)

| Task  | Linear ID | Status | Beskrivelse |
|-------|-----------|--------|-------------|
| t9.1  | GUA-87    | Todo   | Stripe Payment Module + env |
| t9.2  | GUA-88    | Backlog| Stripe i Denmark-regionen |
| t9.3  | GUA-89    | Backlog| PaymentElement i checkout |
| t9.4  | GUA-90    | Backlog| Webhook endpoint |
| t9.5  | GUA-91    | Backlog| E2E test staging |
| t9.6  | GUA-92    | Backlog| Spec Adyen → Stripe |
| t9.7  | GUA-93    | Backlog| Recurring/mandate subscription-checkout |
| t9.8  | GUA-94    | Backlog| Renewal charge + webhook/cron |
| t9.9  | GUA-95    | Backlog| Staging gate renewal simulation |

Tilføj **Notes: Linear: GUA-xxx** i `work/backlog/tasks.local.md` for hver task når Linear-issues er oprettet.

## Scheduler (9 tasks)

Efter tilføjelse af t9.7–t9.9: `node .cursor/scripts/sdd-scheduler.cjs M9` — køreplan med 9 tasks.
