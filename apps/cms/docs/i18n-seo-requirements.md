# CMS: i18n and SEO requirements (t7.3)

This document records **requirements** for localisation (da/en) and SEO in the CMS. It is the source of truth for what content the CMS must support so the storefront can serve `/da` and `/en` with correct meta and structured data.

**Scope:** CMS only (Payload). No storefront changes. Storefront consumes CMS data via API and applies locale routing.

**Official Payload features (reference):**

- **SEO:** [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) (`@payloadcms/plugin-seo`) — adds a `meta` field group (title, description, image) to collections/globals, with auto-generate functions, search preview UI, character counters, and extensibility (e.g. custom fields for og:title, json-ld). We currently use **manual meta groups**; migrating to the plugin is recommended (see t7.4 research) for better editor UX and generateTitle/generateDescription/generateImage.
- **Content localisation (da/en):** [Payload Localization](https://payloadcms.com/docs/configuration/localization) (built-in config) — `localization.locales`, `defaultLocale`, `fallback`; per-field `localized: true`; REST/GraphQL/Local API accept `locale` and `fallbackLocale`. This is for **content** in multiple languages. (Payload [I18n](https://payloadcms.com/docs/configuration/i18n) is for **admin UI** language only, not content.)

---

## 1. i18n (da/en) requirements

### 1.1 Storefront behaviour (reference)

- Routes: `/da/...` (default) and `/en/...` (spec 09-sitemap).
- Same page structure for both locales; content and meta may differ per locale.

### 1.2 What must be localisable from CMS

| Content type | Today | Requirement |
|--------------|-------|-------------|
| **Pages** (landing, policies, support) | Single language (one title/body per page) | MVP: either one doc per locale (slug convention) or Payload **Localization** (built-in): same doc, fields per locale via `localized: true`. **Decision:** Document need; MVP can use slug convention until Localization is enabled. |
| **Articles** (blog) | Single language | Same as Pages: slug convention or Payload Localization later. |
| **Homepage** (sections, copy) | Single language | Hero, CTA, section headings: need da/en. **Decision:** Document; implement via Payload **Localization** (e.g. `localized: true` on block fields or copy fields) or duplicate blocks per locale. |
| **Navigation / Footer** | Single language (labels, links) | Menu labels and link text must be localisable. **Decision:** Document; add when Localization is enabled (e.g. `localized: true` on label/url fields). |
| **ProductGuidance** | Single language | Guidance copy (skin types, concerns, how-to) is product-related; can stay single locale initially. **Decision:** Document; no CMS change in t7.3. |
| **Media** | Language-agnostic | Alt text should be localisable. **Decision:** Document; optional `localized: true` on alt when Localization is enabled. |

### 1.3 CMS implementation options (documented, not implemented in t7.3)

- **Option A – Slug/locale convention:** e.g. pages with slug `privacy-da` and `privacy-en`; storefront picks by locale. No Payload config change.
- **Option B – Payload Localization (built-in):** Config `localization: { locales: ['da', 'en'], defaultLocale: 'da' }` and set `localized: true` on fields that must vary by locale. One document, fields stored per locale; API accepts `?locale=da` or `?locale=en`. See [Payload Localization](https://payloadcms.com/docs/configuration/localization).
- **Option C – Locale field on collections/globals:** Add `locale: 'da' | 'en'` and filter in API; storefront requests by locale. No built-in Localization; manual duplication of content per locale.

**Recommendation:** Document A for MVP simplicity; plan B (Payload Localization) when we are ready to enable da/en content in CMS (post t7.4 research if needed).

---

## 2. SEO requirements

### 2.1 Meta fields (per page / per article)

Required for indexable pages (spec 09: SEO pages = content + blog + PLP + PDP + landing):

- **meta.title** – SEO title (fallback: page/article title).
- **meta.description** – Meta description.
- **meta.image** – Social/share image (OG image).

**Payload SEO Plugin:** The official [@payloadcms/plugin-seo](https://payloadcms.com/docs/plugins/seo) provides the same meta group (title, description, image) plus: auto-generate functions (e.g. from doc title/excerpt/featured image), search preview UI, character counters, and optional custom fields (og:title, json-ld). We currently use **manual meta groups**; adopting the plugin (e.g. in t7.4 or later) is recommended for better editor UX and consistency.

### 2.2 Current Payload coverage

| Entity | meta.title | meta.description | meta.image | Note |
|--------|------------|------------------|------------|------|
| **Pages** | ✅ | ✅ | ✅ | Complete. |
| **Homepage** | ✅ | ✅ | ✅ | Page SEO group. |
| **Articles** | ✅ | ✅ | ❌ | **Gap:** Added in t7.3 (see below). |
| **ProductGuidance** | N/A | N/A | N/A | PDP uses product + guidance; meta typically from product or PDP template. |
| **Navigation / Footer** | N/A | N/A | N/A | Not pages; no meta. |

### 2.3 Structured data (reference for storefront)

CMS provides **content and meta**; storefront is responsible for emitting:

- **Article** – Blog posts (from Articles: title, excerpt, image, datePublished, dateModified).
- **WebPage** – Static pages (from Pages: title, description).
- **Organization / WebSite** – Site-wide (can use Homepage meta or globals).

No CMS schema changes required for structured data; storefront builds JSON-LD from existing fields. This document only states that CMS must expose meta + featured image so storefront can build Article/WebPage.

---

## 3. Changes made in t7.3

- **Articles:** Added `meta.image` (upload, relationTo: media) for social/share and Article structured data.
- **Documentation:** This file (`apps/cms/docs/i18n-seo-requirements.md`) created as single source of truth for i18n and SEO requirements.

---

## 4. Future work (out of scope for t7.3)

- **Payload Localization:** Enable built-in [Localization](https://payloadcms.com/docs/configuration/localization) (`localization.locales: ['da', 'en']`, `defaultLocale`) and set `localized: true` on relevant fields (Pages, Articles, Homepage sections, Navigation/Footer labels). API then supports `?locale=da` / `?locale=en`.
- **Payload SEO Plugin:** Consider migrating from manual meta groups to [@payloadcms/plugin-seo](https://payloadcms.com/docs/plugins/seo) for generateTitle/generateDescription/generateImage, preview UI, and extensibility (t7.4 research).
- Optional: localisable alt text on Media (`localized: true` on alt when Localization is enabled).
- Storefront: consume locale from CMS and render meta/structured data (handled in storefront tasks).
