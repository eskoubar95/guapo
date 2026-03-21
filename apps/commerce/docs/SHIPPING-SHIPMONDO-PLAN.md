# Plan: Shipmondo + Medusa shipping synkronisering

> **Historisk / forældet:** Dette dokument beskriver en **ældre** arkitektur (fx hardcoded 39 kr, fælles “Pakkeshop”-option, ingen vægt-DB). Den **aktuelle** integration (dynamiske carriers, `price_bands`, kurvvægt fra DB, sandbox, webhooks, `verify:shipmondo`) er dokumenteret i **[SHIPMONDO.md](./SHIPMONDO.md)** og i koden under `src/modules/shipmondo/`. Behold denne fil kun som arkiv over oprindelige faser; brug den ikke som eneste sandhed for nye opgaver.

Dette dokument beskriver **nuværende tilstand**, **huller** og en **faset plan** for at få shipping (Shipmondo, Medusa Admin, priser, vægt) 100 % synkroniseret uden hardcoding. Planen anbefales læst og godkendt før implementering.

---

## 1. Nuværende tilstand

### 1.1 Medusa config (`medusa-config.ts`)

- **Fulfillment providers:** `manual` (altid) + `shipmondo` (når `SHIPMONDO_API_USER`+`SHIPMONDO_API_KEY` eller `SHIPMONDO_SHIPPING_MODULE_KEY`).
- Shipmondo provider id: `"shipmondo"` → fulde provider_id i systemet: **`shipmondo_shipmondo`**.

### 1.2 Seed (`src/scripts/seed.ts`)

- **Stock location:** "European Warehouse" oprettes/linkes til sales channel.
- **Fulfillment-links:** Både **manual_manual** og **shipmondo_shipmondo** linkes til samme stock location.
- **Shipping profile:** "Default Shipping Profile" (type default).
- **Service zone:** "Denmark" på **første** fulfillment set på stock location (`locSets[0]`), geo_zone: country DK.
- **Shipping option:** Kun én option oprettes når Shipmondo-env er sat:
  - Navn: "Pakkeshop (39 kr)"
  - `provider_id`: `shipmondo_shipmondo`
  - `price_type`: `flat`
  - `prices`: `[{ currency_code: "dkk", amount: 3900 }]`
  - Type: `{ label: "Pakkeshop", description: "GLS/DAO pakkeshop", code: "gls-pakkeshop" }`
- **Rydning:** Seed fjerner ældre optioner ("Standard Levering", "Ekspres" osv.) fra samme zone.

### 1.3 Shipmondo-modul (`src/modules/shipmondo/service.ts`)

- **getFulfillmentOptions():** Returnerer kun `gls-pakkeshop` og `dao-pakkeshop` (hardcoded).
- **calculatePrice():** Returnerer altid **3900** (39 DKK) – ingen vægt, ingen carrier-specifik pris.
- **createFulfillment():**
  - Vægt: `totalWeight = items.reduce(..., 500g per item) || 2000` – **ingen brug af produkt/variant weight**.
  - Product codes: **GLSDK_SD** (GLS) / **DAO_SD** (DAO) hardcodet ud fra option type.
- **Pickup points:** Bruger Shipmondo API (`/pickup_points` eller `/service_point/service_points`) via `apps/commerce/src/api/store/pickup-points/route.ts`.

### 1.4 Storefront

- Pris i checkout kommer fra: `listCartOptions` (amount/prices) eller fallback **3900** (39 kr) når calculate ikke bruges (pga. "Manual fulfillment does not support price calculation").
- GLS/DAO vælges via pakkeshop-sheet; én Medusa shipping option ("Pakkeshop (39 kr)") dækker begge operatører.

### 1.5 Medusa Admin

- Shipping profiles, service zones og shipping options kan også oprettes/redigeres i Admin.
- Hvis der i Admin (eller ved tidligere seed) er oprettet options med **manual** som provider, kan `listCartOptions` returnere dem; kaldes **calculate** på en manual-option, får man fejlen "Manual fulfillment does not support price calculation".

