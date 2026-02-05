# Medusa proxy (CMS)

The CMS exposes internal API routes that proxy Medusa Store API data for admin dropdowns and sync. No storefront changes.

## Environment

In `apps/cms/.env`:

- **MEDUSA_STORE_URL** – Medusa backend URL (e.g. `http://localhost:9000`). Same as storefront. Required for proxy.
- **MEDUSA_PUBLISHABLE_API_KEY** – Optional; set if your Store API requires a publishable key.

See `apps/cms/env.template`.

## API routes

All under `/api/medusa/` (relative to CMS origin):

| Route | Returns | Source |
|-------|--------|--------|
| `GET /api/medusa/products` | `[{ handle, title? }]` | Medusa GET /store/products |
| `GET /api/medusa/categories` | `[{ handle, name? }]` | Medusa GET /store/product-categories |
| `GET /api/medusa/product-types` | `string[]` | Medusa /store/product-types or derived from products |
| `GET /api/medusa/brands` | `string[]` | Commerce GET /store/brands or aggregated from products |
| `POST /api/medusa/sync` | `{ ok, results }` | Creates Payload Products/Categories/Brands for every Medusa product/category/brand that does not yet exist in Payload |

Responses are cached briefly (5 min) to limit load on Medusa. If Medusa is down or URL is unset, routes return empty arrays (admin is not blocked).

## Sync (fyld Payload fra Medusa)

**Problem:** Produkter/kategorier/brands findes i Medusa, men Payload listen er tom – fordi Payload ikke opretter dokumenter af sig selv.

**Løsning:** Kald `POST /api/medusa/sync` (fx fra browser eller curl). Endpointet:

1. Henter alle produkter, kategorier og brands fra Medusa (Store API).
2. For hver: hvis der ikke allerede findes et Payload-dokument med samme handle/brandKey, oprettes det med tomme CMS-felter.
3. Returnerer `{ ok: true, results: { products: { created, skipped }, categories: { ... }, brands: { ... } } }`.

Eksempel (CMS kører på port 3001):

```bash
curl -X POST http://localhost:3001/api/medusa/sync
```

Kør sync efter du har tilføjet nye produkter/kategorier/brands i Medusa, så de dukker op i Payload. I produktion bør dette endpoint beskyttes (cron-secret eller kun for indloggede admins).

## Usage

- Payload admin can use the GET endpoints to build dropdowns (e.g. custom field components that fetch options).
- **Først:** Kør `POST /api/medusa/sync` så Products/Categories/Brands i Payload er fyldt med dokumenter for hver Medusa-entitet.
- Derefter: rediger CMS-felter (SEO, how-to, ingredients, osv.) på de eksisterende dokumenter.

## Commerce: GET /store/brands

Commerce exposes `GET /store/brands` returning `{ brands: string[] }` (distinct `product.metadata.brand`). The CMS brands proxy calls this when available so it does not need to fetch all products.
