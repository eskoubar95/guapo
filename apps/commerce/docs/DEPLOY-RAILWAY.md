# Deploy Medusa (commerce) to Railway

Based on lessons from CORE-21 (Medusa server + worker on Railway).

## Services

- **medusa-server:** HTTP API (+ optional admin if build includes `.medusa`). Set `MEDUSA_WORKER_MODE=server` (or leave unset).
- **medusa-worker:** Background jobs. Set `MEDUSA_WORKER_MODE=worker` and `DISABLE_MEDUSA_ADMIN=true`.

Both use the same repo (Root Directory: `apps/commerce`), same build, same start command. Only env vars differ.

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

Hvis I bruger S3/Supabase Storage til filer: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, evt. `S3_FILE_URL`.

### Kun server

| Env | Beskrivelse |
|-----|-------------|
| `MEDUSA_WORKER_MODE` | `server` (kan udelades – toml sætter det) |
| `MEDUSA_BACKEND_URL` | Offentlig URL til Medusa API (til admin/cors) |
| `STORE_CORS` | Tillatte origins for storefront (fx `https://store.xxx.up.railway.app`) |
| `ADMIN_CORS` | Tillatte origins for admin |
| `AUTH_CORS` | Tillatte origins for auth |

### Kun worker

| Env | Beskrivelse |
|-----|-------------|
| `MEDUSA_WORKER_MODE` | `worker` (skal sættes) |
| `DISABLE_MEDUSA_ADMIN` | `true` (worker har ingen HTTP admin) |

## CORE-21 notes (Medusa v1 → v2)

- **v1** used `--cluster --servers=0 --workers=1` for the worker. **v2** uses env `MEDUSA_WORKER_MODE=worker`; no cluster flag.
- Redis Event Bus: log line “Local Event Bus installed…” is expected at startup; then “Connection to Redis in module 'event-bus-redis' established” confirms Redis is used.
- Admin: in production, admin is disabled by default so the server starts without an admin build. Set `DISABLE_MEDUSA_ADMIN=false` only when serving admin (e.g. Dockerfile build with `.medusa`).
