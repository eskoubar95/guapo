# M10 — Linear sync log

Status og Linear-mapping for tasks under M10 (Shipmondo Shipping).

## Linear issues

| Task  | Linear ID | Status | Beskrivelse |
|-------|-----------|--------|-------------|
| t10.1 | (opret)   | Done   | Shipmondo API research + SHIPMONDO.md |
| t10.2 | (opret)   | Done   | Custom Fulfillment Module Provider |
| t10.3 | (opret)   | Done   | medusa-config + env + seed |
| t10.4 | (opret)   | Done   | Pakkeshop-valg i storefront checkout |
| t10.5 | (opret)   | Done   | E2E test (dry-run flow) |
| t10.6 | (opret)   | In progress | Sandbox-test: Shipmondo sandbox-adgang + verificer label i Medusa |

**Opret Linear-issues for t10.1–t10.6** og tilføj Notes i `tasks.local.md` når IDs er kendt.

## t10.6 — Sandbox-test (ny task, blocker)

**Beskrivelse:** Anmod om Shipmondo sandbox-adgang (email til support med reason, email, navn). Når adgang er modtaget: sæt `SHIPMONDO_SANDBOX=true` + sandbox-credentials i `.env`, slå `SHIPMONDO_DRY_RUN` fra, og verificer fuld flow inkl. label-oprettelse. Bekræft at label kan hentes direkte i Medusa Admin (Get documents) uden at åbne Shipmondo.

**Acceptance:**
- Sandbox-adgang anmodet/ modtaget.
- Fulfillment i Medusa opretter rigtig forsendelse i Shipmondo sandbox.
- Label hentes og vises i Medusa Admin.
- Dokumentation opdateret med sandbox-setup.

## Implementeret (2026-02-27/28)

- t10.1–t10.5 implementeret på `task/m10-shipmondo`.
- Pakkeshop-only (GLS), Shipping Module Key for pickup search, dry-run for test uden labels.
- Kart cleared efter ordre; guest customer enrichment; shipping address = pakkeshop.
- Blocker: Mangler Shipmondo sandbox-adgang til fuld E2E (label) test. Mail sendt til Shipmondo (lør 28/2 — support svarer typisk hverdage).
