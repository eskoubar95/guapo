# Deploy Medusa (commerce) to Railway

Based on lessons from CORE-21 (Medusa server + worker on Railway).

## Services

- **medusa-server:** HTTP API (+ optional admin if build includes `.medusa`). Set `MEDUSA_WORKER_MODE=server` (or leave unset).
- **medusa-worker:** Background jobs. Set `MEDUSA_WORKER_MODE=worker` and `DISABLE_MEDUSA_ADMIN=true`.
- **slack-notify (optional):** Small HTTP service for Slack Block Kit notifications (`apps/slack-notify`). Railway **Root Directory:** `apps/slack-notify`. Build: `pnpm install && pnpm run build`; Start: `pnpm start`. Env: see `apps/slack-notify/env.template`. Medusa **server + worker** need `SLACK_NOTIFY_URL` + `NOTIFY_SHARED_SECRET` (same secret on both Medusa and slack-notify). Replay test: `POST /v1/test/replay` on slack-notify with signed body `{ "kind": "order"|"subscription"|"inventory", "strategy": "latest" }`.

**Medusa server + worker** use the same repo (Root Directory: `apps/commerce`), same build, same start command. Only env vars differ.

## Config (beauty-shop pattern)

- **railway.toml** – server service. Nixpacks, clean `.medusa` then build, healthcheck `/health`, env `MEDUSA_WORKER_MODE=server`.
- **railway-worker.toml** – worker service. Same build; no healthcheck; env `MEDUSA_WORKER_MODE=worker`, `DISABLE_MEDUSA_ADMIN=true`. In Railway, create a second service from the same repo (Root Directory: `apps/commerce`) and set the service’s config file to `railway-worker.toml` if your plan supports a custom config path; otherwise use the same `railway.toml` and set the worker env vars in the dashboard.
- **Dockerfile** – use this for the **server** if you want the **Medusa Admin login page**. Nixpacks often does not include `.medusa` in the image, so with `railway.toml` you get 401 on `/admin` and no login UI. With Dockerfile the image contains the admin build; then set `DISABLE_MEDUSA_ADMIN=false` in Railway.

### Få login-siden frem (ikke bare 401 på /admin)

Hvis du får **401 Unauthorized** på `/admin` og **ingen login-side**, skyldes det at admin er slået fra i production (så serveren ikke serverer admin-SPA’en). For at få login-siden:

1. **Byg serveren med Dockerfile** i stedet for Nixpacks: i Railway → server-service → **Settings** → **Build** → vælg at bruge **Dockerfile** (fx “Dockerfile Path” = `Dockerfile` eller “Builder” = Dockerfile). Root Directory forbliver `apps/commerce`.
2. Sæt **`DISABLE_MEDUSA_ADMIN=false`** i server-service env.
3. Redeploy. Derefter serveres admin-appen fra `.medusa`, og du får login-siden på `/admin`.
4. Opret evt. admin-bruger mod samme DB: `DATABASE_URL="<staging-db>" npx medusa user -e din@email.com -p password` (kør fra `apps/commerce`).

**Fejl: "Could not find index.html in the admin build directory"**  
Serveren forventer admin-build i `.medusa/server/public/admin/`. Hvis du bruger Dockerfile, tjek: (1) at server-service virkelig bygger med **Dockerfile** (Settings → Build → Dockerfile), (2) at Root Directory er `apps/commerce`. Hvis build lykkes men containeren stadig fejler, **ryd Railway build cache** (Settings → Build → Clear build cache) og redeploy – så kører `medusa build` igen i builder-stage og genererer `.medusa`. Dockerfile’et validerer nu eksplicit at admin-filen findes; mangler den, fejler Docker-build med beskeden "Admin build missing. Clear Railway build cache and redeploy."

## Env: Server vs Worker

**Begge services** skal have de samme fælles env vars (DB, Redis, secrets, Payload). Kun mode/admin adskiller.

**Vigtigt — ordre-mails og PDF-faktura:** `order.placed`-subscriber (e-mail + PDF) kører på **worker**. Sæt **de samme** `PLUNK_*` og `STOREFRONT_URL` på **både server og worker**. **PDF-sælgerdata** kommer fra **region-metadata** (DB), ikke env — samme DB på server/worker giver ens PDF’er. Se `apps/commerce/env.template`.

