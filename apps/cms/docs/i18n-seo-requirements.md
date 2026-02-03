# CMS: i18n and SEO requirements (t7.3)

This document records **requirements** for localisation (da/en) and SEO in the CMS. It is the source of truth for what content the CMS must support so the storefront can serve `/da` and `/en` with correct meta and structured data.

**Scope:** CMS only (Payload). No storefront changes. Storefront consumes CMS data via API and applies locale routing.

---

## 1. i18n (da/en) requirements

### 1.1 Storefront behaviour (reference)

- Routes: `/da/...` (default) and `/en/...` (spec 09-sitemap).
- Same page structure for both locales; content and meta may differ per locale.

### 1.2 What must be localisable from CMS

| Content type | Today | Requirement |
|--------------|-------|-------------|
| **Pages** (landing, policies, support) | Single language (one title/body per page) | MVP: either one doc per locale (e.g. slug `about-da`, `about-en`) or future Payload i18n: same doc, fields per locale. **Decision:** Document need; MVP can use slug convention or duplicate pages until i18n plugin is adopted. |
| **Articles** (blog) | Single language | Same as Pages: slug convention or i18n plugin later. |
| **Homepage** (sections, copy) | Single language | Hero, CTA, section headings: need da/en. **Decision:** Document; implement via Payload i18n plugin (t7.4 research) or duplicate blocks per locale when plugin is chosen. |
| **Navigation / Footer** | Single language (labels, links) | Menu labels and link text must be localisable. **Decision:** Document; add when i18n strategy is chosen (plugin or locale field on globals). |
| **ProductGuidance** | Single language | Guidance copy (skin types, concerns, how-to) is product-related; can stay single locale initially or mirror product catalog locale. **Decision:** Document; no CMS change in t7.3. |
| **Media** | Language-agnostic | Alt text should be localisable. **Decision:** Document; optional `alt_da` / `alt_en` or i18n later. |

### 1.3 CMS implementation options (documented, not implemented in t7.3)

- **Option A – Slug/locale convention:** e.g. pages with slug `privacy-da` and `privacy-en`; storefront picks by locale. No Payload config change.
- **Option B – Payload i18n plugin:** One document, fields repeated per locale (Payload v3 plugin). Requires plugin choice (t7.4).
- **Option C – Locale field on collections/globals:** Add `locale: 'da' | 'en'` and filter in API; storefront requests by locale. No plugin; manual duplication of content per locale.

**Recommendation:** Document A for MVP simplicity; plan B after t7.4 plugin research.

---

## 2. SEO requirements

### 2.1 Meta fields (per page / per article)

Required for indexable pages (spec 09: SEO pages = content + blog + PLP + PDP + landing):

- **meta.title** – SEO title (fallback: page/article title).
- **meta.description** – Meta description.
- **meta.image** – Social/share image (OG image).

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

- Enable Payload i18n plugin (post t7.4 research) and add locale to relevant collections/globals.
- Optional: localisable alt text on Media (e.g. `alt_da`, `alt_en` or i18n fields).
- Storefront: consume locale from CMS and render meta/structured data (handled in storefront tasks).
