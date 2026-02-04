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

Responses are cached briefly (5 min) to limit load on Medusa. If Medusa is down or URL is unset, routes return empty arrays (admin is not blocked).

## Usage

- Payload admin can use these endpoints to build dropdowns (e.g. custom field components that fetch options).
- Categories and Brands collections are filled from Medusa (handle/brandKey); create Payload docs with the same handle/brandKey as in Medusa.
- Products collection is keyed by Medusa product handle; add documents with handle (and optional title) from Medusa, then edit CMS-only fields.

## Commerce: GET /store/brands

Commerce exposes `GET /store/brands` returning `{ brands: string[] }` (distinct `product.metadata.brand`). The CMS brands proxy calls this when available so it does not need to fetch all products.