### Fælles (server + worker)

| Env | Beskrivelse |
|-----|-------------|
| `NODE_ENV` | `production` (Railway sætter ofte selv) |
| `DATABASE_URL` | Supabase Postgres (brug pooler i prod) |
| `DATABASE_SCHEMA` | Valgfri, default `medusa` |
| `REDIS_URL` | Samme Redis – event bus + workflow engine |
| `JWT_SECRET` | Påkrævet i production |
| `COOKIE_SECRET` | Påkrævet i production |
| `PAYLOAD_SERVER_URL` | CMS URL (fx `https://cms.xxx.up.railway.app`) |
| `PAYLOAD_API_KEY` | API key til Payload (sync/kald fra worker) |
| `PAYLOAD_USER_COLLECTION` | Valgfri, default `users` |
| `PAYLOAD_MEDUSA_SYNC_SECRET` | Valgfri, til sync-endpoints |
| `STOREFRONT_URL` | Fuldt origin til storefront (fx `https://…up.railway.app`) — links i ordre-mails. **Server + worker.** |
| `PLUNK_SECRET_KEY` | Plunk secret (`sk_*`). **Server + worker** (transactional mail fra worker). |
| `PLUNK_FROM_EMAIL` | Afsender (verificeret domæne i Plunk). **Server + worker.** |
| `PLUNK_FROM_NAME` | Valgfri afsendernavn. **Server + worker.** |
| `PLUNK_STORE_NAME` | Valgfri butiksnavn i invite-mail. **Server + worker.** |
Hvis I bruger S3/Supabase Storage til filer: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, evt. `S3_FILE_URL`.

### Kun server

| Env | Beskrivelse |
|-----|-------------|
| `MEDUSA_WORKER_MODE` | `server` (kan udelades – toml sætter det) |
| `MEDUSA_BACKEND_URL` | Fuld URL til Medusa API (fx `https://guapo-server-staging.up.railway.app`). Bruges **både ved build** (admin-bundlen bager URL ind) **og** ved kørsel. Sæt den i Variables før deploy. |
| `STORE_CORS` | Tillatte origins for storefront (fx `https://store.xxx.up.railway.app`) |
| `ADMIN_CORS` | Tillatte origins for admin |
| `AUTH_CORS` | Tillatte origins for auth |

Plunk- og `STOREFRONT_URL` er **fælles** (server + worker) ovenfor — de skal også findes på server så admin/invite m.m. virker ens.

**"Failed to fetch" på login:** Hvis login-siden vises men "Continue with Email" giver "Failed to fetch", sender admin-UI’en kald til den URL som `MEDUSA_BACKEND_URL` peger på. Er den ikke sat (eller er den `http://localhost:9000`), forsøger browseren at kalde localhost fra din maskine → fejl. Sæt på **server**-service: `MEDUSA_BACKEND_URL=${{RAILWAY_STATIC_URL}}` (eller den fulde URL, fx `https://guapo-server-staging.up.railway.app`). `AUTH_CORS` og `ADMIN_CORS` skal inkludere samme origin (fx også `${{RAILWAY_STATIC_URL}}`).

### Kun worker

| Env | Beskrivelse |
|-----|-------------|
| `MEDUSA_WORKER_MODE` | `worker` (skal sættes) |
| `DISABLE_MEDUSA_ADMIN` | `true` (worker har ingen HTTP admin) |

## CORE-21 notes (Medusa v1 → v2)

- **v1** used `--cluster --servers=0 --workers=1` for the worker. **v2** uses env `MEDUSA_WORKER_MODE=worker`; no cluster flag.
- Redis Event Bus: log line “Local Event Bus installed…” is expected at startup; then “Connection to Redis in module 'event-bus-redis' established” confirms Redis is used.
- Admin: in production, admin is disabled by default so the server starts without an admin build. Set `DISABLE_MEDUSA_ADMIN=false` only when serving admin (e.g. Dockerfile build with `.medusa`).
