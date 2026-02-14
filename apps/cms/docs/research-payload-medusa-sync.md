# Research: Payload–Medusa sync – robust og gennemtænkt model

**Formål:** Afklare hvordan product data (og evt. categories/brands) bedst holdes synkroniseret mellem Medusa-skema og Payload, så det er Medusa der styrer livscyklus (create/delete), og Payload kun tilføjer SEO, meta, guidance, ingredients osv. – uden at bygge i blinde.

---

## 1. Ønsket billede (din formulering)

- **Medusa schema:** Al commerce-data (produkter, kategorier, varianter, priser, lager). Medusa-appen kører herfra.
- **Payload (vores schema):** Indhold og redaktion (SEO, meta, guidance, ingredients, routines, beneficials) **på baggrund af** det der findes i Medusa.
- **Synk:** Alt der sker omkring products (og evt. categories/brands) på backend-niveau i Medusa **synkroniseres** med noget tilsvarende i Payload: når et produkt oprettes i Medusa, oprettes der et “product content”-dokument i Payload; når et produkt **slettes** i Medusa, **slettes** det også i Payload. To “tabeller” (Medusa product + Payload Products) holdes dermed i sync.
- I Payload kan man gå ind på hvert product og kun tilføje ekstra: SEO, meta, guidance, ingredients osv. – ikke opfinde nye produkter.

---

## 2. Hvad Medusa officielt anbefaler (Payload-integration)

Medusa har en **officiel guide** til at integrere Payload med Medusa:

