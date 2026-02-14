# Design Repo Alignment Analysis

Analysis of `design/Ecommercestorefrontdesign` vs `apps/storefront` — alignment with Figma design.

## 1. Layout & Structure

### Design repo (Ecommercestorefrontdesign)
- **Root layout**: Header → main (Outlet) → Footer
- **Header**: Contains announcement bar (`bg-primary`) + main nav (`bg-background/95`)
- **Home page**: No hero section. Starts with:
  1. Two announcement bars (page-level promo)
  2. Category icons strip
  3. Promotion slider (3 slides)
  4. Sections in order below

### Storefront (before fix)
- Had: AnnouncementBar (separate) → Hero "Din hud fortjener det bedste" → CategoryStrip → PromotionBanner → sections
- **Mismatch**: Hero section does not exist in design. Design starts with 2 promo bars + categories.

## 2. Home Page Structure (Design)

| Order | Section | Design classes | Notes |
|-------|---------|----------------|-------|
| 1 | Announcement bar 1 | `bg-[#3D5A80] text-white` | "Spar 20% på hudpleje ✨" |
| 2 | Announcement bar 2 | `bg-[#EFF4F9] text-[#051537]` | "Spar 20% på dermatologisk specialpleje 🧴" |
| 3 | Category strip | `py-8 bg-background` | Colored circles: amber-50, slate-50, stone-50, etc. |
| 4 | Promotion slider | 3 slides: dark gradient, light gradients | react-slick |
| 5 | FeaturedProducts | `bg-white` | "Redaktørens favoritter" |
| 6 | CampaignSection | background image | "Vinter hudpleje 2025" |
| 7 | FeaturedProducts | `from-slate-50/50 to-background` | "Bestsellere" |
| 8 | RoutineBlock | carousel | "Find din rutine" |
| 9 | FeaturedProducts | `from-sky-50/20 to-white` | "Nye varer" |
| 10 | ContentGrid | carousel | "Inspiration & Guides" |
| 11 | BrandSpotlight | `from-teal-50/20 to-slate-50/30` | The Ordinary |
| 12 | CtaStrip | `bg-white` | |
| 13 | ServiceStrip | `from-slate-50/40 to-sky-50/20` | |
| 14 | Newsletter | `py-10 bg-background` | |

## 3. Theme / Styles (design theme.css)

- `--background: #FFFFFF`
- `--surface: #F8F9FB`
- `--surface-muted: #EFF1F5`
- `--primary: #051537`
- `--secondary: #EFF4F9`
- Uses `text-primary`, `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Lexend for headings, Inter for body
- Body: `bg-background text-foreground`

## 4. Color System (CRITICAL — Lyse baggrunde)

Design repo er **kun lys**. Ingen auto dark mode.

| Token | Design værdi | Brug |
|-------|--------------|------|
| --background | #FFFFFF | Page, body, hovedindhold |
| --surface | #F8F9FB | Footer, cards, input |
| --surface-muted | #EFF1F5 | Subtle areas |
| --secondary | #EFF4F9 | Promo bar 2, accent |
| --primary | #051537 | Kun: top announcement bar, knapper, links |

**Mørke elementer (kun disse):**
- Header top bar: `bg-primary` (tynd linje)
- Promo bar 1: `#3D5A80` (medium navy)
- Promotion slider slide 1: gradient `#293241` → `#3D5A80`

**Storefront fejl:** Vi havde `@media (prefers-color-scheme: dark)` som skiftede --background til #0a0a0a. **Fjernet.** Design bruger kun `.dark` class ved eksplicit tilføjelse — aldrig auto.

## 5. Key Fixes Applied

1. **Fjern** `prefers-color-scheme: dark` override — alt for lys
2. **Tilføj** `color-scheme: light` på html
3. Remove hero section from home page
4. Add two promo bars on home page (design content)
5. Update CategoryStrip with colored circles
6. Add PromotionSlider (3 slides)
7. Section backgrounds: design gradients (slate-50, sky-50, teal-50, etc.)
