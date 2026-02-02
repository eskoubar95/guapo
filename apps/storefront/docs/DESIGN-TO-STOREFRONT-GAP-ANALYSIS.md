# Design Repo → Storefront: 1:1 Gap Analysis

Præcis gennemgang af hvad der findes i `design/Ecommercestorefrontdesign` vs `apps/storefront`, og hvad der mangler for en-til-en match.

---

## 1. Sider / Routes

### Design repo routes (fra routes.tsx)

| Design Route | Sider | Storefront Route | Status | Mangler |
|--------------|-------|------------------|--------|---------|
| `/` | HomePage | `/[locale]` | ✅ Implementeret | — |
| `/shop` | ProductListPage | `/[locale]/categories` | ⚠️ Delvist | Se PLP-gap |
| `/shop/:category` | ProductListPage | `/[locale]/categories/[handle]` | ⚠️ Delvist | FilterSystem, ProductCard med rating, rigtige produkter |
| `/concerns/:concern` | ProductListPage | `/[locale]/concerns/[handle]` | ⚠️ Delvist | Samme som categories |
| `/brands/:brand` | ProductListPage | `/[locale]/brands/[handle]` | ⚠️ Delvist | Samme som categories |
| `/product/:id` | ProductDetailPage | `/[locale]/products/[handle]` | ⚠️ Delvist | QuantitySelector, SizeVariantSelector (ProductGallery, Tabs, KeyInformationCard, trust-strip done) |
| `/cart` | CartPage | `/[locale]/cart` | ⚠️ Delvist | FilterSystem/PLP design-tokens (CartItemCard, subscription-toggle, rabatkode, continue-shopping done) |
| `/checkout` | CheckoutPage | `/[locale]/checkout` | ⚠️ Delvist | CheckoutSteps: fuld step-flow (1→2→3), leveringsvalg; Adyen-placeholder |
| `/order-confirmation/:orderId` | OrderConfirmationPage | `/[locale]/order-confirmation/[orderId]` | ✅ Implementeret | — |
| `/account` | AccountOverviewPage | `/[locale]/account` | ⚠️ Delvist | AccountLayout med sidebar, design-kort (Ordrer, Abonnementer, Adresser, Kontakt) |
| `/account/orders` | OrdersPage | `/[locale]/account/orders` | ⚠️ Delvist | Design layout, ordreliste |
| `/account/subscriptions` | SubscriptionsPage | `/[locale]/account/subscriptions` | ⚠️ Delvist | Design layout, abonnementsliste |
| `/account/subscriptions/:id` | SubscriptionDetailPage | `/[locale]/account/subscriptions/[id]` | ✅ Implementeret | — |
| `/blog` | BlogListPage | `/[locale]/blog` | ⚠️ Delvist | Design layout (design har minimal list) |
| `/blog/:slug` | BlogArticlePage | `/[locale]/blog/[slug]` | ⚠️ Delvist | Design layout |
| `/faq` | FAQPage | `/[locale]/support/faq` | ⚠️ Forskelligt | Design bruger Accordion; vi har kategorier med dl/dt |
| `/contact` | ContactPage | `/[locale]/support/contact` | ⚠️ Delvist | Design: form + kontaktinfo (Mail, Phone, MapPin, Clock) |
| `/policies/terms` | PolicyPage | `/[locale]/policies/terms` | ⚠️ Delvist | Design: dynamisk titel fra path |
| `/policies/privacy` | PolicyPage | `/[locale]/policies/privacy` | ⚠️ Delvist | Samme |
| `/policies/cookies` | PolicyPage | `/[locale]/policies/cookies` | ⚠️ Delvist | Samme |
| `/policies/returns` | PolicyPage | `/[locale]/policies/returns` | ⚠️ Delvist | Samme |
| `*` | NotFoundPage | `/[locale]/_not-found` eller global | ⚠️ | Design not-found; vi har Next.js default |
| `/design-system` | DesignSystemPage | — | — | Dev-only, springes over |
| `/components` | ComponentsPage | — | — | Dev-only, springes over |

