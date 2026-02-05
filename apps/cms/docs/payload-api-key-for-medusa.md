# Payload API key til Medusa sync

Medusa (apps/commerce) kalder Payloads REST API for at oprette/slette produkter. Der er **to måder** at godkende disse kald:

---

## Option A: Sync secret (nemmest)

Du behøver **ingen** API key.

1. **I apps/cms** (`.env`): Sæt f.eks.  
   `PAYLOAD_MEDUSA_SYNC_SECRET=din-hemmelige-streng-her`
2. **I apps/commerce** (`.env`): Sæt **samme** værdi  
   `PAYLOAD_MEDUSA_SYNC_SECRET=din-hemmelige-streng-her`
3. Lad `PAYLOAD_API_KEY` i commerce være **tom**.

Medusa sender så headeren `x-medusa-sync-secret` med hvert kald, og Payload accepterer create/delete når den matcher.

---

## Option B: Payload API key

1. **Start CMS** (Payload admin): `pnpm dev` i `apps/cms`, åbn fx `http://localhost:3001/admin`.
2. **Log ind** med en admin-bruger.
3. Gå til **Users** i venstremenuen.
4. **Åbn den bruger** du vil bruge til Medusa (eller opret en ny, fx "Medusa Sync").
5. På brugerens side: find feltet **"Enable API Key"** (eller "API Key") og **slå det til**.
6. **Kopiér den nøgle** Payload viser (vises typisk kun én gang – gem den).
7. **Gem brugeren** (Save).
8. **I apps/commerce** (`.env`): sæt  
   `PAYLOAD_API_KEY=<den-kopierede-nøgle>`  
   og sørg for `PAYLOAD_SERVER_URL` peger på CMS (fx `http://localhost:3001`).

Payload bruger collection-slug til auth-headeren; standard er `users`, så headeren bliver `users API-Key <nøgle>`. Hvis din user-collection hedder noget andet, kan du sætte `PAYLOAD_USER_COLLECTION` i commerce.

---

## Hvad er allerede sat op i koden?

- **Users-collection** i Payload har `auth: { useAPIKey: true }`, så "Enable API Key" vises i admin.
- **Products** accepterer create/delete enten ved sync-secret **eller** ved API key + query `is_from_medusa=true` (Medusa sender begge dele automatisk).

Ved tvivl: brug **Option A** (sync secret).

---

## Synkronisering (Settings → Payload)

**Nye** produkter (oprettet i Medusa efter opsætningen) synces automatisk til Payload via `product.created`. **Eksisterende** produkter (og andre entiteter) fyldes ind via Medusa Admin:

1. Sørg for at både **Commerce** (Medusa) og **CMS** (Payload) kører.
2. Gå i Medusa Admin til **Settings → Payload** (i venstremenuen under Indstillinger).
3. På siden ser du for hver entitet (Products, Categories, Brands, Product types) **seneste sync-tidspunkt** og en knap **"Sync to Payload"**. Alle fire understøtter manual sync.
4. Klik på **Sync to Payload** ved Products for at oprette manglende produkter i Payload. Sidst synkroniseret opdateres efter kaldet.

Efter sync opretter Medusa Payload-dokumenter for alle entiteter der endnu ikke findes i Payload. Du kan se dem i Payload Admin under den tilhørende collection.

**Script/automation:** Kald API direkte med admin-cookie:
   ```bash
   curl -X POST "http://localhost:9000/admin/payload/sync/products" \
     -H "Content-Type: application/json" \
     -b "connect.sid=<din-medusa-admin-cookie>"
   ```
   Eller brug Postman/Insomnia: **POST** `http://localhost:9000/admin/payload/sync/products` med samme cookies som ved login i Medusa Admin. **GET** `http://localhost:9000/admin/payload/sync/status` returnerer seneste sync-tidspunkt per collection (products, categories, brands, product_types).
