# Deploy Medusa (commerce) to Railway

Based on lessons from CORE-21 (Medusa server + worker on Railway).

## Services

- **medusa-server:** HTTP API (+ optional admin if build includes `.medusa`). Set `MEDUSA_WORKER_MODE=server` (or leave unset).
- **medusa-worker:** Background jobs. Set `MEDUSA_WORKER_MODE=worker` and `DISABLE_MEDUSA_ADMIN=true`.

Both use the same repo (Root Directory: `apps/commerce`), same build, same start command. Only env vars differ.

## Config (beauty-shop pattern)

- **railway.toml** – server service. Nixpacks, clean `.medusa` then build, healthcheck `/health`, env `MEDUSA_WORKER_MODE=server`.
- **railway-worker.toml** – worker service. Same build; no healthcheck; env `MEDUSA_WORKER_MODE=worker`, `DISABLE_MEDUSA_ADMIN=true`. In Railway, create a second service from the same repo (Root Directory: `apps/commerce`) and set the service’s config file to `railway-worker.toml` if your plan supports a custom config path; otherwise use the same `railway.toml` and set the worker env vars in the dashboard.
- **Dockerfile** – alternative if you build with Docker; then the image includes `.medusa` and you can set `DISABLE_MEDUSA_ADMIN=false` to serve admin.

## Env (both services)

- `REDIS_URL` – same Redis for event bus and workflow engine.
- `DATABASE_URL` – Supabase (use pooler in production).
- `JWT_SECRET`, `COOKIE_SECRET` – required in production.
- Server only: `MEDUSA_WORKER_MODE=server` (optional).
- Worker only: `MEDUSA_WORKER_MODE=worker`, `DISABLE_MEDUSA_ADMIN=true`.

## CORE-21 notes (Medusa v1 → v2)

- **v1** used `--cluster --servers=0 --workers=1` for the worker. **v2** uses env `MEDUSA_WORKER_MODE=worker`; no cluster flag.
- Redis Event Bus: log line “Local Event Bus installed…” is expected at startup; then “Connection to Redis in module 'event-bus-redis' established” confirms Redis is used.
- Admin: in production, admin is disabled by default so the server starts without an admin build. Set `DISABLE_MEDUSA_ADMIN=false` only when serving admin (e.g. Dockerfile build with `.medusa`).
