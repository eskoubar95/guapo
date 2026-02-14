# Ingredients: Content-felter – analyseret ud fra Skinsort

**Formål:** Analysere Skinsort.com/ingredients/niacinamide som reference for hvilke data vi bør have i Payload Ingredients. Anbefalinger til felter – ingen implementering her.

**Reference:** [skinsort.com/ingredients/niacinamide](https://skinsort.com/ingredients/niacinamide)

---

## 1. Nuværende Ingredients (Payload)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `name` | text (localized) | Obligatorisk, f.eks. "Vitamin C (Ascorbic Acid)" |
| `benefit` | textarea (localized) | Hvad gør ingrediensen? |
| `concentration` | text (localized) | F.eks. "15%" |
| `avoidWith` | array | Andre ingredienser man ikke bør kombinere med + `reason` |

**Formål i dag:** PDP-guidance – "featured ingredients" og "avoid with" på produktsider. Relation til Products.

---

## 2. Skinsort – struktur pr. sektion

### 2.1 Header & tags

| Skinsort | Beskrivelse | Datatype-forslag |
|----------|-------------|------------------|
| Ingredient name | "Niacinamide" | `name` ✅ (har vi) |
| Alternative names | Vitamin B3, Nicotinic Acid Amide | `alternativeNames` (array/text) |
| Benefit tags | Acne Fighter, Brightening, Anti-aging, etc. | `tags` (array) eller relationship til Tags-collection |
| One-liner | "Strengthens skin barrier, controls oil..." | `summary` / `shortDescription` |

### 2.2 Redaktionsindhold (rich text)

| Skinsort | Beskrivelse | Datatype |
|----------|-------------|----------|
| Explained | "Niacinamide is a multitasking form of..." | `body` (richText) |
| How does it work? | Mekanisme, NAD, ceramider osv. | Del af `body` eller eget felt `howItWorks` |
| Where does it come from? | Kilder, syntetisk osv. | Del af `body` eller `source` |
| Side effects | Sjældne reaktioner, niacin flush | Del af `body` eller `sideEffects` |

**Anbefaling:** Start med ét `body` (richText) som dækker alle sektioner. Redaktør strukturerer med overskrifter (H2, H3). Simpelt som Categories.

### 2.3 Key facts (strukturerede felter)

Fra Skinsort-eksempler (både live og referencebillede):

| Felt | Skinsort | Vores anbefaling |
|------|----------|------------------|
| What is it? | Vitamin B3 | `alternativNavn` / `primaryName` |
| Found in | Meat, fish, nuts, greens | `foundIn` (text) |
| Also known as | Nicotinamide, 3-Pyridinecarboxamide | `alternativeNames` (array) |
| Primary function | Antioxidant, skin conditioning | `primaryFunction` (text/select) |
| Other functions | Fragrance, hair conditioning | `otherFunctions` (array) |
| Concentration range | 2%–20% / 0%–30% | `concentrationMin`, `concentrationMax` (number) eller `concentrationRange` (text) – vi har `concentration` |
| Sources | Synthetic | `source` (enum: Synthetic, Natural, etc.) |
| Origin | USA | `origin` (text) – valgfrit |
| Comedogenic rating | 0–5 | `comedogenicRating` (number) |
| Irritation risk | Low / Medium / High | `irritationRisk` (select) |
| Safety rating | Excellent / Good / Fair / Poor | `safetyRating` (select) |
| Pregnancy safe | Yes/No | `pregnancySafe` (checkbox) |
| Breastfeeding safe | Yes/No | `breastfeedingSafe` (checkbox) |
| Vegan | Yes/No | `vegan` (checkbox) |
| Alcohol-free / Oil-free / Paraben-free / etc. | Flere booleans | `freeOf` (array af strings) eller enkelte checkboxes |

### 2.4 CosIng / regulatorisk (Skinsort)

| Felt | Eksempel |
|------|----------|
| CosIng ID | 35499 |
| INCI Name | NIACINAMIDE |
| INN Name | nicotinamide |
| EC # | 202-713-4 |
| Ph. Eur. Name | nicotinamidum |
| All Functions | Smoothing |

**Noter:** CosIng er EU-database. Kun relevant hvis vi vil matche mod ekstern INCI/PIF. Kan være fase 2.

### 2.5 Produktrelation

Skinsort: "16,876 products with Niacinamide" – liste af produkter der indeholder ingrediensen.

**Vores model:** Products har `keyIngredients` → relationship til Ingredients. **Inversen** (hvilke produkter indeholder X) kan beregnes via relationship eller query. Payload understøtter ikke automatisk "reverse relation" som et felt, men API/GraphQL kan hente "products where featuredIngredients contains this ingredient". Så vi behøver ikke et eget felt – relationen er allerede Products → Ingredients.

### 2.6 Reviews / brugerdata

Skinsort: "Users who like it 90%", "Positive 10, Negative 0".  
**Vores kontekst:** Guapo er et curated e-commerce site, ikke en community-platform. Reviews hører ikke til i Ingredients-collection. Evt. senere som separat Reviews-modul (produkter, ikke ingredienser).

---

## 3. Anbefalet feltsæt (Guapo Ingredients)

### Fase 1 – MVP (nu / kort sigt)

Behold eksisterende + tilføj minimalt for **ingredienssider** (fx `/ingredients/niacinamide`):

| Felt | Type | Bemærkning |
|------|------|------------|
| `name` | text (localized) | Behold |
| `slug` | text (localized) | Ny – til URL, fx `niacinamide` |
| `summary` | text (localized) | Kort one-liner (1–2 sætninger) |
| `body` | richText (localized) | Ny – fuld forklaring (What is it, How it works, Side effects, etc.) |
| `benefit` | textarea (localized) | Behold – hurtig "hvad gør den" |
| `concentration` | text (localized) | Behold – fx "2–20%" |
| `alternativeNames` | array of text | Ny – Vitamin B3, Nicotinamide osv. |
| `avoidWith` | array (relationship + reason) | Behold |
| `meta` (SEO) | group | Tilføj via SEO-plugin (title, description, image) |
| `inciName` | text | INCI-standardnavn (fx NIACINAMIDE) – trust, compliance, match |
| `cosingId` | text | CosIng ID – valgfrit, til fremtidig CosIng-integration |

**Slug:** Kræver at ingredienssider har egen route i storefront (fx `/[locale]/ingredients/[slug]`). Ellers kan slug udelades i starten.

**CosIng/INCI:** `inciName` er det vigtigste – bruges i EU-kosmetik, PIF og produkters ingredienslister. `cosingId` giver mulighed for opslag i [CosIng-databasen](https://ec.europa.eu/growth/tools-databases/cosing/).

### Fase 2 – Udvidet (hvis vi vil Skinsort-agtige facts)

| Felt | Type | Prioritet |
|------|------|-----------|
| `primaryFunction` | text eller select | Medium |
| `comedogenicRating` | number (0–5) | Medium – vigtig for acne/porer |
| `irritationRisk` | select (Low/Medium/High) | Medium |
| `safetyRating` | select | Lav |
| `pregnancySafe` | checkbox | Høj – juridisk/trust |
| `vegan` | checkbox | Medium – mange efterspørger |
| `foundIn` | text | Lav |
| `source` | select (Synthetic/Natural) | Lav |

### Fase 2b / 3 – CosIng/INCI (relevant for trust & compliance)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `inciName` | text | INCI-standardnavn (fx NIACINAMIDE) – officielt, bruges i EU-kosmetikforskriften |
| `cosingId` | text | CosIng ID (fx 35499) – til opslag i EU CosIng-databasen |
| `ecNumber` | text | EC-nummer (fx 202-713-4) |
| `innName` | text | International Nonproprietary Name (fx nicotinamide) |
| `phEurName` | text | Ph. Eur.-navn (fx nicotinamidum) – valgfrit |
| `references` | array of URLs | Links til studies (PubMed etc.) |

**Hvorfor relevant:**
- **Trust:** Visning af INCI-navn signalerer faglighed og gennemsigtighed
- **Compliance:** PIF (Product Information File) og EU-kosmetikforskriften kræver INCI
- **Søgning:** Match mod produkters ingrediensliste (INCI-format)
- **CosIng:** Gratis EU-database – kan bruges til validering/auto-fyld

**Implementering:** Start med `inciName` som minimum – det er det mest brugte. `cosingId` giver mulighed for fremtidig CosIng-API-integration. `references` kan være enkelte URL-felter til start.

---

## 4. Konklusion

**Skinsort er et fuldt ingredient-lexikon** (CosIng, 16k+ produkter, brugerdata). **Guapo har brug for mindre:** redaktionelle ingredienssider der understøtter trust og PDP-guidance.

**Anbefaling:**

1. **Fase 1:** Tilføj `slug`, `summary`, `body`, `alternativeNames` og SEO. Behold resten. Det dækker en enkel ingrediensside med forklaring og SEO.
2. **Fase 2:** Tilføj `comedogenicRating`, `irritationRisk`, `pregnancySafe`, `vegan` hvis produktteam ønsker "Facts"-agtig sektion.
3. **CosIng/INCI:** **Inkluder** – mindst `inciName` (og evt. `cosingId`, `ecNumber`). Relevant for trust, compliance og match mod produkters ingredienslister.

**Produktrelation:** Products → keyIngredients (nøgleingredienser) + ingredients (fuld INCI-liste). Invers liste (produkter med ingrediensen) håndteres i API/query – ingen ændring nødvendig.
