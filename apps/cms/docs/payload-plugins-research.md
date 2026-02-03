# Payload CMS v3 — Plugins research (t7.4)

Short report: which Payload v3 plugins/features are recommended for Guapo MVP, what they solve, and whether to enable them in M7 or later.

**Workspace:** apps/cms  
**Reference:** [Payload Plugins](https://payloadcms.com/docs/plugins/overview), [i18n-seo-requirements.md](./i18n-seo-requirements.md)

---

## 1. SEO — @payloadcms/plugin-seo

**What it does:** Adds a `meta` field group (title, description, image) to collections and globals you enable. Provides:

- Auto-generate functions: `generateTitle`, `generateDescription`, `generateImage` (e.g. from doc title, excerpt, featured image).
- Search preview UI in admin (snippet, character counters).
- Extensibility: custom fields (e.g. og:title, json-ld) via `fields` option.
- Optionally an SEO tab in the admin UI (`tabbedUI`).

**Current state:** We use **manual meta groups** (Pages, Articles, Homepage already have meta; Articles got meta.image in t7.3). No plugin installed.

**Recommendation:** **Enable in M7 or shortly after.** Improves editor UX (preview, auto-fill, counters) and keeps SEO fields consistent. Low risk; we can migrate existing meta groups to the plugin or keep manual and add the plugin only to new collections. Decide in M7 whether to refactor existing collections or add plugin only for future content.

**Activation:** Install `@payloadcms/plugin-seo`, add `seoPlugin({ collections: ['pages', 'articles'], globals: ['homepage'], uploadsCollection: 'media', generateTitle: ..., generateDescription: ..., generateImage: ... })` to `payload.config.ts`. See [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo).

---

## 2. i18n / Content localisation — Payload Localization (built-in)

**What it does:** Built-in **Localization** config (not a separate plugin). Lets you:

- Define `localization.locales` (e.g. `['da', 'en']`) and `defaultLocale`.
- Mark fields with `localized: true` so they store values per locale.
- Request content by locale via REST (`?locale=da`), GraphQL, or Local API (`locale: 'da'`).
- Optional fallback locale when a translation is missing.

**Current state:** Not enabled. Content is single-language. Storefront uses `/da` and `/en` routes; CMS does not yet expose localised content.

**Recommendation:** **Enable when we need da/en content from CMS.** Can be M7 if we prioritise localised pages/articles/homepage; otherwise **after M7**. Requires: add `localization: { locales: ['da', 'en'], defaultLocale: 'da' }` to config and set `localized: true` on relevant fields (title, body, meta, nav labels, etc.). May require a one-time data/migration strategy for existing content. See [Payload Localization](https://payloadcms.com/docs/configuration/localization).  
**Note:** Payload **I18n** is for admin UI language only (labels, messages), not content. For da/en content we use **Localization**.

---

## 3. Storage — @payloadcms/storage-s3 (Supabase S3)

**What it does:** Stores uploads (e.g. Media collection) in an S3-compatible bucket instead of the server filesystem. Supabase Storage is S3-compatible, so we can use the same plugin for Supabase.

**Current state:** Package `@payloadcms/storage-s3` is already a dependency (^3.18.0). Plugin is **not** enabled in `payload.config.ts` (commented out). Media uploads currently go to local/default storage.

**Recommendation:** **Enable when we want media in Supabase Storage** (e.g. for multi-instance or production). Can be **M7** if we need it for staging/production; otherwise **after M7**. Requires: Supabase project with Storage, S3 credentials from Supabase (Settings → Storage → S3 API), env vars (`S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`), and uncomment/configure `s3Storage` in `payload.config.ts` with `forcePathStyle: true` for Supabase. See [Payload storage-s3](https://www.npmjs.com/package/@payloadcms/storage-s3) and [Supabase S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility).

---

## 4. Other relevant plugins (brief)

- **Stripe** — Billing/subscriptions; we use Medusa + Adyen for commerce, so not needed for CMS.
- **Cloud storage (legacy)** — Replaced by `@payloadcms/storage-s3` in v3.
- **Custom plugins** — None required for MVP; add only if a concrete need appears.

---

## 5. Summary — M7 vs later

| Area        | Plugin / feature       | Recommend enable      | Notes                                      |
|------------|-------------------------|------------------------|--------------------------------------------|
| SEO        | @payloadcms/plugin-seo   | M7 or shortly after   | Better UX; optional refactor of existing meta. |
| i18n       | Localization (built-in) | When da/en content    | M7 or after; config + `localized: true`.  |
| Storage    | @payloadcms/storage-s3   | When using Supabase Storage | M7 or after; dep already in place.   |

All three are **recommended for MVP**; timing can be M7 or right after depending on priority (SEO plugin first is low-effort; Localization when we need translated content; Storage when we move media off local disk).
