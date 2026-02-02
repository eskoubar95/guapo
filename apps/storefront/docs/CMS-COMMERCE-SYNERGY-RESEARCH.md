# CMS + Commerce synergy – research og anbefalinger

**Formål:** Analysere hvordan Payload CMS og Medusa Commerce bør bygges op og kobles, så der er én konsistent kobling, rigtig metadata overalt og mulighed for at tracke ned i detaljer. Kun research – ingen kodeændringer.

---

## 1. Nuværende tilstand (kort)

### 1.1 CMS (Payload)

- **Schema:** `payload` (separat fra Medusa i samme Supabase-instans).
- **ProductGuidance:** Collection keyet af `productIdentifier` (Medusa handle eller SKU, “must match exactly”). Indholder: skin types (suitable), concerns (primary), ingredients, howTo, routineTime (AM/PM, order), pairWith (recommended/avoid med productIdentifier), precautions. Ingen i18n på option-værdier (kun EN labels).
- **Homepage:** Sections med `productHandles` (array af handles), categories-section med manuelle title/image/url, brands-banner med manuelle name/logo/url. Featured products og testimonials bruger Medusa handle.
- **Øvrigt:** Pages, Articles, Navigation, Footer. Ingen direkte relation til Medusa-tabeller.

### 1.2 Commerce (Medusa)

- **Schema:** `medusa`. Produkt-tabeller: `product`, `product_category`, `product_category_product`, `product_type`, `product_tag`, `product_tags`, `product_collection`.
- **Kategorier:** Hierarki (Skincare → Cleansers, Serums, Moisturizers, SPF) med `mpath`; ét produkt knyttet til Cleansers.
- **Product type:** Kun én type “Brand” (semantisk forkert – type bør være produkt*art*).
- **Tags:** Ingen tags; `product_tags` tom.
- **Collections:** Tomme.
- **Produkt:** type_id/collection_id/metadata alle null på det ene produkt.

### 1.3 Storefront

- **PDP:** Bruger hardcoded `products`-objekt med guidance indlejret – **ikke** live fra Medusa eller Payload (kommentar: “will come from Medusa + Payload”).
- **Homepage:** Bruger `homeMockProducts` indtil Medusa er koblet på.
- **Medusa SDK:** Konfigureret (baseUrl, publishableKey); bruges endnu ikke til produkt-/guidance-hentning.

---

## 2. Canonical link-nøgle (én kilde til sandhed)

**Anbefaling: Medusa `product.handle` er den eneste reference-nøgle mellem CMS og Commerce.**

- **ProductGuidance.productIdentifier** = Medusa `product.handle` (eksakt match).
- **Homepage featured products** = array af `product.handle`.
- **Testimonials productHandle** = `product.handle`.
- **Pair-with recommended/avoid** = `product.handle`.

Begrundelse:

- Handle er URL-safe, menneskeligt læsbar og bruges allerede i storefront-routes (`/products/[handle]`).
- Én identifikator undgår forvirring mellem id/sku/handle og gør det nemt at tracke (f.eks. `product_view(handle)`).
- Medusa ejer kataloget; CMS refererer til det via handle. Hvis handle ændres i Medusa, skal CMS opdateres (sjældent; kan understøttes med doc/process eller senere webhook).

**SKU:** I dag står der “handle or SKU” i ProductGuidance. For synergi og tracking anbefales det at **kun bruge handle** som productIdentifier, så én nøgle bruges overalt. SKU kan stadig vises på PDP fra Medusa variant-data.

---

## 3. Hvad bor hvor (optimal fordeling)

### 3.1 Medusa (Commerce)

| Område | Indhold | Formål |
|--------|---------|--------|
| **product** | title, handle, description, type_id, collection_id?, metadata | Katalog, priser, varianter, brand (metadata eller collection). |
| **product_type** | Cleanser, Toner, Serum, Moisturizer, SPF, Eye cream, Face mask | “Hvad er produktet” – routine-step, filtrering på type. |
| **product_category** | Hierarki (Skincare → Cleansers, Serums, …) | Navigation, PLP, breadcrumbs, filtrering. |
| **product_tag** | Skin types: dry, oily, combination, normal, sensitive. Concerns: acne, dryness, sensitivity, redness, hyperpigmentation, dullness | Filtrering, routine-logik (primary/secondary). |
| **product_tags** | Many-to-many product ↔ tag | Hvilke tags et produkt har. |
| **product_collection** | Valgfrit: én per brand ELLER kampagner (New in, Bestsellers) | Brand-filtrering eller marketing; product.collection_id. |
| **product.metadata** | `brand` (string) eller `brand_id`; evt. `primary_skin_type`, `primary_concern` (værdier der matcher tags) | Brand + primary-tag for sortering/routine (0–1 primary per dimension ifølge spec). |