---

## 2. Identificerede huller og risici

| Område | Problem |
|--------|--------|
| **Provider/option-rode** | Samme stock location har både manual og Shipmondo. Hvis der findes en **manual**-option i Denmark-zonen (fx oprettet i Admin), kan den returneres af `listCartOptions` og give 500 ved calculate. |
| **Pris** | 39 DKK er hardcodet i Shipmondo-modullet og i storefront-fallback. Shipmondo har operatør- og vægtafhængige priser – disse bruges ikke. |
| **Operatører** | GLS og DAO håndteres som én fælles "Pakkeshop (39 kr)"-option; product_code vælges ud fra valgt pakkeshop. Priser kan være forskellige pr. operatør. |
| **Vægt** | Produkter har **ingen vægt** i systemet. Shipmondo-modullet bruger 500 g per line item eller 2 kg total. Vægtintervaller og priser fra Shipmondo (carrier setup / products API) bruges ikke. |
| **Kilde til sandhed** | Shipping options, priser og product codes er ikke hentet fra Shipmondo API (carrier setup / products); alt er defineret i seed + kode. |
| **Admin vs. seed** | Ændringer i Medusa Admin (nye zones, optioner, profiler) kan komme i konflikt med seed eller overskrives ved næste seed. |

---

## 3. Shipmondo API – relevante dele

- **Carrier setup file:** `GET /setups/carriers` (async, polling) returnerer et stort JSON med:
  - **Carriers** (fx GLS, DAO) med **products** (fx GLSDK_SD, DAO_SD).
  - **country_combinations** med `sender_country_code`, `receiver_country_code`, `required_parcel_fields` (fx `quantity`, `weight`), **available_services**, **required_services**.
