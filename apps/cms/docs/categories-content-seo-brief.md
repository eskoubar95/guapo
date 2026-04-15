# Categories: Content-felter og SEO – research & brief

**Formål:** Afklare hvad der er sat op i Payload Categories i dag, hvad der skal til for at understøtte Matas-agtige kategorisider (redaktionelt indhold under produktlisten), og hvordan SEO håndteres. Ingen implementering her – kun undersøgelse og anbefalinger.

**Reference:** Matas kategoriside (fx "Skrub & Eksfoliering"): Commerce-delen = filtre, underkategorier, produktliste; CMS-delen = indhold *nedenunder* (intro, body scrub-tekst, "Sådan scrubber du", "Hvad skal jeg vælge?", "Bevar din sommerglød" m.m.).

---

## 1. Nuværende opsætning (Categories.ts)

| Felt | Type | Bemærkning |
|------|------|------------|
| `medusa_id` | text | ReadOnly; Medusa product_category ID (sync/delete-by-id). **Synlig** i admin. |
| `handle` | text | Obligatorisk, unik, readOnly; skal matche Medusa category handle. |
| `name` | text (localized) | Visningsnavn (fra Medusa eller override). |
| `parent` | relationship → categories | ReadOnly; sættes af sync. |
| `slug` | text (localized) | URL-slug override (defaults til handle). |
| `meta` | group "SEO" (localized) | Erstattes af **@payloadcms/plugin-seo** (title, description, image). |
| `body` | richText "Body content" (localized) | Ét Lexical rich-text-felt – **valgt til start** (ingen blocks). |

**Konklusion:** Hero image bruges ikke på kategorisiden og er fjernet. Identitet: medusa_id synlig (vigtig for sync/debug), handle beholdes. Indhold: kun rich editor (body). SEO: plugin giver meta + preview.

---

## 2. Hvad skal til for Matas-agtige kategorisider

Commerce-delen (filtre, underkategorier, produktliste) hører til storefront + Medusa – ikke CMS. CMS skal kun understøtte **redaktionelt indhold under produktlisten**.

Fra Matas-eksemplet:

- **Intro-sektion** (fx "Mød Emma"): billede + kort tekst.
- **Tekstblokke** med overskrift + brødtekst (fx "Body scrub", "Hvad skal jeg vælge?").
- **Sektion med baggrund** (fx "Sådan scrubber du…") med trin-for-trin (ikon/nummer + tekst).
- **Billede i teksten** eller billede med billedtekst.
- **Variation** (fx lys baggrund på enkelte blokke).

Det kan dækkes på to måder:

**A) Behold ét `body` (richText)**  
Lexical understøtter overskrifter, afsnit, indlejrede billeder og evt. custom blocks. Redaktører bygger alt i én editor. Simpelt, men mindre styring pr. "sektion" (fx egen baggrund per blok).

**B) Erstat/udvid med et `contentBlocks` (blocks-felt)**  
Som Homepage `sections`: definer bloktyper (RichTextBlock, StepByStepBlock, ImageWithCaptionBlock, EditorialIntroBlock). Redaktører vælger rækkefølge og fylder blokke. Giver tydelig styring (fx baggrundsfarve per blok, trin-for-trin med ikon). Kræver flere felter og frontend-rendering pr. bloktype.

**Beslutning:** Start med **A** – kun **rich editor (body)**. Lexical understøtter overskrifter, afsnit og indlejrede billeder. Blocks kan tilføjes senere ved behov.

---

## 3. Feltoversigt – hvad bør være synlige ved redigering af en category

**Synlige felter ved redigering:**

- **medusa_id** – Medusa product_category ID (readOnly). Synlig for sync og fejlsøgning.
- **Handle** – Medusa category handle (readOnly).
- **Name** (per locale) – visningsnavn.
- **Parent** – overordnet kategori (readOnly).
- **Slug** (per locale) – URL override.
- **Body** – rich-text-indhold under produktlisten (Lexical).
- **SEO** – via **@payloadcms/plugin-seo** (title, description, image, preview).

**Fjernet:**

- **Hero Image** – bruges ikke på kategorisiden; felt fjernet.
- **Manuel meta-gruppe** – erstattet af SEO-plugin.

---

## 4. SEO-plugin (Payload officielt)

- **Nuværende:** Manuel `meta`-gruppe (title, description) i Categories, Pages, Articles, Homepage osv. Categories har **ingen** meta.image.
- **Dokumentation:** `apps/cms/docs/i18n-seo-requirements.md` og `apps/cms/docs/payload-plugins-research.md` anbefaler **@payloadcms/plugin-seo** til bedre redaktør-UX og konsistens.

**Plugin giver:**

- `meta`-gruppe med title, description, **image**.
- Auto-generate: `generateTitle`, `generateDescription`, `generateImage` (fx fra doc.name, body, heroImage).
- Søgepreview i admin + tegn-tællere.
- Valgfri udvidelse (fx ekstra felter til OG/JSON-LD).

**Aktivering (kort):** Installer `@payloadcms/plugin-seo`, tilføj i `payload.config.ts`:

```ts
seoPlugin({
  collections: ['pages', 'articles', 'categories', ...],
  globals: ['homepage'],
  uploadsCollection: 'media',
  generateTitle: ({ doc }) => doc?.title ?? doc?.name,
  generateDescription: ({ doc }) => doc?.meta?.description ?? doc?.excerpt ?? truncate(doc?.body),
  generateImage: ({ doc }) => doc?.heroImage ?? doc?.featuredImage,
})
```

For Categories: `generateTitle` kan bruge `name`; `generateImage` kan stå tom eller bruge andet indhold senere. Den manuelle `meta`-gruppe er fjernet fra Categories når plugin er aktiveret.

---

## 5. UI/UX i Payload CMS

- **Gruppering:** Katalog-felter (medusa_id, handle, name, parent, slug) med beskrivelser.
- **Indhold:** Kun **body** (richText); Lexical understøtter overskrifter, afsnit og billeder ("/ for commands").
- **SEO:** Plugin tilføjer meta + preview automatisk.
- **Sprog:** Name, slug, body og SEO localized; beholde det.

---

## 6. Kort opsummering

| Område | Nuværende | Anbefaling |
|--------|-----------|------------|
| **Identitet/katalog** | medusa_id synlig, handle, name, parent, slug | Behold; medusa_id nu synlig. |
| **Hero** | heroImage | **Fjernet** – bruges ikke på siden. |
| **Body** | Ét richText-felt | **Valgt:** Kun rich editor (ingen blocks). |
| **SEO** | Manuel meta → plugin | **@payloadcms/plugin-seo** aktiveret for categories; manuel meta fjernet. |
| **Admin UX** | Flade felter | SEO-felter + preview fra plugin. |

**Status:** Brief opdateret; implementering: Categories.ts (fjern heroImage, vis medusa_id, fjern meta) + SEO-plugin i payload.config.