Brand kan være enten:

- **Kun metadata:** `metadata.brand = "VT Cosmetics"` – simpelt, ingen ekstra tabeller.
- **Collection per brand:** Opret collection “VT Cosmetics”, sæt `product.collection_id`. Giver tydelig “brand”-dimension i Admin og på storefront.

### 3.2 CMS (Payload)

| Område | Indhold | Formål |
|--------|---------|--------|
| **ProductGuidance** | productIdentifier (= handle), skinTypes, concerns, ingredients, howTo, routineTime, pairWith, precautions | Rich editorial indhold til PDP og routines – **ikke** pris/lager; det kommer fra Medusa. |
| **Homepage** | Sections med productHandles, manuelle categories/brands (evt. senere categoryHandle/brandSlug) | Redaktionel sammensætning; produktdata hentes fra Medusa ved visning. |
| **Pages / Articles** | Indhold, SEO, evt. productHandle hvor det giver mening | Content og SEO. |

Synergy-regel:

- **Alle produktreferencer i CMS er handles.** Storefront henter produkt (og priser) fra Medusa på handle og guidance fra Payload på `productIdentifier = handle`.

---

## 4. CMS-opbygning – konkrete anbefalinger

### 4.1 ProductGuidance

- **Behold** `productIdentifier` som **obligatorisk, unikt** felt. Dokumentér at det **altid** skal være Medusa `product.handle`.
- **Værdi-sæt for skin types og concerns:** Tilpas så de matcher Medusa tags (og evt. product.metadata):
  - Skin types: `normal`, `dry`, `oily`, `combination`, `sensitive` (plus “all” i ProductGuidance hvis I beholder det).
  - Concerns: `acne`, `dryness`, `sensitivity`, `redness`, `hyperpigmentation`, `dullness` (evt. udvid til at matche jeres fulde concern-liste i ProductGuidance).
- Så kan samme værdier bruges til: (1) filtrering/tags i Medusa, (2) routine-logik (primary/secondary), (3) CMS guidance-visning. Én fælles “ordbog” = nemmere at tracke og rapportere.

### 4.2 i18n (da/en)

- ProductGuidance bruger today kun EN option-labels (f.eks. “Dry”, “Oily”). Storefront skal vise da/en.
- **Mulighed A:** Global eller lille “Translations”-collection: namespace + key (f.eks. `skin_type.dry`) → `{ da: "Tør", en: "Dry" }`. Storefront resolver værdier til locale. ProductGuidance gemmer stadig value (dry, oily, …); kun labels oversættes.
- **Mulighed B:** Dupliker felter (skinTypesDa, skinTypesEn) – tungere og dobbelt ved ændring.
- **Anbefaling:** Mulighed A (én oversættelseskilde per værdi) så metadata forbliver ens på tværs af CMS og Commerce.

### 4.3 Homepage: categories og brands

- **Nu:** Manuelle title, image, url. Ingen kobling til Medusa.
- **Optimal uden at ændre for meget:** Behold manuel redaktion. Evt. senere:
  - I categories-section: valgfrit felt `categoryHandle` (Medusa `product_category.handle`). Hvis sat, kan storefront bygge URL som `/categories/{categoryHandle}` og evt. hente category-navn fra Medusa til konsistens.
  - I brands-banner: valgfrit felt `brandSlug`/`brandKey` der matcher `product.metadata.brand` eller collection handle, så “Shop this brand” peger på samme filter som Commerce.

Det giver synergi uden at tvinge fuld sync fra dag ét.

### 4.4 Validering af handle i CMS

- For at undgå tastefejl: enten (1) dokumentér at productIdentifier skal eksistere i Medusa, eller (2) senere: Payload hook / admin validation der tjekker (via Medusa API) at handle findes. Det sikrer at alle produktreferencer kan trackes og vises korrekt.

---

## 5. Commerce (Medusa) – opsætning for synergi

### 5.1 Product type (produkt*art*)

- **Brug type til routine-steps:** Cleanser, Toner, Serum, Moisturizer, SPF, Eye cream, Face mask (i tråd med spec).
- Opret én `product_type` per sådan art; sæt `product.type_id` på alle produkter. Fjern eller genbrug ikke “Brand” som type.
- Giver: filtrering “produkter til dette step”, routine-by-type, og konsistent “produkttype” i metadata/tracking.

### 5.2 Kategorier

- Behold hierarki (Skincare → Cleansers, Serums, Moisturizers, SPF). Tilføj evt. Toners som underkategori hvis det matcher jeres assortment.
- Link produkter til **blad-kategorier** (eller flere) via `product_category_product`. Sørg for entydig `rank` på søskende så sortering er deterministisk.
- Category handle = URL-slug (f.eks. `/categories/cleansers`) så CMS og storefront kan bruge samme slug hvor relevant.

