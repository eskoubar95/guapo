# CMS–Commerce Synergy (Payload & Medusa)

**Purpose:** Clarify what lives where, who decides what, and how the storefront gets data. Single source of truth for developers.

---

## 1. Data ownership (who owns what)

| Domain | Payload (CMS) | Medusa (Commerce) |
|--------|----------------|-------------------|
| **Products** | — | Product catalog, variants, prices, inventory, product_type, categories, tags, metadata (brand, primary_skin_type, primary_concern) |
| **Categories / types / brand** | — | Category tree, product types, product tags, product.metadata.brand. **Medusa is source of truth** for “what categories/types/brands exist in the catalog”. |
| **Pages & structure** | Which pages exist (home, category pages, brand pages, product pages, articles). URL structure, routing. | — |
| **Content** | Copy, images, SEO (meta, structured data), navigation, footer, homepage sections, blog/articles. | — |
| **PDP guidance** | ProductGuidance (skin types, concerns, ingredients, routines) keyed by product handle/SKU. | — |
| **Cart, checkout, orders** | — | Carts, checkout, orders, subscriptions, customers |

**Rule of thumb:**  
- **Commerce (Medusa)** owns everything that is “catalog and transaction”.  
- **CMS (Payload)** owns everything that is “pages, copy, and editorial content”.  
- For product-related *pages* (e.g. “Serum category page”, “Brand X page”), **Payload decides that the page exists** and **what it refers to** (e.g. category handle, product type, brand). Medusa stays source of truth for the actual catalog (categories, types, brands).

---

## 2. Canonical keys (linking CMS ↔ Commerce)

### Product

- **Canonical key:** `product.handle` (Medusa).
- Payload **ProductGuidance** uses `productIdentifier` = Medusa product **handle** (or SKU if agreed). Same value everywhere so storefront can join “content for this product” with “product from Medusa”.

### Category / type / brand (for pages)

- **Category:** Medusa category `handle` (e.g. `serums`, `cleansers`). Payload can define “this page is the category page for handle `serums`”; storefront filters Medusa products by that category.
- **Product type:** Medusa product_type `value` (e.g. `serum`, `cleanser`). Payload can define “this page is the product-type page for `serum`”; storefront filters by type.
- **Brand:** Medusa product metadata `brand` (e.g. `Guapo`). Payload can define “this page is the brand page for `Guapo`”; storefront filters by metadata.brand.

**Convention:** The **same** handles/values/types/brand names used in Medusa must be used when Payload or storefront refers to them (no duplicate taxonomies).

---

## 3. Who decides what (recommended model)

| Question | Decided by | Notes |
|----------|------------|--------|
| What categories / types / brands exist in the catalog? | **Medusa** | Created and maintained in Commerce (seed, admin, imports). |
| Which pages exist (e.g. “Serum category”, “Brand Guapo”)? | **Payload** | CMS defines pages and assigns “this page = category handle X” or “product type Y” or “brand Z”. |
| What content is on a category/brand/type page? | **Payload** | Copy, SEO, sections, images. |
| What products appear on that page? | **Medusa** | Storefront calls Medusa with filters (category, type, brand) from the page definition in Payload. |

**Flow:**

1. Payload defines a page (e.g. “Serums”) and stores a reference: e.g. `category_handle: "serums"` or `product_type: "serum"`.
2. Storefront loads page definition from Payload (content + reference).
3. Storefront calls Medusa: “products where category handle = serums” (or type = serum, or brand = Guapo).
4. Storefront renders Payload content + Medusa product list.

So: **Payload “bestemmer områderne”** (hvilke sider der findes og hvad de handler om). **Medusa ejer kataloget** (hvad der er for kategorier, types, brands og produkter). Begge skal bruge samme værdier når der refereres.

---

## 4. How the storefront gets data

- **From Medusa:** Products, variants, prices, categories, types, tags, metadata (brand, primary_skin_type, primary_concern). Store API (REST/GraphQL as chosen).
- **From Payload:** Pages, navigation, footer, homepage sections, articles, ProductGuidance or **Products** (by product handle), **Categories**, **Brands**, SEO. REST or GraphQL as implemented.
- **Joining:** For PDP, storefront fetches product by handle from Medusa and product content (ProductGuidance or Products + Ingredients/Beneficials) from Payload by handle, then merges. For category/brand pages, storefront loads Category/Brand from Payload (handle or brandKey) and products from Medusa filtered by that handle/brand.

See `spec/02-architecture.md` for high-level data flow (browse → guidance → purchase).

---

## 5. Resolved / follow-ups

- **ProductGuidance:** productIdentifier is Medusa **handle** (and document in CMS if SKU is also allowed).
- **Category/type/brand pages in Payload:** When implementing, define the exact field(s) (e.g. `category_handle`, `product_type`, `brand`) and where they live (e.g. Page type, or dedicated “Category page” block).
- **i18n:** Category/type/brand labels for UI may later come from Payload (translations) while Medusa keeps stable handles/values; document when that is introduced.
- **Payload catalog entities (Products, Categories, Brands):** Medusa is the only source of identity. **Products:** Create/delete in Payload are allowed only from Medusa (sync secret or API key + `is_from_medusa`). Medusa drives sync: `product.created` / `product.deleted` subscribers call Payload API; manual sync via `POST /admin/payload/sync/products`. Categories/Brands: same pattern planned (Phase 2). See `apps/cms/docs/data-model-medusa-payload.md` and `apps/cms/docs/payload-medusa-sync-plan.md`.

---

## 6. References

- Architecture: `spec/02-architecture.md`
- Commerce product metadata: `apps/commerce/docs/product-metadata-decisions.md`
- Payload: ProductGuidance `apps/cms/src/collections/ProductGuidance.ts`; Products, Ingredients, Routines, Beneficials, Categories, Brands in `apps/cms/src/collections/`.
- CMS Medusa proxy: `apps/cms/docs/medusa-proxy.md`
- Data model (Medusa = catalog source, Payload = overlay): `apps/cms/docs/data-model-medusa-payload.md`
- Sync-plan (Medusa-drevet sync for products, categories, product types, brands): `apps/cms/docs/payload-medusa-sync-plan.md`