**Manglende sider:**
1. ~~**Order confirmation**~~ – implementeret som `/[locale]/order-confirmation/[orderId]`
2. ~~**Subscription detail**~~ – implementeret som `/[locale]/account/subscriptions/[id]`

---

## 2. Komponenter

### Layout-komponenter

| Design | Storefront | Status |
|--------|------------|--------|
| RootLayout | layout.tsx (Header + main + Footer) | ✅ |
| AccountLayout | AccountLayout.tsx + account/layout.tsx | ✅ Sidebar med Oversigt, Ordrer, Abonnementer; aktiv state |
| Header | Header.tsx | ✅ Opdateret med SidebarMenu, SearchModal, CartDropdown |
| Footer | Footer.tsx | ✅ |
| SidebarMenu | SidebarMenu.tsx | ✅ |
| SearchModal | SearchModal.tsx | ✅ Forenklet |
| CartDropdown | CartDropdown.tsx | ✅ Forenklet (tom kurv) |

### Produktkomponenter

| Design | Storefront | Status |
|--------|------------|--------|
| ProductCard | ProductCard.tsx | ✅ |
| ProductGallery | ProductGallery.tsx | ✅ Thumbnail-vælger, hovedbillede; placeholder ved ingen billeder |
| KeyInformationCard | KeyInformationCard.tsx | ✅ Ingredienser, hudtype, benefits med ikoner |
| SizeVariantSelector | **MANGLER** | ❌ Vi har inline buttons på PDP |
| QuantitySelector | **MANGLER** | ❌ Vi har inline +/- på Cart |
| ProductPageSections | **MANGLER** | ❌ Produktsektioner (Tabs, accordion) |
| ProductCompactAccordion | **MANGLER** | ❌ |
| SubscriptionOptions | SubscriptionSelector.tsx | ⚠️ Egen implementation; design bruger RadioGroup + Label |

### Cart / Checkout

| Design | Storefront | Status |
|--------|------------|--------|
| CartItemCard | CartItemCard.tsx | ✅ Billede, navn, størrelse, quantity (+/-), pris, fjern, subscription-badge |
| QuantitySelector | **MANGLER** | ❌ Genbrugelig +/– |

### Filter / PLP

| Design | Storefront | Status |
|--------|------------|--------|
| FilterSystem | FilterSystem.tsx | ✅ Slide-out panel med Mærker, Pris, Hudtype, Specialebehov; URL-sync |

### Homepage-sektioner

| Design | Storefront | Status |
|--------|------------|--------|
| FeaturedProducts | sections/FeaturedProducts.tsx | ✅ |
| CampaignSection | sections/CampaignSection.tsx | ✅ |
| RoutineBlock | sections/RoutineBlock.tsx | ✅ |
| ContentGrid | sections/ContentGrid.tsx | ✅ |
| BrandSpotlight | sections/BrandSpotlight.tsx | ✅ |
| ServiceStrip | sections/ServiceStrip.tsx | ✅ |
| CtaStrip | sections/CtaStrip.tsx | ✅ |

### UI-primitiver (design har mange, vi har få)

| Design UI | Storefront | Status |
|-----------|------------|--------|
| Button | ui/button.tsx | ✅ |
| Card | ui/card.tsx | ✅ |
| Input | ui/input.tsx | ✅ |
| Accordion | ui/accordion.tsx | ✅ Bruges i FAQ |
| Tabs | ui/tabs.tsx | ✅ Bruges i PDP (ProductPageTabs) |
| RadioGroup | ui/radio-group.tsx | ✅ Bruges i PDP, Checkout |
| Label | ui/label.tsx | ✅ Bruges i formularer |
| Checkbox | ui/checkbox.tsx | ✅ Bruges i FilterSystem |
| Select | **MANGLER** | ❌ Bruges i PLP sort |
| Textarea | ui/textarea.tsx | ✅ Bruges i Contact |
| Sheet | **MANGLER** | ❌ Kan bruges til FilterSystem |
| Dialog | **MANGLER** | ❌ |
| Skeleton | **MANGLER** | ❌ Loading states |
| Breadcrumb | **MANGLER** | ❌ Vi har custom breadcrumbs |

