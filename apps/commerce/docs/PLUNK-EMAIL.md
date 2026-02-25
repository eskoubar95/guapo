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

## Fremtidige mails

- Order confirmation, subscription reminders m.m. kan tilføjes via flere subscribers eller workflows der kalder `sendPlunkEmail()` fra `src/lib/plunk.ts`.
