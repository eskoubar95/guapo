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
   | `GUAPO_EMAIL_ASSET_BASE` | Valgfri base-URL til hero/logo i HTML-mails (samme som nyhedsbrev). Default: Supabase `newsletter`-mappe. |

HTML-skallen (Inter/Lexend, farver, hero-baggrund, logo, navy footer) ligger i `src/lib/transactional-email/email-layout.ts` og bruges af invite + `order_confirmation` + `subscription_created`.

## Hvad der er implementeret

- **Invite emails**  
  Når en admin inviterer en bruger (Settings → Users → Invite), sendes en mail med invite-link via **Plunk Next API** (`POST https://next-api.useplunk.com/v1/send`).  
  Subscriber: `src/subscribers/invite-email.ts` (events: `invite.created`, `invite.resent`).  
  Klient: `src/lib/plunk.ts` + samme visuelle skal som nyhedsbrev (`email-layout.ts`).
- **Order placed transactional baseline (M11)**  
  Ved `order.placed` opretter subscriber `src/subscribers/order-placed-transactional-documents.ts`:
  - `order_confirmation` mail (locale-aware `da`/`en`): HTML uden PDF-downloadlinks; **faktura vedhæftet** som PDF via Plunk `attachments` (gæster uden login). CTA til storefront ordrestatus.
  - `subscription_created` mail når ordre har subscription-linje
  - Ordrebekræftelse-PDF + faktura-PDF gemmes i `order.metadata.documents.*`:
    - **Kunde (logget ind):** `GET /store/orders/:id/documents/order-confirmation` og `.../invoice` (auth + ownership, rate-limited).
    - **Admin:** `GET /admin/orders/:id/documents/order-confirmation` og `.../invoice` (session/bearer/api-key). Widget på ordredetalje: `src/admin/widgets/order-documents.tsx` (zone `order.details.side.after`).
- **Abonnement + fornyelse + forsendelse (M11)**  
  Central dispatch: `src/lib/transactional-email/service.ts` (`sendTransactionalEmail`) med idempotency-keys og HTML fra `lifecycle-email-templates.ts` / `email-layout.ts`.
  - `renewal_reminder_3_days` — job `src/jobs/subscription-renewal-reminder.ts` (cron); metadata `renewal_reminder_sent_for` på subscription.
  - `payment_failed_retry_1`, `payment_failed_final_on_hold`, `payment_recovered` — `src/lib/transactional-email/subscription-renewal-notifications.ts` kaldt fra `src/workflows/steps/run-subscription-renewal.ts`.
  - `subscription_paused` / `subscription_resumed` / `subscription_cancelled` — `sendSubscriptionLifecycleMail` efter succes på store- og admin-routes under `src/api/store/subscriptions/[id]/{pause,resume,cancel}` og `src/api/admin/subscriptions/[id]/{pause,resume,cancel}`.
  - `shipment_tracking_available` — `sendFulfillmentTrackingEmailIfReady` (`src/lib/transactional-email/send-fulfillment-tracking-email.ts`); subscribers `order-fulfillment-tracking-email.ts` (`order.fulfillment_created`, respekterer `no_notification`) og `order-shipment-tracking-email.ts` (`shipment.created`) så tracking ofte fanges når labels først kommer ved shipment. Ordre-metadata `guapo_tracking_email_fulfillment_id` forhindrer dubletter.

## Fejlfinding: "Ingen mail sendt"

- **HTTP 200 på resend** betyder kun, at Medusa modtog anmodningen – ikke at Plunk sendte mailen.
- Tjek **Railway → server og worker → Application logs** (ikke kun HTTP Logs). `order.placed`-subscriber (PDF + mail) kører på **worker** i production. Søg efter:
  - `[Plunk] PLUNK_SECRET_KEY not set` → sæt **PLUNK_SECRET_KEY** (sk_*) i Railway Variables.
  - `[transactional-email] Failed` / `[Plunk] send failed` → vedhæftninger eller afsender (422).
  - `[invite-email] Plunk send failed` → se fejldetaljer (fx 401 = forkert key, 422 = from mangler eller ugyldig).
  - `[invite-email] Invite email sent to ...` → mailen blev sendt til Plunk.
- På Railway skal **server** og **worker** have: **PLUNK_SECRET_KEY** og **PLUNK_FROM_EMAIL** (verificeret domain i Plunk). Redeploy efter ændring af Variables.

## MVP transactional email matrix

Events and suggested Plunk template names. Implement by adding subscribers or workflow steps that call `sendPlunkEmail()` from `src/lib/plunk.ts`.

| Trigger (source) | Template name | Recipient | Notes |
|------------------|---------------|-----------|--------|
| Order placed (order.placed) | `order_confirmation` | Customer email | HTML + invoice PDF attachment; storefront link; no Plunk `template` slug (inline HTML only) |
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

## Sikkerhed for transactional flow

- `PLUNK_SECRET_KEY` må kun ligge i server-miljø (Railway variables), aldrig i client kode.
- Brug verified sender domain for `PLUNK_FROM_EMAIL` (SPF/DKIM/DMARC).
- Ordrebekræftelsesmailen vedhæfter faktura-PDF (modtageren kan gemme filen). Kunder med login kan stadig hente PDF via auth-beskyttede store-routes; admin via `/admin/orders/:id/documents/*`. Ingen offentlige download-URL’er uden auth.
- Rate-limit for dokumentdownloads styres via:
  - `ORDER_DOCUMENTS_RATE_LIMIT_MAX` (default `40` per minut per IP)
  - `ORDER_DOCUMENTS_RATE_LIMIT_DISABLED=true` (kun til lokal fejlsøgning)
- Idempotency/retry guard: subscriber markerer sendt-status i `order.metadata.transactional.*` for at undgå dubletter ved event-replays.

## Fremtidige mails

- Order confirmation, subscription reminders m.m. kan tilføjes via flere subscribers eller workflows der kalder `sendPlunkEmail()` fra `src/lib/plunk.ts`.
- Se tabellen ovenfor for den fulde MVP-liste og template-navne.
