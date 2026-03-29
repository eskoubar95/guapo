# Payload Visual Editor (Enterprise) and Homepage Setup

## What is the Visual Editor?

The **Payload Visual Editor** is an [Enterprise feature](https://payloadcms.com/enterprise/visual-editor) that provides:

- **In-context editing** on the site (edit text, images, styling where you see them)
- **Page reconfiguration** (reorder sections, add/remove blocks) with a visual layout
- **Field-level access control** and **version control / audit trails**

It is a “what you see is (actually) what you get” page builder for headless CMS content. It is part of Payload Enterprise (paid), not the open-source Payload core.

## Current Guapo Setup (Open Source)

We use **Payload 3 open source** with:

- **Homepage global** in `apps/cms` with a **blocks** field: editors add, remove, and reorder sections in the **Admin Panel** (block list UI), not on the live site.
- **Live Preview**: Admin can open the storefront in an iframe with `?draft=1` to see draft content; see `PAYLOAD-LIVE-PREVIEW.md`.
- **Dynamic components**: Every section on the homepage is driven by block data (banner/promotion-slider, product listing with title + source, inspiration & guides, brand spotlight, service strip, etc.). So **content and order are fully controllable** from the CMS; only the editing experience is form-based in Admin, not in-context on the page.

## Compatibility with Visual Editor

If you adopt **Payload Enterprise** and enable the **Visual Editor**:

- The **same Homepage global and block types** (hero, featured-products, categories, testimonials, content-block, newsletter, blog-carousel, brands-banner, promotion-slider, promo-bars, inspiration-guides, brand-spotlight, service-strip) are used.
- The Visual Editor will allow editing and reordering these blocks **on the page** (visual editor UX) instead of only in the block list in Admin.
- No need to redesign the data model: our blocks already expose the fields (titles, source control for product listing, CTAs, etc.) that the Visual Editor can bind to.

## Dynamic Components (Source Control and Titles)

These are already or will be CMS-driven so that both Admin and (if you use it) Visual Editor can control them:

| Section | Block type | What editors control |
|--------|------------|----------------------|
| **Banner** | `promotion-slider` | Slides (variant, title, subtitle, CTA text/URL). |
| **Product listing** (e.g. “Nyheder”) | `featured-products` | **Title** (heading), **source** (Products relationship or productHandles), layout (grid/carousel), “Se alle” (CTA show, text, url). |
| **Inspiration & Guides** | `inspiration-guides` | Section title, subtitle, cards (image, tag, title, excerpt, link). |
| **Brand spotlight** (e.g. The Ordinary) | `brand-spotlight` | Brand (relationship), description, CTA text/URL, image, optional product handles. |
| **Service strip** (e.g. abonnement, gavekort, nyhedsbrev) | `service-strip` | Items: icon (type or upload), title, subtitle, link. |
| **Categories** | `categories` | Heading, list of categories with image/title/url. |
| **Newsletter** | `newsletter` | Heading, description, styling. |
| **Blog carousel** | `blog-carousel` | Heading, source (latest/manual), articles, CTA. |

Product listing “source control” is done via **featured-products**: either pick **Products** (relationship) or fill **productHandles** (Medusa handles). The section **title** is the block’s **heading** field.

## Recommendation

1. **Today:** Use Payload Admin (block list) + Live Preview (`?draft=1`) to build and preview the homepage. All dynamic components above are or will be available as blocks.
2. **If you add Payload Enterprise:** Enable the Visual Editor; the same blocks and API feed it, so you get in-context editing and visual reordering without changing the data model.