- **Products/weight:** Shipmondo understøtter vægtintervaller pr. produkt; priser kan variere med vægt og land.
- **Parcel:** `weight` i gram er obligatorisk for de produkter vi bruger; avancerede produkter kan kræve length/width/height.
- **Dokumentation:**  
  - [Retrieve and use the carrier setup file](https://shipmondo.dev/docs/api/retrieve-and-use-the-carrier-setup-file/)  
  - [Advanced Parcels](https://shipmondo.dev/docs/api/carrier-specific/advanced-parcels/)  
  - [Working with the API](https://shipmondo.dev/docs/category/working-with-the-api/)

---

## 4. Medusa – shipping-struktur

- **Shipping profile:** Knytter produkter til leveringsregler (fx "Default Shipping Profile").
- **Stock location** → har **fulfillment sets**; hvert set kan have **service zones** (geo + optioner).
- **Shipping option:** Tilhører en service zone og en **provider** (`provider_id`); har `price_type` (flat/calculated) og `prices` eller beregning via provider.
- **listCartOptions:** Returnerer options for cart’s region/address ud fra de fulfillment sets der er knyttet til cart’s stock location; hver option har et `provider_id`.
- **calculate (Store API):** Kalder den **provider** der hører til den valgte option. Manual-provideren understøtter **ikke** calculate → 500 hvis optionen er manual.

---

## 5. Supabase / database

- Shipping data (profiles, zones, options, links) ligger i **Medusa’s database** (Postgres). Hvis I kører Medusa mod Supabase Postgres, er det samme database.
- **Supabase MCP** kan bruges til at:
  - Tjekke at de rigtige tabeller/views findes (fulfillment, shipping_options, service_zones, links).
  - Verificere at shipping options for Denmark-zonen har `provider_id` = `shipmondo_shipmondo` og at ingen uønskede manual-options bruges i checkout-flowet.
  - Efter migreringer/seed: validere at links mellem stock_location, fulfillment_provider og fulfillment_sets er korrekte.

---

## 6. Faset plan (anbefaling – uden kode endnu)

### Phase 1: Rent provider- og option-setup (Medusa + Admin)

**Mål:** Kun Shipmondo-options bruges til pakkeshop i DK; ingen 500 fra manual calculate.

1. **Tilstand i DB (fx via Supabase MCP):**
   - List shipping options for Denmark service zone(erne); notér `provider_id` for hver.
   - Find eventuelle options med `provider_id` = manual i de zones som bruges i checkout.
2. **Ryd op:**
   - I seed: Sørg for at **alle** shipping options i Denmark-zonen, som bruges til pakkeshop, har `provider_id` = `shipmondo_shipmondo`.
   - Overvej at fjerne eller ikke længere tildele manual-optioner til Denmark-zonen (eller kun bruge manual til andre formål uden for listCartOptions for DK).
3. **Dokumentation:**
   - Kort beskrivelse i SHIPMONDO.md eller denne fil: Hvilke options der findes, hvilken zone og hvilken provider de har. Så Admin og seed ikke laver konflikt.

**Resultat:** Checkout kalder ikke calculate på manual; pris kommer fra option (flat) eller fra Shipmondo calculate når I senere slår det til for Shipmondo-optioner.

---

### Phase 2: Shipmondo som kilde til produkter og (evt.) priser

**Mål:** Product codes og operatører kommer fra Shipmondo, ikke hardcoded strenge.

1. **Carrier setup eller Products API:**
   - Hent tilgængelige carriers og products (fx via carrier setup file eller products-endpoint) for DK → DK.
   - Identificér pakkeshop-products (fx GLSDK_SD, DAO_SD eller de codes I faktisk har i jeres Shipmondo-aftale).
2. **Medusa shipping options:**
   - Overvej én option per operatør (fx "GLS Pakkeshop" og "DAO Pakkeshop") med hver sin `provider_id` = shipmondo og type/code som matcher Shipmondo product code.
   - Eller behold én fælles option og gem valgt operatør/product_code i fulfillment data (som nu) – men lad product codes være defineret ud fra Shipmondo-data (config/cache), ikke hardcoded i service.ts.
3. **Shipmondo-modul:**
   - Erstat hardcoded `getFulfillmentOptions()` med dynamisk liste baseret på Shipmondo carrier setup/products (evt. cache med TTL).
   - I `createFulfillment`: brug product_code fra option type/data i stedet for fast GLSDK_SD/DAO_SD.

**Resultat:** Operatører og product codes er styret af Shipmondo API; Medusa Admin/seed definerer option-navne og zone, men ikke Shipmondo-specifikke koder.

---

### Phase 3: Vægt på produkter og brug i shipping

**Mål:** Kurvvægt bruges i både prisberegning og fulfillment.

1. **Medusa:**
   - Sikr at produktvariant og/eller inventory item har **weight** (og evt. dimensioner) – Medusa v2 understøtter dette. Opdater seed/Admin så nye produkter får vægt.
2. **Cart → total weight:**
   - I checkout-flow: beregn total kurvvægt fra line items (variant weight × quantity). Enten i storefront (fra cart items) eller via Medusa (hvis cart/line item uden for inventory kan udvides med weight).
3. **Shipmondo-modul:**
   - **calculatePrice():** Modtag context med cart/kurvvægt; brug Shipmondo priser (hvis tilgængelige via API) eller interne regler baseret på vægtintervaller. Hvis Shipmondo ikke eksponerer priser via API, kan I beholde flat 39 DKK indtil I har en anden kilde (fx aftale-priser i config).
   - **createFulfillment():** Brug aggregeret vægt fra order items (variant/inventory weight) i stedet for 500g per item; send korrekt `parcels: [{ weight }]` til Shipmondo.

**Resultat:** Fulfillment og (når muligt) priser afspejler reel kurvvægt; ingen faste 500g/2kg.

---

### Phase 4: Priser uden hardcoding (fuld integration)

**Mål:** Priser kommer fra Shipmondo eller central konfiguration, ikke 3900 i kode.

1. **Priskilde:**
   - Hvis Shipmondo API giver priser pr. product/vægt/land: Hent dem (carrier setup eller andet endpoint) og brug i `calculatePrice()`.
   - Hvis ikke: Vedligehold en **konfiguration** (fx env, config fil eller Admin-defineret) med priser pr. operatør og evt. vægtinterval, og brug den i `calculatePrice()` i stedet for FLAT_RATE_MINOR.
2. **Medusa option:**
   - Overvej `price_type: "calculated"` for pakkeshop-optioner, så Medusa kalder `calculatePrice()` på Shipmondo-provideren og prisen vises korrekt i listCartOptions/calculate-svar. Kræver at Phase 1 er løst (kun Shipmondo-options i zone).
3. **Storefront:**
   - Fjern fallback 3900 når backend konsekvent returnerer priser (fra option.prices eller calculate).

**Resultat:** Ingen hardcodet 39 DKK; priser styret af Shipmondo eller jeres egen konfiguration.

---

### Phase 5: Admin og vedligeholdelse

**Mål:** Shipping kan administreres i Medusa Admin uden at bryde med Shipmondo og seed.

1. **Dokumentation til Admin-brugere:**
   - Hvordan man opretter/redigerer shipping profiles, service zones og shipping options.
   - At pakkeshop-options **skal** have provider = Shipmondo og (hvis I bruger det) korrekt type/code der matcher Shipmondo-modullet.
2. **Seed idempotens:**
   - Seed bør fortsat kun **tilføje/matche** options (fx ved navn eller type), ikke ubetinget overskrive Admin-ændringer, medmindre I eksplicit vil have "single source of truth" i seed.
3. **Evt. synkronisering:**
   - Hvis I vil have Admin som "master": Overvej en lille job eller admin-trigger der henter carrier/product-data fra Shipmondo og opdaterer option-metadata (fx product_code) uden at ændre priser manuelt i Admin hver gang Shipmondo ændrer noget.

---

## 7. Anbefalet rækkefølge

1. **Phase 1** (provider/option oprydning + evt. Supabase MCP-validering) – hurtig win, fjerner 500 og forvirring om manual vs. Shipmondo.
2. **Phase 2** (Shipmondo som kilde til operatører/product codes) – fjerner hardcoding af GLSDK_SD/DAO_SD og gør det nemmere at tilføje flere operatører senere.
3. **Phase 3** (vægt på produkter + brug i fulfillment og evt. calculate) – forbereder vægtbaserede priser og korrekte forsendelser.
4. **Phase 4** (priser fra Shipmondo/config) – når I har besluttet priskilde (API vs. config).
5. **Phase 5** (Admin-dokumentation og seed-strategi) – løbende, kan startes parallelt med 1–2.

---

## 8. Korte svar på spørgsmål

- **Hvor står vi nu?** Shipmondo er registreret; én flat "Pakkeshop (39 kr)"-option med provider Shipmondo; priser og product codes er hardcodet; vægt bruges ikke; risiko for manual-option i samme zone.
- **Hvordan får vi det 100 % synkroniseret?** Ved at bruge Phase 1–5: kun Shipmondo-options til pakkeshop, data fra Shipmondo API (carriers/products), vægt fra produkter, priser fra API eller config, og tydelig Admin/seed-strategi.
- **Supabase MCP:** Brug til at læse/validere Medusa’s fulfillment- og shipping-tabeller så provider_id og zones er som forventet.
- **Vægt:** Medusa understøtter weight på variant/inventory; I bør tilføje vægt til produkter og derefter bruge den i Shipmondo-modullet (Phase 3).

Når denne plan er godkendt, kan konkrete opgaver (tasks) deles ud på de enkelte faser og implementeres trin for trin.
