# Product metadata decisions (Guapo)

**Context:** t7.6 — consistent product metadata for brand and primary skin type/concern.

## Brand representation

**Decision:** Store brand in **product.metadata** (`metadata.brand`), not as a separate product_collection.

**Rationale:**

- Single-brand MVP: one value (e.g. `"Guapo"`) for all products; no need for collection-based filtering.
- Simpler: no extra collection or linking; storefront and admin can read `product.metadata?.brand`.
- If we add multiple brands later, we can introduce a product_collection per brand and keep `metadata.brand` in sync, or migrate to collection-only.

**Convention:** `metadata.brand` is a string (e.g. `"Guapo"`). Empty/absent = no brand set.

---

## Primary skin type and concern

**Decision:** Store primary skin type and primary concern in **product.metadata**:

- `metadata.primary_skin_type` — one primary skin type (e.g. `"normal"`, `"oily"`, `"dry"`, `"combination"`, `"sensitive"`). Must match product_tag values used for skin types where possible.
- `metadata.primary_concern` — one primary concern (e.g. `"hydration"`, `"acne"`, `"pigmentation"`, `"aging"`). Must match product_tag values used for concerns where possible.

**Rationale:**

- Product_tag already holds multiple tags (skin types + concerns). Metadata gives one “primary” of each for PDP/guidance (e.g. hero badge, filtering).
- Same vocabulary as product_tag keeps storefront logic simple.

**Convention:** String values; absent = no primary set. Storefront can fall back to first matching tag if needed.

---

## Summary

| Key                    | Type   | Example    | Notes                    |
|------------------------|--------|------------|--------------------------|
| `metadata.brand`       | string | `"Guapo"`  | Brand name               |
| `metadata.primary_skin_type` | string | `"normal"` | One of skin-type tag values |
| `metadata.primary_concern`   | string | `"hydration"` | One of concern tag values   |

Seed and any future imports must set these consistently for products that have brand / skin type / concern.
