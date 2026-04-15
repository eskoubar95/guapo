# Plan: Medusa → Payload sync for al content-relevant data

**Formål:** Én plan der dækker **alle** Medusa-datapunkter som kan have ekstra indhold i CMS (produkter, kategorier, produkttyper, brands – og evt. tags). Sync skal være Medusa-drevet og korrekt sat op fra start.

**Reference:** `apps/cms/docs/research-payload-medusa-sync.md`, [Medusa Payload integration guide](https://docs.medusajs.com/resources/integrations/guides/payload), `spec/10-cms-commerce-synergy.md`.

---

## 1. Oversigt: content-relevante entiteter i Medusa

| Entitet | Medusa kilde | Canonical key | SEO/content-sider | Payload collection i dag |
|--------|---------------|---------------|-------------------|---------------------------|
| **Product** | `product` (handle, title, variants, …) | `handle` | PDP: guidance, ingredients, how-to, SEO | ✅ Products |
| **Product category** | `product_category` (handle, name) | `handle` | Kategoriside: hero, body, SEO | ✅ Categories |
| **Product type** | `product_type` (value, fx "serum", "cleanser") | `value` | Produkttypeside: "Alle serums", SEO | ❌ Mangler |
| **Brand** | `product.metadata.brand` (aggregeret) | `brandKey` (string) | Brandside: logo, body, SEO | ✅ Brands |
| **Product tag** (valgfri) | `product_tag` (value, fx skin type, concern) | `value` | Tag/concern-side: SEO | ❌ Kan bruge Beneficials eller egen collection |

Alle disse bør kunne:
- **Oprettes/slettes i Medusa** → tilsvarende dokument oprettes/slettes i Payload (Medusa-drevet sync).
- **I Payload:** Redaktør tilføjer kun CMS-overlay (SEO, meta, brødtekst, billeder); identitet (handle/value/brandKey) kommer fra Medusa.

---

## 2. Entitet-for-entitet: hvad der findes og hvad der skal gøres

### 2.1 Products

| Aspekt | Nuværende | Skal gøres |
|--------|-----------|------------|
| Payload | Products (handle, title, + CMS-felter). Validering: handle skal findes i Medusa. | Tillad create/delete **kun** fra Medusa (API key / `is_from_medusa`). Evt. skjul "Create"/"Delete" i admin for normale brugere. |
| Medusa | product.created / product.deleted (og evt. product.updated). | Payload-modul + subscribers + workflows: ved create → POST Payload products; ved delete → DELETE Payload product (where handle). Manual sync-event (alle produkter). |
| CMS overlay | howTo, ingredients, beneficials, routines, pairWith, precautions, SEO (evt. i meta). | Behold. Redaktør redigerer kun disse. |

### 2.2 Categories (product_category)

| Aspekt | Nuværende | Skal gøres |
|--------|-----------|------------|
| Payload | Categories (handle, name, heroImage, meta, body). Validering: handle fra Medusa. | Samme som Products: create/delete kun fra Medusa. |
| Medusa | product_category.created / product_category.deleted (Medusa v2 har disse under product-modul). | Payload-modul: create/delete i Payload categories. Workflow + subscriber. Manual sync for categories. |
| CMS overlay | name (override), heroImage, meta (SEO), body. | Behold. |

### 2.3 Product types (product_type)

| Aspekt | Nuværende | Skal gøres |
|--------|-----------|------------|
| Payload | **Ingen** collection. Kun proxy GET /api/medusa/product-types (string[]). | **Opret** collection **ProductTypes**: felt `value` (unikt, fra Medusa), evt. `name`, heroImage, meta, body. Validering: value skal findes i Medusa. Create/delete kun fra Medusa. |
| Medusa | product_type er ofte styret via product-modulet; tjek om der findes events (product_type.created/deleted) eller om typer kommer ind via produkter. | Hvis events findes: subscribers + workflows. Ellers: manual sync (hent /store/product-types, opret manglende i Payload). |
| CMS overlay | name (display), hero, meta, body for "Serum"-siden osv. | Nye felter i ProductTypes. |

### 2.4 Brands (metadata.brand)

| Aspekt | Nuværende | Skal gøres |
|--------|-----------|------------|
| Payload | Brands (brandKey, displayName, logo, meta, body). Validering: brandKey fra Medusa. | Create/delete kun fra Medusa. |
| Medusa | Ingen dedikeret "brand"-entitet; brands = distinkte værdier fra product.metadata.brand. GET /store/brands (custom route). | Ingen "brand.created"-event. Sync: **periodisk eller manual** – hent brands fra Medusa, opret manglende i Payload, evt. slet Payload-brand hvis ingen produkter har den brand længere (kan være senere fase). |
| CMS overlay | displayName, logo, meta, body. | Behold. |

### 2.5 Product tags (valgfri)

| Aspekt | Nuværende | Skal gøres |
|--------|-----------|------------|
| Payload | Beneficials (eget redaktionelt sæt). Ingen 1:1 med product_tag. | Valgfrit: collection **TagPages** eller udvid Beneficials med `tagValue` fra Medusa og sync; eller lad tags kun være filter uden dedikeret CMS-side. |
| Medusa | product_tag (value). | Hvis vi vil have tag-sider: manual/periodisk sync (distinct tags → opret i Payload). Events for tag create/delete afhænger af Medusa. |
| CMS overlay | SEO, brødtekst for "Acne"- eller "Tør hud"-siden. | Valgfrit. |

---

## 3. Fælles krav på Payload-siden

For **alle** content-relevante collections (Products, Categories, Brands, og når den findes ProductTypes):

1. **Canonical key** er altid fra Medusa (handle, value, brandKey). Redaktør må ikke ændre den; den er read-only eller kun opdateret fra Medusa.
2. **Create/delete** må kun udføres af "Medusa" (anmodninger med gyldig API key eller `is_from_medusa`). I Payload: access control så `create` og `delete` returnerer false for normale brugere, eller vi bruger en dedikeret API-route som kun Medusa kalder (med secret).
3. **Validering** ved manuel create (hvis tilladt): beforeValidate tjekker at key findes i Medusa (som i dag for Products/Categories/Brands).
4. **Sync-endpoint** (POST /api/medusa/sync): Kan udvides til også at oprette ProductTypes og evt. opdatere brands-liste; eller vi flytter "full sync" til Medusa (manual knap der kalder Payload for alle entiteter).

---

## 4. Fælles krav på Medusa-siden (apps/commerce)

1. **Payload-modul**  
   Et modul der kan kalde Payload REST API (create, update, delete, find) med:
   - `PAYLOAD_SERVER_URL` (fx http://localhost:3001)
   - `PAYLOAD_API_KEY` (eller anden auth så Payload accepterer anmodninger "fra Medusa")

2. **Workflows**  
   - Create: hent entitet fra Medusa, map til Payload-felter, POST til Payload.
   - Delete: DELETE til Payload med where (handle/value/brandKey).
   - Update (evt.): PATCH for title/name ændringer der skal spejles i Payload.

3. **Subscribers**  
   - product.created → create product in Payload  
   - product.deleted → delete product in Payload  
   - product_category.created / product_category.deleted → create/delete category in Payload  
   - product_type: hvis events findes, samme mønster; ellers kun manual sync.  
   - Brands: ingen events → kun manual/periodisk sync.

4. **Manual sync**  
   - API-route(s) eller admin-knap(pe) der trigger sync for products, categories, product types, brands (opret manglende i Payload). Evt. én "Sync all to Payload"-knap.

---

## 5. Implementeringsrækkefølge (hvad vi kan gøre nu)

### Phase 1 – Products (basis)

1. **Payload (apps/cms)**  
   - Tilføj access control på Products: `create` og `delete` kun tilladt når request kommer fra Medusa (fx header `x-medusa-sync-secret` eller query `is_from_medusa` + API key). Dokumenter hvordan Medusa skal kalde.  
   - Behold validering (handle skal findes i Medusa) for den vej.  
   - Evt. skjul "Create new" / "Delete" i admin UI for Products (så redaktører ikke forsøger).

2. **Medusa (apps/commerce)**  
   - Opret Payload-modul (service der kalder Payload API med base URL + API key).  
   - Opret workflow createPayloadProduct (hent product, POST til Payload).  
   - Opret workflow deletePayloadProduct (DELETE i Payload where handle).  
   - Subscriber product.created → kør create-workflow.  
   - Subscriber product.deleted → kør delete-workflow.  
   - Manual sync: event products.sync-payload + subscriber der finder alle produkter uden Payload-dokument og opretter.  
   - Env: PAYLOAD_SERVER_URL, PAYLOAD_API_KEY (og evt. PAYLOAD_SYNC_SECRET).

3. **Dokumentation**  
   - Opdater spec/10 og data-model-medusa-payload.md: sync er Medusa-drevet for products; Payload accepterer kun create/delete fra Medusa.

### Phase 2 – Categories og Brands

4. **Payload**  
   - Samme access control på Categories og Brands (create/delete kun fra Medusa).  
   - Dokumenter endpoints (create/delete med where handle eller brandKey).

5. **Medusa**  
   - Workflows + subscribers for product_category.created / product_category.deleted (opret/slet category i Payload).  
   - Brands: ingen events → tilføj manual sync "Sync brands to Payload" (hent /store/brands, opret manglende i Payload). Evt. cron eller admin-knap.

### Phase 3 – Product types (SEO-sider)

6. **Payload**  
   - Opret collection **ProductTypes** med felter: `value` (required, unique, fra Medusa), `name`, heroImage, meta (SEO), body.  
   - Validering: value skal findes i Medusa (fetchMedusaProductTypes).  
   - Access: create/delete kun fra Medusa.  
   - Tilføj til sync-endpoint (POST /api/medusa/sync) så ProductTypes også fyldes, eller kun fra Medusa manual sync.

7. **Medusa**  
   - Hvis product_type har create/delete events: subscribers + workflows.  
   - Ellers: manual sync "Sync product types to Payload" (hent /store/product-types, opret manglende i Payload).

8. **Proxy**  
   - Allerede GET /api/medusa/product-types. Evt. tilføj medusaProductTypeValueExists() til validering (som for products/categories/brands).

### Phase 4 (valgfri) – Tags / concern-sider

9. **Payload**  
   - Beslut: Beneficials udvides med tagValue fra Medusa og sync, eller ny collection TagPages.  
   - Manual sync fra Medusa (distinct product_tag values).

10. **Medusa**  
    - Manual sync for tags (evt. subscriber på product_tag hvis Medusa har det).

---

## 6. Kort checkliste "korrekt opsætning"

- [ ] **Products:** Medusa driver create/delete; Payload tillader kun create/delete fra Medusa; subscribers + workflows i Medusa.
- [ ] **Categories:** Samme; product_category events + workflows.
- [ ] **Brands:** Create/delete kun fra Medusa; manual sync (ingen brand-events).
- [ ] **Product types:** ProductTypes-collection i Payload; value fra Medusa; create/delete kun fra Medusa; manual sync (evt. events hvis tilgængelige).
- [ ] **Payload access:** Alle fire collections (Products, Categories, Brands, ProductTypes) har access control så kun "Medusa" kan create/delete.
- [ ] **Dokumentation:** spec/10, data-model, medusa-proxy og research-note opdateret med at sync er Medusa-drevet for al content-relevant data.
- [ ] **Env:** PAYLOAD_SERVER_URL + PAYLOAD_API_KEY (og evt. sync-secret) i apps/commerce; tilsvarende i Payload så den accepterer kald fra Medusa.

---

## 7. Næste skridt

1. **Godkend planen** (evt. juster rækkefølge eller scope for tags).  
2. **Start med Phase 1 (Products):** Implementer Payload access control + Medusa Payload-modul + product.created/product.deleted subscribers + manual sync.  
3. **Derefter Phase 2 og 3** efter samme mønster.  
4. **Opdater tasks.local.md / Linear** med konkrete tasks (t7.14, t7.15, …) for hver phase så det kan trackes.

Planen ligger her: `apps/cms/docs/payload-medusa-sync-plan.md`. Research-baggrund: `apps/cms/docs/research-payload-medusa-sync.md`.

---

## 8. Status: hvad synkroniserer i dag

| Entitet       | Auto-sync (events)     | Manual sync (Settings) | Seneste sync logget |
|---------------|------------------------|-------------------------|----------------------|
| **Products**  | ✅ product.created/deleted | ✅ Sync to Payload-knap | ✅ Settings → Payload |
| **Categories**| ❌ (kun manual)         | ✅ Sync to Payload-knap | ✅ Settings → Payload |
| **Brands**    | ❌ (kun manual)         | ✅ Sync to Payload-knap | ✅ Settings → Payload |
| **Product types** | ❌ (kun manual)     | ✅ Sync to Payload-knap | ✅ Settings → Payload |

Manual sync og "seneste synkroniseret" håndteres i **Medusa Admin → Settings → Payload**. Sidst synkroniseret gemmes i hukommelsen på serveren (nulstilles ved genstart). Categories, Brands og Product types opretter kun manglende dokumenter i Payload (ingen event-baseret create/delete).