### 5.3 Tags (skin type + concern)

- Opret tags med **værdier der matcher ProductGuidance:**
  - Skin: `dry`, `oily`, `combination`, `normal`, `sensitive`
  - Concern: `acne`, `dryness`, `sensitivity`, `redness`, `hyperpigmentation`, `dullness`
- Link produkter via `product_tags`. Evt. brug `product_tag.metadata.kind = "skin_type" | "concern"` så I i koden kan skelne.
- **Primary vs secondary (spec):** Hver produkt har 0–1 primary skin type og 0–1 primary concern. Medusa har ikke native “primary tag”. Løsninger:
  - **Anbefaling:** Gem i `product.metadata`: `primary_skin_type: "dry"`, `primary_concern: "dryness"` (værdier der matcher tag.value). Så kan routine-logikken vælge “primary match” først og derefter “secondary” (andre tags på produktet).

### 5.4 Brand

- **MVP:** `product.metadata.brand` (string). Simpelt; filtrering og “brands banner” kan bygges på denne værdi.
- **Alternativ:** Én `product_collection` per brand, `product.collection_id` sat. Giver tydelig brand-entity i Admin og samme tracking-muligheder.

### 5.5 Metadata til tracking

- På **product:**  
  `handle` (canonical), `type_id`, category-ids (via junction), tag-ids (via product_tags), `metadata.brand`, `metadata.primary_skin_type`, `metadata.primary_concern`.
- Så kan alle events (product_view, add_to_cart, purchase) kobles til: kategori, type, brand, skin type og concern uden at skulle slå op i CMS – mens CMS stadig står for den rige guidance-tekst.

---

## 6. Dataflow og trackbarhed

### 6.1 PDP

1. Storefront modtager `handle` fra URL.
2. Hent **product** (og varianters priser) fra Medusa på handle.
3. Hent **ProductGuidance** fra Payload hvor `productIdentifier = handle`.
4. Vis kombineret: Medusa-data (titel, billeder, priser, type, categories, tags, metadata) + Payload (guidance-tekst, ingredients, pair-with, etc.).
5. Analytics: `product_view` med handle (og evt. category_id, type_id, brand fra Medusa).

### 6.2 Homepage / PLP

- Featured products: CMS leverer handles → storefront henter produkter fra Medusa.
- Categories: Enten manuelle URLs eller categoryHandle → Medusa category handle.
- Brands: Manuelle links eller brandSlug → filter på `metadata.brand` / collection.
- Alle produkt-events kan logges med handle; server/backend kan mappe til type, category, brand, tags for rapporter.

### 6.3 Routines (3-step / 5-step)

- Input: brugerens skin type og/eller concern (fra UI).
- Hent produkter fra Medusa: filtrer på tags (og evt. type for “cleanser step”). Sorter ved primary: `metadata.primary_skin_type` / `metadata.primary_concern` matcher valgt kontekst.
- Vis op til 3 per step (1 primary + 2 alternatives); conflict-regel: ikke vise produkter uden relevante tags (primary eller secondary).
- Guidance til hvert produkt (how to use, pair-with) hentes fra Payload på handle når PDP eller routine-detalje vises.

---

## 7. Opsummering – hvad der gør det “helt nøjagtigt”

1. **Én nøgle:** Kun `product.handle` mellem CMS og Commerce. Alle produktreferencer i Payload (ProductGuidance, Homepage, testimonials, pair-with) er handles.
2. **Fælles værdi-sæt:** Skin types og concerns i ProductGuidance og i Medusa tags (og evt. metadata) bruger samme værdier (dry, oily, acne, dryness, …). Så filtrering, routine-logik og guidance viser samme “ordbog”.
3. **Medusa som katalog-hjerne:** type_id = produktart (cleanser, serum, …); categories = taxonomy; tags = skin/concern; metadata = brand + primary_skin_type + primary_concern. Alt det bruges til filtrering, sortering og tracking uden at belaste CMS.
4. **CMS som indholds-hjerne:** ProductGuidance = rich content keyet på handle; Homepage = redaktionel sammensætning med handles. Ingen duplikation af pris/lager/katalog.
5. **i18n:** Én oversættelseskilde (global eller lille collection) for værdi-labels (skin type, concern) så både CMS-admin og storefront kan vise da/en konsistent.
6. **Tracking:** Handle + Medusa metadata (type, category, brand, primary tags) giver fuld granulering (per category, per brand, per skin type/concern) uden at lægge produkt-metadata i CMS.

Hvis I ønsker det, kan næste skridt være en kort “implementation checklist” (CMS-felter at tilpasse, Medusa-tabeller at udfylde, storefront-fetch der kombinerer Medusa + Payload på handle) uden at skrive kode her.
