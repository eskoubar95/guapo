# Payload Live Preview with Separate Storefront

## Context

- **Payload CMS** runs in `apps/cms` (e.g. port 3001).
- **Storefront** runs in `apps/storefront` (e.g. port 3000).
- Live Preview renders the storefront in an iframe in the Admin Panel; the preview URL includes `?draft=1` so the storefront shows draft content.

## Pages in Payload

Sider administreres under **Content → Pages** i Payload:

- **Page type**
  - **Default (content only)** – f.eks. vilkår og betingelser, privacy: kun titel, slug, path, meta og rich-text `content`.
  - **Homepage (sections)** – forsiden: path skal være `home`, sektioner styres via blocks (hero, featured products, osv.).
  - **Landing (sections)** – kampagnesider: samme section-blocks som homepage.

- **Path** – URL-sti uden locale (f.eks. `home`, `policies/terms`, `summer-sale`). Path `home` bruges til forsiden på `/`.

- **Forside:** Storefront henter først en Page med path `home` og type `homepage`; hvis den findes og har sektioner, bruges den. Ellers bruges **Homepage**-globalen (Site Settings → Homepage). Begge understøtter draft via `?draft=1`.

## Live Preview (konfigureret i Payload)

I `apps/cms/src/payload.config.ts` er `admin.livePreview` sat med:

- **collections:** `['pages']` – Live Preview-knap vises på Pages-dokumenter.
- **globals:** `['homepage']` – Live Preview vises på Homepage-globalen.
- **url:** Dynamisk URL til storefront:
  - Homepage-global → `{STOREFRONT_URL}/{locale}?draft=1`
  - Page med path `home` → `{STOREFRONT_URL}/{locale}?draft=1`
  - Anden page → `{STOREFRONT_URL}/{locale}/{path}?draft=1`

Sæt **STOREFRONT_URL** i `apps/cms/.env` (f.eks. `http://localhost:3000`). Ellers bruges `http://localhost:3000`.

## Draft og API

- **Storefront** læser `searchParams.draft` på forsiden og kalder `fetchPageByPath('home', locale, { draft })` og/eller `fetchHomepage(locale, { draft })` når `draft=1` eller `draft=true`.
- **CMS API:**
  - `GET /api/storefront/globals/homepage?locale=da&draft=true`
  - `GET /api/storefront/pages?path=home&locale=da&draft=true`

## Sådan bruger du det

1. Opret eller rediger en **Page** med path `home` og page type **Homepage** for at styre forsiden via Pages (i stedet for Homepage-globalen).
2. I Payload: åbn dokumentet og tryk **Live Preview** – iframe viser storefront med `?draft=1`.
3. For andre sider (f.eks. `policies/terms`): opret Page med path `policies/terms`, type **Default**, og udfyld `content`. Rendering på storefront kræver evt. en dynamisk route der henter page by path (kan tilføjes senere).

## Refresh on save

Med separat storefront kan iframe ikke altid opdatere sig automatisk ved save. Redigeringer vises ved manuel refresh i preview eller ved at genåbne Live Preview.
