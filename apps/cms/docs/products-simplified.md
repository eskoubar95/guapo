# Products – struktur

**Formål:** Dokumentere Products-collection. Reference: DermaSpace (hudtype + hvad kan den hjælpe på), Skinsort (benefit tags), Matas (specifikationer).

---

## Products-felter

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `medusa_id` | text | ReadOnly – sættes af Medusa sync |
| `handle` | text | ReadOnly – matcher Medusa product handle |
| `title` | text (localized) | Produktnavn (synced eller override) |
| `description` | richText (localized) | Beskrivelse af produktet |
| `application` | textarea (localized) | Anvendelse – sådan bruger du produktet |
| `keyIngredients` | relationship → ingredients | Få fremhævede ingredienser (vælg fra Ingredients) |
| `ingredients` | relationship → ingredients (hasMany) | Fuld ingrediensliste – multi-select fra Ingredients |
| `skinTypes` | relationship → skin-types | Hvilken hudtype passer den til? |
| `concerns` | relationship → concerns | Hvad kan den hjælpe på? |
| `specifications` | group | Brand, volumen, varenummer, EAN, fabrikant |

---

## Specifikationer (gruppe)

| Felt | Beskrivelse |
|------|-------------|
| `brand` | relationship → brands |
| `volume` | Fx "50 ml" |
| `sku` | Varenummer – **synced fra Medusa** (read-only i admin) |
| `ean` | EAN-nummer – **synced fra Medusa** (read-only i admin) |
| `manufacturer` | Fabrikant |
| `manufacturerContact` | Fabrikant-kontakt |

SKU og EAN hentes fra første variant i Medusa ved sync og må ikke redigeres i Payload. Øvrige felter kan udfyldes manuelt.

**Sync update:** Ved "Sync" opdateres kun Medusa-felter (medusaImageUrls, sku, ean). Redaktør-felter (description, keyIngredients, specifications.brand, osv.) overskrives aldrig.

---

## Fjernet (kan tilføjes senere)

- medusaImageUrls (billeder håndteres i Medusa)
- avoidWithIngredients
- routines
- howTo (application steps)
- routineTime (AM/PM)
- pairWithRecommended / pairWithAvoid
- precautions (patch test, pregnancy, warnings)

---

## SkinTypes og Concerns

**Skin types** og **concerns** er separate collections:
- **skin-types** – value (e.g. dry), label (localized)
- **concerns** – value (e.g. acne), label (localized)

Products har multi-select til begge.
