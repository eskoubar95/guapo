# Design repo analysis (Ecommercestorefrontdesign)

Short analysis for M6: structure, components, tokens/theme, mockup data, and mapping to Guapo sitemap (spec/09).

**Source:** `design/Ecommercestorefrontdesign` (git submodule).  
**Stack:** Vite + React + Tailwind; design uses shadcn-style UI under `src/app/components/ui/`.

---

## 1. File structure

- **Root:** `index.html`, `vite.config.ts`, `package.json`, `postcss.config.mjs`
- **Entry:** `src/main.tsx` → `App.tsx` → `routes.tsx` (React Router)
- **Styles:** `src/styles/` — `fonts.css`, `index.css`, `tailwind.css`, **`theme.css`** (tokens + base)
- **App:** `src/app/`
  - **components/** — header, footer, layouts, product/cart/search/filter components, **ui/** (shadcn primitives)
  - **pages/** — home, product-list, product-detail, cart, checkout, account/*, blog/*, faq, contact, policy, order-confirmation, not-found, design-system, components
  - **layouts/** — `root-layout.tsx`, `account-layout.tsx`
  - **sections/** — homepage sections (brand-spotlight, campaign-section, content-grid, cta-strip, featured-products, routine-block, service-strip)
- **Lib:** `src/lib/mock-data.ts`, `utils.ts`
- **Docs:** `COMPONENTS.md`, `README.md`, `guidelines/Guidelines.md`

---

## 2. Components (high level)

| Category | Components |
|----------|------------|
| **Layout** | Header, Footer, RootLayout, AccountLayout, Layout, SidebarMenu |
| **Product** | ProductCard, ProductGallery, KeyInformationCard, SizeVariantSelector, QuantitySelector, SubscriptionOptions, ProductPageSections, ProductCompactAccordion, ExpertRecommendations |
| **Cart** | CartItemCard, CartDropdown |
| **Search/Filter** | SearchModal, FilterSystem |
| **Home sections** | BrandSpotlight, CampaignSection, ContentGrid, CtaStrip, FeaturedProducts, RoutineBlock, ServiceStrip |
| **UI primitives** | Button, Card, Input, Label, Accordion, Dialog, Sheet, Skeleton, Badge, Breadcrumb, etc. (under `components/ui/`) |

Full list and usage: design repo `COMPONENTS.md`.

---

## 3. Tokens / theme

**Location:** `design/Ecommercestorefrontdesign/src/styles/theme.css`

- **CSS custom properties** in `:root`:
  - **Neutrals:** `--background`, `--surface`, `--surface-muted`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`
  - **Brand:** `--primary` (#051537), `--primary-hover`, `--primary-foreground`, `--secondary`, `--secondary-foreground`
  - **Pastels:** `--pastel-powder-blue`, `--pastel-mint`, `--pastel-sage`, `--pastel-sand`, etc.
  - **Semantic:** `--success`, `--warning`, `--error`, `--info` (+ `-light` variants)
  - **Radius:** `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px)
  - **Spacing:** `--spacing-1` … `--spacing-16` (4px base)
  - **Typography:** `--text-xs` … `--text-xl`, `--font-weight-*`; headings use Lexend, body Inter
- **Focus:** No focus ring; `*:focus` / `*:focus-visible` use `outline: none`; inputs/buttons use `border: 2px solid var(--primary)` (aligns with spec/07).
- **Dark:** `.dark` overrides present (oklch).
- **Tailwind:** `@theme inline` maps CSS vars into Tailwind (Tailwind v4–style).

Map these to **spec/07-design-system.md** when implementing in storefront (CSS vars or Tailwind config).

---

## 4. Mockup data and static copy

- **Products / catalog:** `src/lib/mock-data.ts` — `mockProducts`, product-related arrays; used by product-list, product-detail, cart, featured sections.
- **Other mock data:** Same file or inline in pages (blog, account, policies). Search in design repo for `mock`, `Mock`, `fake`, or static arrays in page components.
- **Static copy:** In component JSX and possibly in `COMPONENTS.md` / guidelines. Replace with i18n (storefront `dictionaries/`) and CMS/Medusa where applicable.

---

## 5. Page mapping (design routes → spec/09 sitemap)

| Design route (design repo) | Guapo sitemap (spec/09) |
|----------------------------|--------------------------|
| `/` (HomePage) | `/da`, `/en` — Home |
| `/shop`, `/shop/:category`, `/concerns/:concern`, `/brands/:brand` (ProductListPage) | Categories, Shop by concern, Brands — PLP |
| `/product/:id` (ProductDetailPage) | Product (PDP) |
| `/cart` (CartPage) | Cart |
| `/checkout` (CheckoutPage) | Checkout |
| `/order-confirmation/:orderId` | Order confirmation |
| `/account/*` (AccountLayout: overview, orders, subscriptions, subscription-detail) | Account (auth-gated): Profile, Orders, Subscriptions |
| `/blog`, `/blog/:slug` | Content — Blog, Article |
| `/faq`, `/contact` | Support — FAQ, Contact |
| `/policies/terms`, `/policies/privacy`, `/policies/cookies`, `/policies/returns` | Policies — Terms, Privacy, Cookies, Returns |
| `/design-system`, `/components` | Dev-only; not in sitemap |

Guapo storefront uses `[locale]` (`/da`, `/en`); design repo has no locale in URL. When integrating: use design layout/components per page and wire to `[locale]/...` routes and Medusa/Payload data.

---

## 6. Summary for implementation

- **Structure:** Use design repo as reference; copy/refactor into `apps/storefront/src` (no direct import from submodule in production build unless explicitly decided).
- **Tokens:** Port `theme.css` tokens into storefront (e.g. `globals.css` or Tailwind theme) and align names with spec/07.
- **Components:** Refactor Header, Footer, Button, Card, Input, and core product/cart/search components first; keep focus-border rule (no focus ring).
- **Pages:** Home, PLP, PDP, Cart, Checkout, Account, Blog, Policies, Support — map design pages to `apps/storefront/src/app/[locale]/...` and replace mock data with Medusa/Payload.
- **Mock data:** Primary source `src/lib/mock-data.ts`; replace with `lib/medusa.ts` and CMS fetches; keep loading/empty/error states per spec/07.
