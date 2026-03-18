# Plunk email (Next API)

Transactional emails via [Plunk](https://useplunk.com/) using the **Next API** ([docs](https://next-wiki.useplunk.com/)).

## Setup

1. **Plunk project**  
   Opret projekt på [useplunk.com](https://useplunk.com/) og hent **Secret key** (sk_*) under API Keys.

2. **Domain**  
   Verificér afsender-domain i Plunk (Verifying domains), så `PLUNK_FROM_EMAIL` bruger det verified domain.

3. **Env** (i `.env` eller Railway Variables):

   | Variable            | Beskrivelse                                      |
   |--------------------|---------------------------------------------------|
   | `PLUNK_SECRET_KEY` | Secret key (sk_*) – påkrævet for at sende.       |
   | `PLUNK_FROM_EMAIL`| Afsender-email (skal være verified domain).      |
   | `PLUNK_FROM_NAME` | Valgfri afsendernavn (fx Guapo).                 |
   | `PLUNK_STORE_NAME`| Valgfri butiksnavn i invite-mails (default: Guapo). |

## Hvad der er implementeret

- **Invite emails**  
  Når en admin inviterer en bruger (Settings → Users → Invite), sendes en mail med invite-link via **Plunk Next API** (`POST https://next-api.useplunk.com/v1/send`).  
  Subscriber: `src/subscribers/invite-email.ts` (events: `invite.created`, `invite.resent`).  
  Klient: `src/lib/plunk.ts`.

## Fejlfinding: "Ingen mail sendt"

- **HTTP 200 på resend** betyder kun, at Medusa modtog anmodningen – ikke at Plunk sendte mailen.
- Tjek **Railway → server → Deploy logs / Application logs** (ikke kun HTTP Logs). Søg efter:
  - `[Plunk] PLUNK_SECRET_KEY not set` → sæt **PLUNK_SECRET_KEY** (sk_*) i Railway Variables.
  - `[invite-email] Plunk send failed` → se fejldetaljer (fx 401 = forkert key, 422 = from mangler eller ugyldig).
  - `[invite-email] Invite email sent to ...` → mailen blev sendt til Plunk.
- På Railway skal **server**-service have: **PLUNK_SECRET_KEY** og **PLUNK_FROM_EMAIL** (verificeret domain i Plunk). Redeploy efter ændring af Variables.

## MVP transactional email matrix

Events and suggested Plunk template names. Implement by adding subscribers or workflow steps that call `sendPlunkEmail()` from `src/lib/plunk.ts`.

| Trigger (source) | Template name | Recipient | Notes |
|------------------|---------------|-----------|--------|
| Order placed (order.placed) | `order_confirmation` | Customer email | Include order id, total, link to account/orders |
| Subscription created (after order.placed + subscription created) | `subscription_created` | Customer email | Cycle, discount, next renewal date |
| 3 days before renewal (subscription-renewal job / scheduler) | `renewal_reminder_3_days` | Customer email | Next charge date, amount, link to manage subscription |
| Payment retry #1 failed (subscription-retry job) | `payment_failed_retry_1` | Customer email | Ask to update payment method |
| Payment retries exhausted, subscription on hold | `payment_failed_final_on_hold` | Customer email | Subscription on hold, update payment to resume |
| Payment recovered after retry | `payment_recovered` | Customer email | Subscription active again |
| Customer pauses subscription (POST pause) | `subscription_paused` | Customer email | Optional; confirm pause and next steps |
| Customer resumes subscription (POST resume) | `subscription_resumed` | Customer email | Optional; confirm resume |
| Customer cancels subscription (POST cancel) | `subscription_cancelled` | Customer email | Confirm cancellation, last delivery if any |
| Fulfillment created / tracking available | `shipment_tracking_available` | Customer email | Tracking URL and number |

Implementation order (recommended): `order_confirmation` → `subscription_created` → `renewal_reminder_3_days` → `payment_failed_*` / `payment_recovered` → `subscription_paused` / `resumed` / `cancelled` → `shipment_tracking_available`.

## Fremtidige mails

- Order confirmation, subscription reminders m.m. kan tilføjes via flere subscribers eller workflows der kalder `sendPlunkEmail()` fra `src/lib/plunk.ts`.
- Se tabellen ovenfor for den fulde MVP-liste og template-navne.