- **Kilde:** [Integrate Payload CMS with Medusa](https://docs.medusajs.com/resources/integrations/guides/payload) (step-by-step) og [blogpost](https://medusajs.com/blog/payload-integration/).
- **Kernepunkter:**
  - **Medusa styrer livscyklus.** Payload opretter/sletter produkter **kun** når Medusa beder om det (via API-kald med `is_from_medusa`). I Payload-admin er create/delete på Products **slået fra** for almindelige brugere; kun anmodninger der kommer “fra Medusa” (med hemmelighed/API key) må oprette/slette.
  - **Event-drevet sync:** Når et produkt **oprettes** i Medusa → event `product.created` → en **subscriber** i Medusa kører → en **workflow** henter produktdata fra Medusa og kalder Payload API (create). Når et produkt **slettes** i Medusa → event `product.deleted` → subscriber → workflow kalder Payload API (delete). Så de to “tabeller” holdes i sync **fra Medusa’s side**.
  - **Manual sync:** Der er også en “Sync products to Payload”-knap i Medusa Admin (Settings → Payload), der emitter et event og dermed opretter alle Medusa-produkter der endnu ikke findes i Payload.
  - **Virtual link:** I Medusa kan man definere en read-only link fra Product (Medusa) til Payload’s Products (fx `payload_product`). Så kan storefront hente produkt + Payload-indhold i ét kald mod Medusa; Medusa henter Payload-data via sit eget modul.
  - **Ét lag “product” i Payload:** Payload har én Products-collection med felter der både kan komme fra Medusa (id, handle, title, options, variants) og fra redaktør (description, SEO, images). Når Medusa opretter/opdaterer, fyldes Medusa-felterne; redaktører må kun redigere indholds-felter og må ikke tilføje/fjerne options/variants (validering i Payload).

I den officielle guide ligger **Payload i storefront-appen** (samme Next.js) med egen database. I vores setup har vi **Payload i en separat app** (apps/cms) og **Medusa i apps/commerce**. Det ændrer ikke idéen: **sync-logikken bør ligge i Medusa** (subscribers + workflows), og Medusa kalder **Payload’s API** (CMS URL + API key) for at oprette/opdatere/slette.

---

## 3. Vores nuværende model vs. robust model

| Aspekt | Vores model lige nu | Robust model (Medusa-drevet) |
|--------|----------------------|------------------------------|
| **Hvor oprettes Payload-dokumenter?** | CMS: man kører `POST /api/medusa/sync` (eller opretter manuelt med handle). | Medusa: ved `product.created` (og evt. manual “Sync to Payload”) kalder Medusa Payload API og opretter. |
| **Hvem må oprette/slette Products i Payload?** | Validering: kun handles der findes i Medusa. Men tekniske brugere kan stadig køre sync eller oprette med gyldigt handle. | Kun anmodninger “fra Medusa” (API med is_from_medusa / API key). Create/delete i Payload-admin slået fra for brugere. |
| **Sletning i Medusa** | Ingen effekt i Payload. Payload-dokumentet bliver stående (weesel). | Medusa emitter `product.deleted` → subscriber → workflow kalder Payload API og sletter dokumentet. To tabeller forbliver i sync. |
| **Opdatering (title, handle, options, variants)** | Ikke automatisk. Kun ved manuel sync eller manuel redigering. | Officiel guide har workflows for variant/option create/update/delete, så Payload’s kopi af struktur opdateres fra Medusa. |
| **Kilde til sandhed** | Medusa er kilde til “hvad findes”; Payload har en kopi af identitet (handle) + overlay. | Samme, men **Medusa er også den der pusher** create/update/delete til Payload, så Payload altid afspejler Medusa’s livscyklus. |

Kort sagt: Vi har **dokumenteret** at Medusa ejer kataloget og Payload kun er overlay, og vi har **validering** mod Medusa ved create. Men vi har **ikke** fået bygget den anden halvdel: at **Medusa** selv driver sync (opret ved create, slet ved delete, evt. opdater ved ændringer). Den robuste løsning kræver derfor **kode i Medusa** (apps/commerce), ikke kun i Payload.

---

## 4. Samme database, to schemas – behøver vi DB-triggers?

- Vi har allerede **to schemas** i samme Postgres (Supabase): `medusa` og `payload`. Det er fint.
- **Sync behøver ikke** at ske med DB-triggers (fx “når der slettes i medusa.product, slet i payload.products”). Medusa og Payload er to forskellige applikationer med hver deres ORM/migrations; at koble dem med triggers på tværs af schemas giver snørklet fejlhåndtering, transaktioner og deployment.
- Den anbefalede måde er **applikationslag**: Medusa udsender events ved create/update/delete; **subscribers** i Medusa-appen kalder Payload’s **REST API** (create/update/delete). Så er det tydeligt hvem der ejer livscyklus (Medusa), og Payload er en “tjeneste” Medusa kalder for at holde CMS-laget opdateret.
- **Virtual link / én forespørgsel:** I Medusa kan man (som i guiden) definere en link til Payload, så når storefront henter product fra Medusa, kan Medusa selv hente payload_product og inkludere det. Det kræver at Medusa kender Payload URL og evt. API key og at Payload eksponerer et endpoint Medusa kan kalde (fx find by medusa_id). Det kan vi tilføje senere hvis vi vil have “ét kald fra storefront til Medusa og få produkt + Payload-indhold”.

---

## 5. Anbefaling: sti mod robust løsning

1. **Behold nuværende Payload-model:**  
   Products (og evt. Categories, Brands) med handle/brandKey fra Medusa + kun CMS-felter (SEO, guidance, ingredients, osv.). Validering ved create: handle skal findes i Medusa.  
   **Tilføj:** Payload’s Products-collection accepterer **create/delete kun fra “Medusa”** (fx via query-param `is_from_medusa` + API key eller dedikeret service-user). Det matcher officiel guide og gør at redaktører ikke ved et uheld sletter eller opretter products i Payload.

2. **Implementer Medusa-drevet sync (i apps/commerce):**  
   - **Payload-modul i Medusa:** En lille modul i `apps/commerce` der kan kalde Payload API (create/update/delete) med Payload server URL og API key (env: `PAYLOAD_SERVER_URL`, `PAYLOAD_API_KEY`).  
   - **Subscribers:**  
     - `product.created` → workflow der henter produkt fra Medusa og kalder Payload create (med handle, title, evt. andre felter Medusa skal pushe).  
     - `product.deleted` → workflow der kalder Payload delete (where handle eller medusa_id = deleted product).  
   - **Manual sync:** API-route eller admin-knap i Medusa der emitter event (fx `products.sync-payload`) så alle produkter der ikke allerede findes i Payload oprettes (som i officiel guide).  
   - Evt. samme mønster for **categories** og **brands** hvis Medusa har events (product_category.created/deleted osv.) og vi vil have dem synkroniseret.

3. **CMS sync-endpoint (POST /api/medusa/sync):**  
   Kan **beholdes** som “bootstrap” eller fallback: første gang eller efter større import i Medusa kan man køre sync fra CMS for at fylde Payload ud uden at skulle deploye Medusa-subscribers først. På sigt kan den samme funktionalitet ligge i Medusa (manual “Sync to Payload”-knap).

4. **Dokumentation:**  
   Opdater `spec/10-cms-commerce-synergy.md` og `apps/cms/docs/data-model-medusa-payload.md` med: “Sync er Medusa-drevet: product.created/product.deleted (og evt. manual sync) i Medusa trigger create/delete i Payload via Payload API. Payload tillader kun create/delete fra Medusa (API key).”

---

## 6. Kort opsummering

- **To tabeller (Medusa product + Payload Products) holdes i sync** ved at **Medusa** reagerer på egne events (create/delete) og kalder **Payload’s API** for at oprette/slette. Det er den robuste og officielt anbefalede tilgang.
- **Samme DB med medusa- og payload-skema** er fint; sync sker **ikke** med DB-triggers men med **applikationslogik i Medusa** (subscribers + workflows + Payload API).
- Vi har allerede lagt det meste af **Payload-siden** (validering, sync-endpoint, dokumentation). Det der **mangler** for at det er “fuldt gennemtænkt” er **Medusa-siden**: Payload-modul + subscribers for product.created/product.deleted (+ evt. manual sync og categories/brands hvis ønsket).

Næste skridt kan være at implementere Payload-modulet og subscribers i `apps/commerce` efter [Medusa’s Payload-integration guide](https://docs.medusajs.com/resources/integrations/guides/payload), tilpasset til vores monorepo (Payload i apps/cms, Medusa i apps/commerce, begge kører separat).

**Fuld implementeringsplan** (alle content-relevante datapunkter: products, categories, product types, brands): `apps/cms/docs/payload-medusa-sync-plan.md`.
