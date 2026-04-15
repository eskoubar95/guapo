# Shipmondo API Integration (Guapo M10)

This document describes the Shipmondo API v3 integration for parcel shop (pakkeshop) shipping in Denmark. Used by the custom Medusa Fulfillment Module Provider in `src/modules/shipmondo/`.

**Module layout:** `types.ts` (shared types); `lib/env.ts` (timeouts, label format, `getBaseUrl`, `minorToMajor`); `lib/labels.ts` (shipment/label coercion, Medusa Admin label URLs); `lib/pricing.ts` (price bands, flat rate, cart/context weight); `lib/products.ts` (normalize `GET /products` rows); `service.ts` (fulfillment provider orchestration). Re-exports for external callers: `service.ts` still exports label helpers + `shipmondoLabelFormat` for the Admin label PDF route.

## Overview

- **API version:** v3 (REST)
- **Documentation:** [shipmondo.dev](https://shipmondo.dev/docs/getting-started)
- **API Reference:** https://shipmondo.dev/api-reference
- **Shipping Module (pakkeshop-søgning):** https://shipmondo.dev/docs/shipping_module/intro

---

## Gennemgang: Krav vs. opsætning

**Mål:** (1) Fuld synergi Medusa ↔ Shipmondo: valgt fragt ved ordre → forsendelse i Shipmondo → pakkelabel vedhæftet på ordren i Admin. (2) Carriers i Danmark: typisk **GLS**, **DAO** og **PostNord** (product codes fra Shipmondo – se tabel længere nede). (3) Priser efter vægt baseret på produktvægt i checkout. (4) Simpel opsætning.

**Hvad vi allerede dækker:**

| Krav | Implementering |
|------|----------------|
| Ordre → Shipmondo → label | Fulfillment provider: `createFulfillment` kalder `POST /shipments`; label hentes via `getFulfillmentDocuments` og kan vises/downloades på ordren i Admin. |
| GLS + DAO + PostNord (eller flere) | **Nuværende model:** Admin **Tilføj fra Shipmondo** eller `sync:shipmondo` + `shipmondo_enabled_products` — én Medusa option per valgt produkt. Seed opretter **ikke** længere faste tre options; brug cleanup-script hvis I har legacy `pakkeshop`-type fra ældre seed. |
| Priser efter vægt | `calculatePrice` bruger kurvvægt (variant weight × antal). Hvis Medusa-context mangler `items`, hentes vægt fra DB (`cart_line_item` × `product_variant.weight`). Pris: **price_bands** eller **flat_amount_minor** (både under `data` og topniveau i option-JSON). Fallback: env `SHIPMONDO_PRICE_BANDS` / `SHIPMONDO_FLAT_RATE_MINOR`. |
| Pakkeshop-valg i checkout | Storefront kalder `/store/pickup-points` (Shipping Module Key eller API); bruger vælger pakkeshop; `service_point_id` gemmes og sendes med ved fulfillment. |

**Kompleksitet i dag:** Der er flere lag: (a) Shipmondo API produkter, (b) tabellen `shipmondo_enabled_products` (hvilke carriers I tilbyder), (c) Medusa shipping options (oprettet af Sync). Sync kræver at seed allerede har kørt (zones, profiles, locations). Det giver fleksibilitet (tilføj nye carriers uden kode), men onboarding kan føles tungt.

**To opsætningsmodeller:**

| Model | Hvornår | Carriers | Priser |
|-------|---------|----------|--------|
| **Sync + enabled-tabel** | Fleksibel Admin-sti uden kodeændring | Vælges i Settings → Shipmondo, Sync opretter options | `price_bands` / flat pr. option i Admin |
| **Fast carrier-model (arkiv)** | Historisk | Tidligere: tre options fra seed — **fjernet**; tilsvarende opnås ved manuel oprettelse i Admin hvis nødvendigt | Samme prisfelter i option `data` |

**Anbefalet rækkefølge (Sync-model):** Se **Testvejledning** nedenfor (env → migration + seed → Admin carriers + Sync + priser → checkout → fulfillment).

### Fast carrier-model (GLS, DAO, PostNord) — historisk

- **Seed** opretter **ikke** længere tre faste Shipmondo-options. Tilføj produkter via **Settings → Shipmondo** eller sync; sæt **`price_bands` / `flat_amount_minor`** under fanen **Priser**. **Calculated** pristype + variant **weight** (gram) kræves for vægtbaseret pris.
- **Checkout-liste:** Styres af `shipmondo_enabled_products` + faste product codes i `carrier-options` / env — se `SHIPMONDO_CHECKOUT_CARRIER_CODES` og `__API__` i env.template.
- **PostNord pakkeshop:** Storefront henter også `pdk`-punkter ved pakkeshop-søgning. Bekræft PostNord product code i Shipmondo og sæt `SHIPMONDO_POSTNORD_PRODUCT_CODE` hvis `POSTDK_SD` ikke matcher jeres aftale.

## Authentication: Two Options

### 1. Shipping Module Key (recommended for pakkeshop search)

For **pakkeshop-søgning i checkout** anbefales Shipmondo's [Shipping Module API](https://shipmondo.dev/docs/shipping_module/intro). Den bruger en **shipping module key** (også kaldet Delivery Checkout key):

- **Opret nøgle:** Shipmondo → Settings → [Create a Shipping Module Key](https://help.shipmondo.com/en/articles/1897540-create-a-shipping-module-key)
- **Env:** `SHIPMONDO_SHIPPING_MODULE_KEY`
- **Fordele:** Virker i production uden sandbox, ingen ekstra omkostninger for pickup point-søgning, begrænset adgang (read-only)
- **Endpoints:** `/service_point/service_points`, `/shipping_modules/carriers`, `/shipping_modules/products`

### 2. API User + API Key (Basic Auth)

For **label-oprettelse** (fulfillment) bruges fuld API-adgang:

- **Opret:** [app.shipmondo.com](https://app.shipmondo.com/account/sign-up) → [API access](https://app.shipmondo.com/main/app/#/setting/api)
- **Env:** `SHIPMONDO_API_USER`, `SHIPMONDO_API_KEY`
- Bruges til: `POST /shipments`, `GET /shipments/{id}`, og som fallback til pickup points

**Prioritet i Guapo:** Hvis `SHIPMONDO_SHIPPING_MODULE_KEY` er sat, bruges den til pakkeshop-søgning. Ellers bruges API User + Key.

## Sandbox vs Production

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://app.shipmondo.com/api/public/v3/` |
| **Sandbox** | `https://sandbox.shipmondo.com/api/public/v3/` |

- **Sandbox:** [Officiel sandbox-guide](https://shipmondo.dev/docs/sandbox): adgang fås ved at kontakte Shipmondo support (navn, e-mail, begrundelse); derefter login på [sandbox.shipmondo.com](https://sandbox.shipmondo.com/account/login/) med **egne sandbox-credentials** og API-nøgler der matcher. Fiktiv saldo, “unlimited” test-bookinger (ikke performance-test). Dokumenterede carriers i sandbox inkl. **GLS Denmark**, dao, PostNord m.fl. — men **forbindelsesfejl** til en carrier kan stadig opstå midlertidigt; se fejlsøgning nedenfor. Shop-import workers kører **ikke** i sandbox; Medusa → `POST /shipments` påvirkes ikke af det.
- **Production:** Use production base URL and production API keys from [API access](https://app.shipmondo.com/main/app/#/setting/api).
- **Transition:** When moving to live, switch the base URL from sandbox to production and use production keys.
- **Connectivity check:** From `apps/commerce` run `pnpm verify:shipmondo` (calls `GET /products` with receiver+sender `DK` per `buildShipmondoProductsQueryString`, plus Basic Auth).

### Migrering af priser (sandbox → production)

1. På sandbox: konfigurer Shipmondo-produkter og priser i **Settings → Shipmondo** (Levering + Priser).
2. Kald **`GET /admin/shipmondo/options/export`** (admin-session) og gem JSON-responsen.
3. På production: tilføj de samme produkter via **Tilføj fra Shipmondo**, så Medusa-options findes med matchende **`product_code`** (og gerne samme `type.code` som sandbox).
4. Kald **`POST /admin/shipmondo/options/import`** med den gemte JSON-body — merger **`flat_amount_minor`** og **`price_bands`** ind i eksisterende options.
5. Svaret indeholder **`applied`** (opdaterede produktkoder) og **`skipped`** med årsag (fx `no_matching_option` hvis koden ikke findes i prod).

**Checkout:** Store-routen **`GET /store/shipping-options-with-pricing`** inkluderer **`carrier_code`** og **`product_code`** pr. option (fra option-`data`), så storefront kan matche valgt pakkeshop-carrier uden at parse danske/engelske produktnavne.

## Endpoints Used by Guapo

### 1. Pickup points (pakkeshop search)

**GET** `/pickup_points`

Search for GLS or DAO parcel shops by postal code (and optional address).

| Query param | Required | Description |
|-------------|----------|-------------|
| `carrier_code` | Yes | `gls` or `dao` for Denmark |
| `country_code` | Yes | `DK` |
| `zipcode` | Yes | Danish postal code (e.g. `5000`) |
| `address` | No | Street address to refine distance |
| `limit` | No | Max results (default 10) |

**Example request:**

```http
GET /pickup_points?carrier_code=gls&country_code=DK&zipcode=5000
```

**Example response (array of service points):**

```json
[
  {
    "number": "95892",
    "id": "95892",
    "company_name": "7-Eleven Odense C",
    "name": "7-Eleven Odense C",
    "address": "Vestergade 89",
    "address2": "Pakkeshop: 95892",
    "zipcode": "5000",
    "city": "Odense C",
    "country": "DK",
    "distance": 182,
    "longitude": 10.3807,
    "latitude": 55.3942,
    "agent": "gls",
    "carrier_code": "gls",
    "opening_hours": ["Man: 07:00-23:00", "Tir: 07:00-23:00", ...],
    "in_delivery": true,
    "out_delivery": true
  }
]
```

For creating a shipment, the important field is **`number`** (or `id`) — use as `service_point_id` in the shipment request.

### 2. Products (list available shipping products)

**GET** `/products` — Guapo bruger query som i Shipmondo API: **`receiver_country_code`**, **`sender_country_code`** (default = modtager ved DK-domestic), valgfrit **`carrier_code`** (fx `gls`), og stadig **`country_code`** sat til samme som modtager for bagudkompatibilitet. Se [API reference](https://shipmondo.dev/api-reference#/operations/products_get).

Returns available shipping products for the given country/carrier. Use to confirm product codes for your account (e.g. GLS ShopDelivery `GLSDK_SD`). Rækker med **`service_point_required: true`** (nyere API) mappes til vores **`service_point_product`** til pakkeshop-filtre.

### Admin catalog wizard (Medusa)

Admin **Settings → Shipmondo → Tilføj fra Shipmondo** bruger **ShipmondoCatalogWizard**:

1. **Lande** — modtager- og afsenderland (bruges i produktkald).
2. **Carriers** — ved **Næste** kaldes **`GET /admin/shipmondo/carriers`**, som proxier Shipmondo **`GET /shipping_modules/carriers`** (Basic Auth, samme env som øvrig Shipmondo API). Listen vises uden logo/avatar; brugeren vælger én eller flere carriers.
3. **Produkter** — ved **Næste** hentes for hver valgt carrier **`GET /admin/shipmondo/products`** med `receiver_country_code`, `sender_country_code`, `carrier_code` (parallel `Promise.all`); resultatet merges på `product.code`. Under hentning vises overlay + deaktiveret **Næste**.
4. **Bekræft** — anvend **`POST /admin/shipmondo/catalog/apply`** som før.

Typical product codes for Denmark parcel shop:

- **GLS Pakkeshop:** `GLSDK_SD` (GLS Denmark – service point delivery)
- **DAO:** Check `/products` response for dao product code (e.g. dao-related code)

### 3. Create shipment (label)

**POST** `/shipments`

Creates a shipment and can return label/label URL. Required for fulfillment: sender + receiver parties, product_code, parcels (weight), and for parcel shop: `service_point_id`.

**Minimal body for GLS Pakkeshop:**

```json
{
  "own_agreement": false,
  "label_format": "10x19_pdf",
  "product_code": "GLSDK_SD",
  "service_codes": "EMAIL_NT",
  "automatic_select_service_point": false,
  "service_point_id": "95892",
  "parties": [
    {
      "type": "sender",
      "name": "Sender Name",
      "address1": "Street 1",
      "postal_code": "5220",
      "city": "Odense SØ",
      "country_code": "DK",
      "email": "sender@example.com",
      "phone": "12345678"
    },
    {
      "type": "receiver",
      "name": "Customer Name",
      "address1": "Customer Street",
      "postal_code": "5000",
      "city": "Odense C",
      "country_code": "DK",
      "email": "customer@example.com",
      "mobile": "87654321"
    }
  ],
  "parcels": [{ "weight": 2000 }],
  "reference": "Order 12345",
  "print": false
}
```

- **label_format:** `"10x19_pdf"` (label-printer), `"a4_pdf"` (A4), `"zpl"` (Zebra). **Kræves** for at Shipmondo inkluderer label-PDF i API-svaret. Styres via **`SHIPMONDO_LABEL_FORMAT`** env (default `10x19_pdf`).
- **weight** in `parcels`: grams (e.g. 2000 = 2 kg).
- **service_point_id:** From `/pickup_points` response (`number` or `id`).
- **print:** `false` = do not send til Shipmondo Print Client (anbefalet til API-integration). `true` hvis jeres konto kræver det — sæt **`SHIPMONDO_SHIPMENT_PRINT=true`**.
- **reference:** Order ID or external reference.

Response includes shipment `id`, tracking info, and label PDF under **`labels[].base64`** with **`file_format`** (typisk `pdf`) — se [Shipmondo API: POST shipments](https://shipmondo.dev/api-reference#/operations/shipments_post). Guapo læser også **`label_base64`** på root, **`parcels[].label_base64`**, og **`parcels[].labels[].base64`** (nogle carrier-svar lægger PDF under parcel).

### 3b. Get labels (dedicated endpoint)

**GET** `/shipments/{id}/labels?label_format=10x19_pdf`

Dedikeret label-endpoint (se [Shipmondo PHP SDK](https://github.com/shipmondo/shipmondo_php_sdk)). Guapo bruger dette som **primær** fallback når POST-svaret ikke indeholder label-PDF, og som kilde i `getFulfillmentDocuments`. Endpointet returnerer labels-arrayet direkte i stedet for hele shipment-objektet.

Hvis label stadig mangler efter polling: sæt **`SHIPMONDO_DEBUG_SHIPMENT_RESPONSE=true`** og genopret fulfillment — log viser kun **nøgler** (ingen base64), så I kan se om Shipmondo returnerer et andet feltnavn. Prøv evt. **`SHIPMONDO_SHIPMENT_PRINT=true`** hvis jeres konto kun udleverer PDF via Print Client.

**Labelless / E-label (fx dao, Bring, nogle flows):** API’et returnerer **ingen** `labels[]` med PDF — I får i stedet et **`labelless_code`** (skrives på pakken). Se [Shipmondo: labelless](https://shipmondo.com/dictionary/labelless/). Guapo gemmer **`labelless_code`** og evt. **`gls_colli_id`** på fulfillment **`data`**, så I kan vise dem i pakkeflow (Medusa Admin viser ikke automatisk labelless-kode som erstatning for **Label**-linket). Når `labelless_code` er sat, logger provideren **info** (ikke warning) om manglende PDF.

### Medusa Admin: label i fulfillment-kortet

Standard **Medusa Admin** (dashboard) viser under **Tracking** et link **Label** (fast tekst) og et link med **trackingnummer** som klikbart, når `tracking_url` er ikke-tom — se `@medusajs/dashboard` `order-fulfillment-section`. Derfor sætter Guapo en **fallback tracking-URL** (fx GLS sporingslink), hvis Shipmondo returnerer tom `tracking_url`, så pakkenummeret stadig er synligt som link.

**Label-PDF:** Store `data:application/pdf;base64,…` URL’er i `label_url` giver ofte **sort/blank side** i browseren (længdegrænser). Når **`MEDUSA_BACKEND_URL`** er sat, gemmes i stedet et **proxy-link** til `GET /admin/shipmondo/shipments/{shipment_id}/label`, som streamer PDF fra Shipmondo (kræver admin-login). Hvis env ikke er sat (fx tests), falder provideren tilbage til data-URL.

Gamle fulfillments med forkert/ tom `label_url` opdateres ikke automatisk; opret evt. ny fulfillment efter deploy.

### 4. Get shipment (tracking / label)

**GET** `/shipments/{id}`

Retrieve a single shipment (e.g. for tracking status or label document).

### 5. List shipments

**GET** `/shipments`

List shipments with optional filters (e.g. by reference, date).

## Product codes (DK pakkeshop)

| Carrier | Product code | Note |
|---------|--------------|------|
| GLS Denmark | `GLSDK_SD` | Pakkeshop – typisk fast |
| DAO | fx `DAO_SD` | Bekræft i `GET /products?country_code=DK` |
| PostNord | (fra API) | Samme endpoint – vælg service point-produkt til DK |

GLS kræver ofte `service_codes`: `EMAIL_NT` (email notification). DAO/PostNord: følg Shipmondo-produktets krav.

## Error handling

- API returns standard HTTP status codes (4xx client errors, 5xx server errors).
- Response body usually contains error message or validation details.
- **Rate limits:** Not strictly documented; use reasonable throttling and retries with backoff for 429/5xx.
- On failure: log response body, do not expose API key in logs.

## Environment variables (Guapo)

| Variable | Description |
|----------|-------------|
| `SHIPMONDO_SHIPPING_MODULE_KEY` | **Anbefalet:** Shipping Module Key til pakkeshop-søgning. Opret i Shipmondo Settings. |
| `SHIPMONDO_API_USER` | API user (til label-oprettelse og fallback for pickup points) |
| `SHIPMONDO_API_KEY` | API key (secret) |
| `SHIPMONDO_SANDBOX` | `true` til sandbox base URL; `false` eller udelad for production |
| `SHIPMONDO_DRY_RUN` | `true` for at simulere fulfillment uden at oprette rigtige labels (til test) |
| `SHIPMONDO_FLAT_RATE_MINOR` | **(Fallback)** Pris i minor units hvis option ikke har data. Anbefaling: sæt priser i Admin (option data). |
| `SHIPMONDO_PRICE_BANDS` | **(Fallback)** Vægtbands som JSON hvis option ikke har data. Anbefaling: sæt price_bands i Admin. |
| `SHIPMONDO_SERVICE_CODES` | **(Fallback)** Service codes til POST /shipments hvis option.data ikke har service_codes (default i kode: `EMAIL_NT,SMS_NT`). **Sync** skriver `service_codes` på option ud fra GET /products (`required_services` + valgfri `EMAIL_NT`/`SMS_NT` fra `available_services`). |
| `SHIPMONDO_CHECKOUT_CARRIER_CODES` | Valgfri CSV (default i kode: GLS+DAO+PostNord). Sæt `__API__` for dynamisk liste fra API. |
| `SHIPMONDO_POSTNORD_PRODUCT_CODE` | PostNord Shipmondo product code (default `POSTDK_SD` hvis uændret). |
| `SHIPMONDO_GLS_PRODUCT_CODE` | Valgfri override for GLS pakkeshop (default `GLSDK_SD`). Brug hvis Shipmondo-kontoen bruger en anden kode end seed/sync. |
| `SHIPMONDO_DAO_PRODUCT_CODE` | Valgfri override for DAO pakkeshop (default `DAO_SD`). Brug ved `422 product_code invalid` efter `GET /products?country_code=DK` eller portal. |
| `SHIPMONDO_LABEL_FORMAT` | Label-format i POST body og GET /labels (`10x19_pdf`, `a4_pdf`, `zpl`, `compact_pdf`). Default `10x19_pdf`. **Kræves** for at API returnerer PDF. |
| `SHIPMONDO_SHIPMENT_PRINT` | `true` → `print: true` på POST /shipments (Print Client). Default `false`; label hentes stadig med GET når API returnerer den. |
| `SHIPMONDO_LABEL_GET_MAX_ATTEMPTS` | Antal **GET** `/shipments/{id}/labels` forsøg når POST mangler PDF (default **5**, max 15). |
| `SHIPMONDO_LABEL_GET_RETRY_MS` | Pause mellem GET-forsøg i ms (default **3000**, min 200). |

Se `env.template` for fuld liste. **Priser og hvilke carriers der bruges styres i Medusa Admin / database; kun API-nøgler og drift (SANDBOX, DRY_RUN, SENDER_*) skal være i env.**

## Priser og vægt (API vs. Medusa)

### Hvad Shipmondo API giver – og ikke giver

| Kilde | Vægtintervaller | Kundepris i checkout |
|-------|-----------------|----------------------|
| **`GET /products?country_code=DK`** | Ja: feltet **`weight_intervals`** (fra–til gram) pr. produkt beskriver, hvilke vægte carrier-produktet understøtter til forsendelse/label. | **Nej** – ingen pris pr. interval til webshop. |
| **Jeres fragtaftale i Shipmondo** | — | Aftalen styrer typisk, hvad **I betaler** Shipmondo for labels. Det er **ikke** det samme som, hvad kunden skal betale i kurven, og det eksponeres **ikke** som strukturerede checkout-priser via den offentlige API. |

**Konsekvens:** I skal **altid selv indtaste priser pr. carrier** i Medusa (`price_bands` eller `flat_amount_minor` pr. shipping option). I kan spejle jeres omkostninger + avance, men Medusa henter ikke automatisk “fragtpris fra aftale” til checkout.

### Vægtintervaller vs. prisbånd

- **`weight_intervals` (fra Shipmondo, evt. gemt på option efter Sync):** Reference til carrierens vægtspænd – nyttigt til dokumentation og til at matche label-vægt; **styrer ikke** checkout-pris.
- **`price_bands` (Medusa option data):** `{ max_grams, amount_minor }` – **det** bruger `calculatePrice` til at vise fragt i checkout ud fra kurvvægt. Hver carrier kan have **forskellige** bånd (fx DAO 0–1 kg / 0–3 kg med egne priser, GLS med egne).

### Guapo-styring (praktisk)

- **Primær kilde (Admin):** På hver shipping option: `price_bands` eller `flat_amount_minor`.
- **Fallback (env):** `SHIPMONDO_PRICE_BANDS` / `SHIPMONDO_FLAT_RATE_MINOR` hvis option mangler data.
- **Kurvvægt:** Variant **weight** (gram) × antal i Admin.

### Dynamisk fragtpris i checkout (storefront)

Storefront henter fragtoptions med beregnet pris via **GET /store/shipping-options-with-pricing?cart_id=xxx**. Denne route kører Medusa-workflowet `listShippingOptionsForCartWithPricingWorkflow`, så `calculatePrice()` på Shipmondo-provideren kaldes med kurvkontekst (varer + vægt). Priserne følger jeres `price_bands` / `flat_amount_minor` pr. option. Hvis endpointet fejler, falder storefront tilbage til SDK’s `listCartOptions` (som muligvis ikke returnerer beregnede beløb).

## Carriers: shipmondo_enabled_products

Hvilke Shipmondo-produkter (carriers) der vises i checkout styres af tabellen **medusa.shipmondo_enabled_products**. Kun produkter med `enabled = true` returneres fra `getFulfillmentOptions`. Hvis tabellen er tom eller ikke findes, returneres alle service_point-produkter fra API (bagudkompatibilitet).

- **Tabel:** `product_code` (unik), `carrier_name`, `enabled`, `display_order`. Oprettes via migration (shipmondo-config modul).
- **Admin:** Under **Settings → Shipmondo** i Medusa Admin kan du slå carriers til/fra, køre "Sync from Shipmondo" og sætte flat priser (øre) pr. shipping option. **Seed opretter ikke længere** faste GLS/DAO/PostNord-options; brug **Tilføj fra Shipmondo** eller `pnpm sync:shipmondo`. Fjern gamle seed-options med `pnpm cleanup:shipmondo-seed-options`.

## Sync fra Shipmondo (script)

Kør **pnpm sync:shipmondo** (eller `medusa exec ./src/scripts/sync-shipmondo-options.ts`) for at hente produkter inkl. vægtintervaller fra Shipmondo og oprette/opdatere Medusa shipping options (én per valgt produkt). Scriptet:

1. Henter produkter fra `GET /products?country_code=DK` (inkl. weight_intervals).
2. Filtrerer på **enabled** produkter i `shipmondo_enabled_products` (hvis tabellen er populerede).
3. Opretter eller opdaterer en shipping option per produkt med `data: { weight_intervals, product_code }`. Priser sættes **ikke** her – konfigurer i Admin (option.data.price_bands eller flat_amount_minor).

Kør sync efter at du har tilføjet/fjernet carriers i `shipmondo_enabled_products`, så de nye options bliver oprettet.

## Locations og Shipping i Medusa – hvordan det hænger sammen

For at Shipmondo-options vises i checkout og i **Settings → Locations → [Din lokation] → Shipping**, skal følgende være på plads:

1. **Stock location** (fx "Denmark") med adresse og **Shipping** slået til. Location skal have mindst ét **fulfillment set** (oprettes typisk ved oprettelse af location eller via seed).
2. **Service zone** på det fulfillment set – fx "Denmark" med land = DK. Seed opretter denne zone, hvis den ikke findes.
3. **Shipping options** i den zone – **oprettes ikke automatisk af seed** længere. Brug **Settings → Shipmondo → Tilføj fra Shipmondo** (eller `pnpm sync:shipmondo` når `shipmondo_enabled_products` er sat). Efter opgradering fra ældre seed: kør `pnpm cleanup:shipmondo-seed-options` for at fjerne legacy options med type `pakkeshop`.

**Hvad du skal se i Admin:**

- **Settings → Locations → Denmark:** Under "Shipping" vises de Shipmondo-metoder du har tilføjet via Admin eller sync. Seed linker stadig Shipmondo-provideren til stock location og opretter Denmark-zone, men **ikke** faste carrier-options.
- Hvis du kun ser **Manual**-option: tjek at Shipmondo er linket (`pnpm link:shipmondo`) og at du har tilføjet produkter under **Extensions → Shipmondo**.

**Extensions → Shipmondo:** Faner **Levering** og **Priser**. Priser (flat / vægtbands) sættes i pris-fanen. Når en option har **`weight_intervals`** fra Shipmondo (efter Tilføj/sync), viser **Priser**-fanen faste intervaller — du indtaster kun **beløb i øre** pr. interval; gram-grænser kommer fra API.

**Legacy seed-options:** Kør `pnpm cleanup:shipmondo-seed-options` (fra `apps/commerce`) for at fjerne gamle tre carriers med type `pakkeshop`. **Tilføj fra Shipmondo** åbner en stepper (carriers → produkter + adviseringer → bekræft); katalog hentes automatisk med Shipmondo `GET /products` via `GET /admin/shipmondo/products` med `service_point_only=false` (alle produkter for landet; intet pakkeshop-filter i UI). **Tilføj til shop** kalder `POST /admin/shipmondo/catalog/apply` med **`product_selections`** (per produkt: e-mail/SMS) eller ældre format **`product_codes`** + globale toggles — opretter/opdaterer Medusa shipping options med `product_code`, `service_codes` og `weight_intervals` fra API (priser sættes i pris-fanen). **Sync fra Shipmondo** (`POST /admin/shipmondo/sync`) synkroniserer stadig enabled produkter fra API. I seed-setup kan API-listen være tom (sandbox).

### Shipmondo vises ikke som "connected" under Fulfillment providers

Hvis I har oprettet locations og shipping options manuelt (uden seed), og under **Locations → [jeres lokation]** kun **Manual** står som fulfillment provider (Shipmondo kan ikke tilføjes i UI), skyldes det at **linket** mellem stock location og Shipmondo-provideren mangler. Provideren er registreret i koden når env er sat, men den er ikke koblet til jeres location.

**Løsning:** Kør link-scriptet én gang (uden at køre fuld seed):

```bash
cd apps/commerce && pnpm link:shipmondo
```

eller

```bash
cd apps/commerce && pnpm exec medusa exec ./src/scripts/link-shipmondo-to-location.ts
```

Scriptet finder alle stock locations og opretter link til `shipmondo_shipmondo`. Efter kørsel bør Shipmondo vises som connected under jeres location. Genstart ikke nødvendig; opdater evt. locations-siden i Admin.

## Shipping Option Types – hvad er det, og hvad skal I have?

**Shipping option types** i Medusa er **kategorier** til fragtmetoder. De bruges til at gruppere shipping options (fx i Admin, rapporter eller filtrering). Hver **shipping option** (den konkrete metode kunden vælger) er knyttet til præcis én type.

**For Guapo med Shipmondo:**

- **Tilføj fra Shipmondo** / sync opretter én shipping option pr. produkt med **type.code = Shipmondo product code** (fx `GLSDK_SD`), ikke den gamle fælles `pakkeshop`-type.
- Legacy options fra ældre seed brugte type **code `pakkeshop`** for alle tre carriers — fjern dem med `pnpm cleanup:shipmondo-seed-options` hvis de stadig findes.

**Hvis I manuelt opretter types:** Brug meningsfulde labels; vigtigst er **provider-data** (`product_code`, `service_codes`, priser).

## Medusa Admin: shipping setup (synkroniseret med Shipmondo)

1. **Fulfillment provider:** Pakkeshop-options skal have **provider = Shipmondo** (shipmondo_shipmondo).
2. **Option type/code:** Type **code** skal matche modulet: `gls-pakkeshop`, `dao-pakkeshop` eller Shipmondo product code (fx `GLSDK_SD`).
3. **Pristype:** Brug **Calculated**. Pris hentes fra **option data** (price_bands eller flat_amount_minor); ellers fra env fallback.
4. **Option data (Admin):** I optionens provider-data kan du sætte: `price_bands` (fx `[{ "max_grams": 2000, "amount_minor": 3900 }]`), `flat_amount_minor`, `service_codes`, `product_code`.
5. **Zoner:** Option i en service zone der matcher leveringsland (fx Denmark).
6. **Vægt på produkter:** Variant **weight** (gram) udfyldt, så beregning og label bruger korrekt vægt.
7. **Shipping profile → Metadata (afsender til Shipmondo):** Standard-Admin har ikke metadata på **Location**, men har det på **Shipping profile**. Gå til **Settings → Locations → Shipping profiles** → den profil dine Shipmondo-options bruger (fx *Default Shipping Profile*) → **Metadata**. Sæt mindst **`sender_email`** (gyldig e-mail til carrier). Valgfrit: **`sender_name`**, **`sender_phone`**. Alle shipping options under samme profil deler disse felter (de joines via `shipping_option.shipping_profile_id`).

## Test uden sandbox og uden at købe labels

For at teste hele integrationen **uden** at anmode om sandbox og **uden** at købe ægte labels:

1. **Opret Shipping Module Key** i [Shipmondo](https://app.shipmondo.com/main/app/#/setting/api) (Settings → Shipping Module Key / Delivery Checkout). Sæt `SHIPMONDO_SHIPPING_MODULE_KEY` i commerce `.env`.
2. **Sæt `SHIPMONDO_DRY_RUN=true`** i commerce `.env`. Fulfillment simuleres; ingen rigtige labels oprettes.
3. **Sæt API User + Key** (`SHIPMONDO_API_USER`, `SHIPMONDO_API_KEY`) hvis du vil teste med Basic Auth fallback til pakkeshop-søgning. Med **kun** Shipping Module Key og **uden** dry-run vil **fulfillment i Admin fejle** (provider kræver API-nøgler til `POST /shipments`).
4. Kør seed, start commerce og storefront, og test hele flowet (checkout → pakkeshop-valg → betaling → ordre → fulfillment i Admin).

## End-to-end test (M10 acceptance)

1. **Prerequisites:** Commerce og storefront kører; Shipmondo-credentials sat; Stripe konfigureret; Shipmondo shipping options tilføjet (Admin → Shipmondo eller sync) under Locations → Denmark → Shipping.
2. **Checkout:** Vælg Pakkeshop, indtast postnummer (f.eks. 1000), søg, vælg pakkeshop.
3. **Payment:** Gennemfør betaling med Stripe test kort. Bekræft ordre oprettes og fragt er 39 DKK.
4. **Fulfillment:** I Medusa Admin, åbn ordren og opret fulfillment. Med `SHIPMONDO_DRY_RUN=true` returneres simulerede data uden API-kald. Uden dry-run kaldes Shipmondo og labels oprettes (kræver saldo/aftale).

Uden Shipmondo-credentials registreres Shipmondo-provideren ikke; appen starter med manual shipping, og `/store/pickup-points` returnerer 503.

## Kan man se integrationen i Shipmondo uden at oprette labels?

**Nej.** Med `SHIPMONDO_DRY_RUN=true` kalder Guapo slet ikke Shipmondo API for at oprette forsendelser. Alt simuleres lokalt — intet vises i Shipmondo-appen (hverken sandbox eller production). For at se en registrering i Shipmondo (f.eks. under Forsendelser > Booked) skal du slå dry-run fra og gennemføre et rigtigt fulfillment, der opretter en ægte label.

## Hvad sker der, hvis jeg slår dry-run fra?

**Uden dry-run** kalder Guapo Shipmondos `POST /shipments` API, når du opretter fulfillment i Medusa Admin. Det opretter en **ægte forsendelse** i Shipmondo og forbruger din saldo — du **betaler for labelen**. Der findes ikke en "registrer uden at betale"-tilstand i production. For at teste uden at betale skal du bruge Shipmondos **sandbox** (adgang via support) med `SHIPMONDO_SANDBOX=true` og sandbox-credentials.

## Kan jeg hente/prise labelen direkte i Medusa uden at åbne Shipmondo?

**Ja.** Når du opretter fulfillment i Medusa Admin (uden dry-run), returnerer Shipmondo-provideren label-data (PDF som base64). Medusa gemmer dette og eksponerer det via "Get documents" / fulfillment documents. Du kan downloade labelen direkte fra Medusa Admin uden at åbne Shipmondo-appen.

## Shipping address for pakkeshop

For pakkeshop-ordrer sættes **shipping address** på ordren til **pakkeshop-adressen** (det sted, hvor pakken fysisk leveres). Billing address forbliver kundens egen adresse. Det er korrekt registreret sådan i Medusa og bruges korrekt af Shipmondo-provideren ved label-oprettelse.

## Webhooks (Shipmondo → Medusa)

Optional push-updates when Shipmondo changes a shipment (requires Shipmondo webhook feature / plan — see [webhook requirements](https://shipmondo.dev/docs/webhooks/requirements-and-structure)).

1. I Shipmondo: opret webhook med HTTPS URL: `https://<din-commerce-host>/hooks/shipmondo` og den **encryption key** du også lægger i env.
2. Sæt `SHIPMONDO_WEBHOOK_ENCRYPTION_KEY` i commerce `.env` (samme streng som i Shipmondo).
3. Medusa modtager `POST` med body `{ "data": "<JWT>" }`; JWT verificeres med HS256 og fulfillment `data` opdateres med bl.a. `shipmondo_pkg_no`, `shipmondo_tracking_url` for Shipmondo-fulfillments på den ordre, hvis JWT-payloadens `data.reference` matcher Medusa **order id** (fx `order_01...` — samme som `reference` ved Shipmondo `POST /shipments`).

Hvis env-variablen ikke er sat, returnerer endpointet `200` med `{ ok: true, configured: false }` (så eksterne health checks ikke fejler).

## Store: rate limiting (pickup + shipping pricing)

`GET /store/pickup-points` og `GET /store/shipping-options-with-pricing` har et **blødt** per-IP loft (standard **120** requests pr. minut) for at begrænse misbrug som åben proxy mod Shipmondo. Konfigurer via `SHIPMONDO_STORE_RATE_LIMIT_MAX` eller slå fra med `SHIPMONDO_STORE_RATE_LIMIT_DISABLED=true`.

**Bemærk:** Øvrige `/store/*`-routes bruger allerede Medusas publishable API key middleware.

## Fejlsøgning: Fulfillment fejler efter opgradering

- **Meddelelse om manglende API-nøgler:** Sæt `SHIPMONDO_API_USER` og `SHIPMONDO_API_KEY` (sandbox- eller production-keys matchende `SHIPMONDO_SANDBOX`), eller brug `SHIPMONDO_DRY_RUN=true` til test uden API.
- **Shipmondo API fejl:** Provider **kaster** nu `MedusaError` — Medusa ruller fulfillment-oprettelse tilbage (slettet kladdelignende fulfillment), så I ikke får “succes” uden label. Tjek commerce logs og Shipmondo respons.
- **`500` / `Shipmondo shipment failed: This operation was aborted` eller `timed out after …ms`:** Integrationen brugte en **10s timeout** på alle Shipmondo-kald; **`POST /shipments`** kan tage længere (fx ~12s når GLS bookes), så `fetch` blev afbrudt **efter** Shipmondo havde oprettet forsendelsen — derfor ser du fejl i Admin, men forsendelse i Shipmondo. **Fix (implementeret):** `POST /shipments` har nu **60s** standard-timeout (`SHIPMONDO_SHIPMENT_TIMEOUT_MS`). Tjek Shipmondo før du opretter fulfillment igen, så du undgår dubletter.
- **`422` / `product_code invalid or missing`:** Provideren udleder `product_code` fra shipping method data, option-JSON i DB, og/eller `carrier_code`. Før POST /shipments **validerer** den den resolved kode mod **Shipmondo GET /products** (cachet 15 min) og auto-korrigerer via `carrier_code` → den korrekte Shipmondo-kode. Så selv hvis seed/DB siger `DAO_SD`, men jeres Shipmondo-konto bruger `DAO_PAKKESHOP`, finder systemet den korrekte kode automatisk. **Service-codes** følger også API'et: `required_services` fra produktet bruges, så GLS får `EMAIL_NT` og DAO/PostNord kun det de kræver. **Hvis det stadig fejler:** carrier-produktet er sandsynligvis **ikke aktiveret** på jeres Shipmondo-aftale — tjek Shipmondo-portalen → Produkt- og serviceoversigt, eller `GET /products?country_code=DK`. Env-overrides (`SHIPMONDO_GLS_PRODUCT_CODE`, `SHIPMONDO_DAO_PRODUCT_CODE`) er stadig tilgængelige men sjældent nødvendige.
- **`422` / sender blank / `Receiver email is required`:** **Afsenderadresse** fra **stock location** for fulfillment-**location** (Settings → Locations — adressefelterne i “Edit location”). **Afsender-e-mail til carrier:** Standard-Admin har **ikke** metadata på location; brug i stedet **Settings → Locations → Shipping profiles → [dit Shipmondo-profil] → Metadata** med mindst **`sender_email`** (gyldig e-mail). Valgfrit i samme metadata: **`sender_name`**, **`sender_phone`**. Disse læses via shipping option → shipping profile. **`SHIPMONDO_SENDER_*`** i `.env` er **overrides** ovenpå. **`SHIPMONDO_SANDBOX=true`** udfylder resterende huller med placeholders (kun lokal test). **Modtager-e-mail:** `order.email` eller `order.customer.email`.
- **`422` / `Connection to GLS could not be established` (eller tilsvarende for DAO/PostNord):** Det er **ikke** en Medusa-/Guapo-valideringsfejl — Shipmondo har accepteret kaldet, men **carrier-backend** (her GLS) svarer ikke efter retries. Ifølge [Shipmondo Sandbox](https://shipmondo.dev/docs/sandbox) er **GLS Denmark** (sammen med bl.a. dao og PostNord DK) **understøttet** i sandbox — så fejlen betyder ikke automatisk “GLS findes ikke i sandbox”. Typiske årsager: midlertidig fejl mellem Shipmondo og carrier, **sandbox-konto** der mangler aktivering/opsætning af produktet hos Shipmondo, eller at I ikke bruger **dedikerede sandbox API-nøgler** + `SHIPMONDO_SANDBOX=true` (se samme guide: sandbox kræver adgang via **support** og login på [sandbox.shipmondo.com](https://sandbox.shipmondo.com/account/login/)). **Handling:** prøv igen senere, book med **anden carrier** i sandbox (fx `DAO_SD`) for at isolere GLS, eller skriv til **Shipmondo support** med tidspunkt og fuld fejltekst.

---

## Testvejledning: Alt fra nul til ordre + fulfillment

**Enkel opsætningssti (quick reference):** Env (API User + Key, evt. Module Key, DRY_RUN) → `pnpm db:migrate && pnpm seed` → Admin: Settings → Shipmondo → slå carriers til → Sync from Shipmondo → sæt priser pr. option → test i checkout → fulfillment i Admin.

Brug nedenstående rækkefølge for at teste den fulde shipping-opsætning (carriers, priser, checkout, fulfillment).

### 1. Forudsætninger

- **Commerce `.env`** (i `apps/commerce/`):
  - `DATABASE_URL` – forbindelse til Postgres (fx Supabase).
  - `SHIPMONDO_API_USER` og `SHIPMONDO_API_KEY` – fra [Shipmondo API-adgang](https://app.shipmondo.com/main/app/#/setting/api).
  - (Valgfrit) `SHIPMONDO_SHIPPING_MODULE_KEY` – til pakkeshop-søgning uden sandbox; ellers bruges API User+Key.
  - `SHIPMONDO_DRY_RUN=true` – så I ikke opretter rigtige labels under test.
  - (Valgfrit) `SHIPMONDO_SANDBOX=true` hvis I bruger sandbox-credentials.
- **Stripe** – `STRIPE_API_KEY` og evt. `STRIPE_WEBHOOK_SECRET` i commerce; `NEXT_PUBLIC_STRIPE_KEY` i storefront `.env.local`.
- **Migration og seed kørt:**
  ```bash
  cd apps/commerce && pnpm db:migrate && pnpm seed
  ```

### 2. Admin: Settings → Shipmondo

1. Start commerce: `cd apps/commerce && pnpm dev`.
2. Åbn Medusa Admin (fx `http://localhost:9000/app`) og log ind.
3. Gå til **Settings → Shipmondo**.
4. **Carriers:** Tjek at listen over produkter fra Shipmondo vises. Slå de carriers til (Switch), I vil tilbyde (fx GLS Pakkeshop, DAO Pakkeshop). Gemmes automatisk.
5. Klik **Sync from Shipmondo**. Det opretter/opdaterer én shipping option per valgt carrier med vægtintervaller (priser sættes ikke her).
6. **Shipping option prices:** For hver option:
   - Sæt **Flat pris (øre)** (fx 3900 = 39,00 DKK), og/eller
   - **Vægtbands:** Tilføj rækker (op til X gram → pris i øre), fx 2000 gram → 3900, 5000 gram → 4900. Klik **Gem priser**.

### 3. Storefront: Checkout med fragt

1. Start storefront: `cd apps/storefront && pnpm dev`.
2. Gå til shop (fx `http://localhost:3000`), tilføj et produkt til kurven og gå til checkout.
3. Udfyld **Leveringsadresse** (fx dansk adresse med postnummer 1000).
4. I **Levering** skal I se Shipmondo-options (navn og pris). Vælg én (fx GLS Pakkeshop).
5. Indtast **postnummer**, søg pakkeshop, vælg en pakkeshop. Prisen skal matche det I sat i Admin (flat eller vægtbands).
6. Gå videre til **Betaling**, brug Stripe testkort (fx 4242 4242 4242 4242), og afslut ordren.

### 4. Admin: Fulfillment (dry-run)

1. I Medusa Admin: **Orders** → åbn den netop oprettede ordre.
2. I **Unfulfilled items** (eller tilsvarende): vælg **Fulfill items** / **Opret fulfillment**.
3. Vælg **Location** og opret fulfillment. Med `SHIPMONDO_DRY_RUN=true` simuleres label – ingen kald til Shipmondo til oprettelse af rigtig forsendelse.

### Hurtig sanity check uden Stripe

- **Kun fragt og priser:** Gå til checkout, udfyld adresse, tjek at Shipmondo-options vises med de priser I sat i Settings → Shipmondo. Stop før betaling.
- **Kun Admin:** Efter seed kan I gå direkte til Settings → Shipmondo og tjekke at produkter loades, sync kører, og priser kan gemmes (uden at gennemføre en ordre).
