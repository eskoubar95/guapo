# Data model: Medusa vs Payload (katalog og indhold)

**Formål:** Tydelig regel for hvem der "ejer" hvad og hvordan man opretter/redigerer i Payload, så kataloget ikke duplikeres og Medusa forbliver kilde til identitet.

---

## 1. Grundregel

- **Medusa** ejer **kataloget**: produkter, kategorier (product_category + product_category_product), produkttyper, brands (metadata.brand). Medusa bestemmer *hvad der findes*.
- **Payload** ejer **indholdet**: CMS-felter (SEO, brødtekst, how-to, ingredients, routines, beneficials) *på baggrund af* det, der findes i Medusa.
- Payload-collections **Products**, **Categories** og **Brands** er derfor **ikke** frie "opret hvad du vil"-collections. De er **overlejringer**: ét dokument per produkt/kategori/brand, nøglet efter **handle** eller **brandKey** fra Medusa.

---

## 2. Oprettelse i Payload

- **Produkter:** Du opretter *ikke* et nyt produkt i Payload som ikke findes i Medusa. Du kan kun tilføje et "product content"-dokument for et **eksisterende** Medusa-produkt (via handle). Enten vælger du fra listen fra Medusa (dropdown / "Tilføj fra Medusa"), eller du indtaster et handle der allerede findes i Medusa – ellers blokerer valideringen.
- **Kategorier:** Samme princip. Et Category-dokument i Payload skal have en **handle** der matcher en eksisterende Medusa product_category. Ingen "opfindelse" af kategorier kun i Payload.
- **Brands:** Samme. **brandKey** skal matche en værdi fra Medusa (fx `product.metadata.brand`). Kun brands der findes i kataloget kan få et Brand-dokument i Payload.

**Teknisk:** Ved create validerer Payload (via `beforeValidate`) at handle/brandKey findes i Medusa (via Medusa Store API). Hvis ikke, gives en fejlbesked. Hvis Medusa er utilgængelig (fx ingen MEDUSA_STORE_URL), springes valideringen over så lokale miljøer kan køre uden Medusa – i produktion bør Medusa være tilgængelig.

---

## 3. product_category_product og "synk"

- **product_category_product** (hvilke produkter der hører til hvilken kategori) lever **kun** i Medusa. Payload gemmer ikke den relation.
- Storefront: henter kategori-handle fra Payload (Category-dokument) og beder Medusa om "produkter i denne kategori". Ingen synk af product_category_product til Payload.
- **Synkretning:** For **produkter** er sync **Medusa-drevet**: når et produkt oprettes i Medusa (`product.created`) oprettes tilsvarende dokument i Payload; når et produkt slettes i Medusa (`product.deleted`) slettes det også i Payload. Manual sync: **`POST /admin/payload/sync/products`** (i Medusa) emitter `products.sync-payload` og opretter alle Medusa-produkter der endnu ikke har et Payload-dokument (filter: `!metadata.payload_id`). Payload accepterer **kun** create/delete på Products fra Medusa (header `x-medusa-sync-secret` eller API key + query `is_from_medusa=true`). For kategorier og brands kan du stadig bruge **`POST /api/medusa/sync`** (CMS) som bootstrap; fuld Medusa-drevet sync for categories/brands er planlagt i Phase 2.

---

## 4. Hvad kan man frit oprette i Payload?

- **Pages, Articles, Media, Navigation, Footer, Homepage:** Frit indhold; ingen krav om Medusa.
- **Ingredients, Routines, Beneficials:** Redaktionelle lister; oprettes i Payload uden reference til Medusa.
- **ProductGuidance:** Historisk model; productIdentifier bør matche Medusa handle.
- **Products, Categories, Brands:** Kun med handle/brandKey der findes i Medusa (valideret ved create).

---

## 5. Kort reference

| Payload collection | Nøgle fra Medusa | Oprettelse i Payload |
|--------------------|-------------------|------------------------|
| Products           | `handle`          | Kun hvis handle findes i Medusa |
| Categories         | `handle`          | Kun hvis handle findes i Medusa (product_category) |
| Brands             | `brandKey`        | Kun hvis brandKey findes i Medusa (metadata.brand) |

---

## 6. Status: hvad er bygget vs. dokumenteret

| Del | Status | Beskrivelse |
|-----|--------|-------------|
| **Regler (hvem ejer hvad)** | ✅ Dokumenteret | spec/10, denne fil – Medusa = katalog, Payload = indhold. |
| **Validering ved create** | ✅ Implementeret | Products/Categories/Brands: handle/brandKey skal findes i Medusa (beforeValidate). |
| **Proxy (GET products/categories/brands)** | ✅ Implementeret | `/api/medusa/*` – admin kan hente lister fra Medusa. |
| **Sync (fyld Payload fra Medusa)** | ✅ Implementeret | `POST /api/medusa/sync` opretter Payload-dokumenter for alle Medusa-entiteter der mangler. Kør denne efter opstart eller når nye produkter/kategorier er tilføjet i Medusa. |
| **"Tilføj fra Medusa"-knap i admin** | ❌ Ikke bygget | Man kan køre sync (curl/script) eller manuelt oprette med et handle der findes i Medusa. En knap i Payload-admin der kalder sync eller viser dropdown "vælg produkt fra Medusa" er ikke implementeret. |
| **Slet/opdater ved sletning i Medusa** | ✅ Produkter | Medusa `product.deleted` → subscriber → Payload API delete (where medusa_id). Categories/brands: Phase 2. |

**Kort:** For at se produkter i Payload skal du køre **`POST http://localhost:3001/api/medusa/sync`** (mens både CMS og Medusa kører og MEDUSA_STORE_URL er sat). Så oprettes der ét Payload-dokument per Medusa-produkt/kategori/brand, og du kan redigere CMS-indhold i admin.

Se også: `spec/10-cms-commerce-synergy.md`, `apps/cms/docs/medusa-proxy.md`.