---

## 3. Sider-specifikke gaps (1:1)

### PLP (Product List Page)
- **Design:** FilterSystem (slide-out med Mærker, Pris, Hudtype, Specialebehov), Select for sortering, ProductCard med rating/antal anmeldelser, breadcrumbs
- **Vi har:** Breadcrumbs, FilterSystem (slide-out, URL-sync), select til sort, placeholder-produktkort (ikke ProductCard)
- **Mangler:** ProductCard i grid (med rating), design-tokens på PLP

### PDP (Product Detail Page)
- **Design:** ProductGallery (thumbnail-vælger), Tabs (beskrivelse, ingredienser, anmeldelser), RadioGroup (engangskøb vs abonnement), QuantitySelector, SizeVariantSelector, KeyInformationCard, trust-strip (Truck, RefreshCw, Shield)
- **Vi har:** ProductGallery, SubscriptionSelector, guidance (hudtyper, concerns, ingredienser, how-to-use, pair-with)
- **Mangler:** QuantitySelector, SizeVariantSelector (KeyInformationCard + trust-strip implementeret)

### Cart
- **Design:** CartItemCard (billede, mærke, navn, størrelse, quantity, fjern), subscription-toggle per linje, rabatkodefelt, "Fortsæt med at shoppe"-produktrække, ordreoversigt
- **Vi har:** CartItemCard, CartItemList (client) med subscription-toggle per linje (Engangskøb/Abonnement), CartDiscountCode, "Fortsæt med at shoppe"-sektion, ordreoversigt, checkout-link
- **Mangler:** —

### Checkout
- **Design:** Step-indikator (1. Levering, 2. Oversigt, 3. Betaling), leveringsvalg (hjem, pakkeshop, express), formularfelter, ordreoversigt-sidebar
- **Vi har:** CheckoutSteps med fuld step-flow (kun ét step synligt ad gangen, Tilbage/Fortsæt), step-indikator med completed-state, leveringsvalg-UI, ordreoversigt-sidebar
- **Mangler:** Adyen-integration, evt. design-tokens

### Account
- **Design:** AccountLayout med sidebar (Oversigt, Mine ordrer, Abonnementer), AccountOverviewPage med kort (Ordrer, Abonnementer, Adresser, Kontakt)
- **Vi har:** Account-overview uden sidebar; orders og subscriptions har egne sider
- **Vi har nu:** AccountLayout med sidebar; overview-kort findes

### FAQ
- **Design:** Accordion (collapsible items) med faqs
- **Vi har:** FAQAccordion med ui/accordion, kategorier med collapsible items
- **Mangler:** —

### Contact
- **Design:** Form (fornavn, efternavn, email, emne, besked) + kontaktinfo-boks (Mail, Phone, MapPin, Clock)
- **Vi har:** Form (firstName, lastName, email, subject, message) med Label/Input/Textarea; kontaktinfo-kort med Mail, Phone, MapPin, Clock
- **Mangler:** —

---

## 4. Sammenfatning – hvad mangler for 1:1

### Sider (nye)
1. ~~Order confirmation~~ – implementeret `/[locale]/order-confirmation/[orderId]`
2. ~~Subscription detail~~ – implementeret `/[locale]/account/subscriptions/[id]`

### Layout
3. ~~AccountLayout~~ – implementeret (sidebar med Oversigt, Ordrer, Abonnementer; aktiv state)

### Komponenter (nye)
4. ~~FilterSystem~~ – implementeret (filter-panel til PLP, URL-sync)
5. ~~ProductGallery~~ – implementeret (thumbnail-vælger til PDP)
6. ~~CartItemCard~~ – implementeret (kurvlinje med quantity, fjern, subscription-badge)
7. ~~KeyInformationCard~~ – implementeret (ingredienser, hudtype, benefits med ikoner)
8. SizeVariantSelector – variantvælger
9. QuantitySelector – genbrugelig +/–
10. ProductPageSections / ProductCompactAccordion – PDP-sektioner

### UI-primitiver
11. ~~Accordion~~ – implementeret (til FAQ)
12. ~~Tabs~~ – implementeret (PDP ProductPageTabs)
13. ~~RadioGroup~~ – implementeret (PDP, Checkout)
14. ~~Label~~ – implementeret (formularer)
15. ~~Checkbox~~ – implementeret (FilterSystem)
16. Select – PLP sort (beholder native)
17. ~~Textarea~~ – implementeret (Contact)

### Sider der skal opdateres
18. PLP – FilterSystem, ProductCard, design-tokens
19. PDP – QuantitySelector, SizeVariantSelector (ProductGallery, Tabs, KeyInformationCard, trust-strip implementeret)
20. ~~Cart – subscription-toggle per linje~~ (CartItemCard, CartItemList med toggle, rabatkode, "Fortsæt med at shoppe" implementeret)
21. ~~Checkout – step-design, leveringsvalg~~ (CheckoutSteps: Levering → Oversigt → Betaling; leveringsvalg-UI)
22. Account overview – AccountLayout, design-kort
23. Account orders – design layout
24. Account subscriptions – design layout
25. ~~FAQ – Accordion~~ (implementeret)
26. ~~Contact – form + kontaktinfo 1:1~~ (implementeret)
27. Policy – design layout (vi har allerede; verificer 1:1)

---

## 5. Prioriteret handlingsliste

**Fase 1 – Manglende sider**
- [x] Order confirmation page
- [x] Subscription detail page

**Fase 2 – Manglende layout**
- [x] AccountLayout med sidebar

**Fase 3 – Kritiske komponenter**
- [x] FilterSystem
- [x] ProductGallery
- [x] CartItemCard
- [x] Accordion (til FAQ)

**Fase 4 – UI-primitiver**
- [x] Tabs, RadioGroup, Label, Checkbox, Textarea (Select: beholder native på PLP)

**Fase 5 – PDP/Cart/Checkout alignment**
- [x] PDP: KeyInformationCard, trust-strip (ProductGallery + Tabs done)
- [x] Cart: subscription-toggle per linje (CartItemList + CartItemCard med Engangskøb/Abonnement per linje)
- [x] Checkout: step-design (CheckoutSteps med fuld step-flow 1→2→3), leveringsvalg-UI

**Fase 6 – Support/Policy**
- [x] FAQ: Accordion
- [x] Contact: form + kontaktinfo 1:1

---

## 6. Næste fase: backend data + storefront wiring

**Checkpoint:** Design 1:1 (Fase 1–6) er færdig på branch `task/m6-design-system-integration`. Storefront viser placeholder/mock data.

**Næste skridt (ikke påbegyndt i denne branch):**

1. **Medusa data-opstilling:** product_type (Cleanser, Serum, Moisturizer, SPF, …), product_category (hierarki), product_tag (skin types, concerns), product_collection (brands/kampagner), produkter med handle + metadata. Seed script så kataloget er realistisk. Ref: `apps/storefront/docs/CMS-COMMERCE-SYNERGY-RESEARCH.md`.
2. **Payload data-opstilling:** ProductGuidance entries keyet af Medusa `product.handle`; homepage sections med `productHandles` der matcher rigtige handles.
3. **Storefront wiring:** Erstat homeMockProducts, placeholderProducts og hardcoded PDP med kald til Medusa (produkter, kategorier, collections) og Payload (ProductGuidance, homepage). PDP/PLP/homepage viser derefter rigtig data.

**Spec:** `CMS-COMMERCE-SYNERGY-RESEARCH.md`, `spec/09-sitemap.md`, `spec/07-design-system.md` (M6 status).
