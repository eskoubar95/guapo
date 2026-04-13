# PostHog — opsætning til Guapo storefront

Denne guide matcher instrumentation i `src/lib/analytics/posthog-ecommerce.ts` og `PostHogProvider` (manuel `$pageview`, `person_profiles: identified_only`, EU-host som standard).

## 1. Projektindstillinger (PostHog Cloud)

- **Data residency**: Brug EU-ingest (`https://eu.i.posthog.com`) — det skal matche `NEXT_PUBLIC_POSTHOG_HOST`.
- **Personer**: Med `identified_only` oprettes profiler først når `identify()` kaldes (login/registration). Anonyme brugere ses som events uden fuld person-profil; det er forventet.
- **Session replay** (valgfrit): Slå til i PostHog under Project settings hvis det er GDPR-ok med jeres cookie-/privacy-tekst. Anbefaling: `maskAllInputs: true` og blokér checkout-/konto-UI i SDK senere hvis I udvider init.

## 2. Event-katalog (opret som “Event definitions” / dokumentation i PostHog)

| Event | Formål | Vigtige properties |
|--------|--------|---------------------|
| `$pageview` | Sidevisning (App Router) | `$current_url` |
| `product_viewed` | PDP | `product_id`, `handle`, `name`, `price`, `currency`, `category_name?` |
| `product_added_to_cart` | Add to cart | `product_id?`, `product_handle`, `product_name`, `variant_id`, `quantity`, `price`, `currency`, `is_subscription`, `subscription_cycle_weeks?`, `category_name?` |
| `cart_viewed` | Kurv synlig | `surface`, `item_count`, `cart_value` |
| `checkout_started` | Checkout startet | `cart_id`, `value`, `currency`, `item_count`, `has_subscription_items` |
| `order_completed` | Ordre gennemført | `order_id`, `display_id?`, `value`, `currency`, `item_count`, `has_subscription` |
| `user_registered` | Registrering | `method` (`emailpass`), `is_new_customer` |
| `user_logged_in` | Login | `method` (`emailpass` \| `google`), `created_profile?` |
| `search_results_viewed` | Søgeresultater vist | `query`, `product_count`, `article_count`, `source` (`modal` \| `page`) |
| `search_submitted` | Søgning sendt (navigation) | `query`, `source` (`modal` \| `page_form`) |
| `wishlist_updated` | Ønskeliste opdateret | `action` (`add` \| `remove`), `product_handle`, `wishlist_size` |
| `wishlist_page_viewed` | Ønskeliste-side | `wishlist_size`, `products_shown` |

**Super properties (klient):** `locale` registreres via `posthog.register` efter samtykke — brug den til at filtrere dashboards og cohorts.

## 3. Anbefalede dashboards

Opret et dashboard **“E-commerce — Guapo”** med følgende indsigter (Insight → tilføj til dashboard):

1. **Trafik**: `$pageview` unikke brugere over tid; breakdown på `locale` hvis tilgængelig.
2. **Produktengagement**: `product_viewed` tælling + top `handle` / `product_id`.
3. **Tilføj til kurv**: `product_added_to_cart` over tid; breakdown `is_subscription`.
4. **Kurv/checkout**: `cart_viewed` (breakdown `surface`), `checkout_started`, `order_completed`.
5. **Konvertering**: `order_completed` `sum(value)` eller gennemsnit `value` (pass på valuta — filtrér på `currency` hvis I blander).
6. **Søgning**: `search_submitted` og `search_results_viewed`; `product_count` som indikator for “ingen resultater”.
7. **Auth**: `user_logged_in`, `user_registered` (breakdown `method`).
8. **Wishlist**: `wishlist_updated` (breakdown `action`).

## 4. Funnels (eksempler)

Opret **funnel insights** med “Ordered” steps (samme bruger-session eller strict conversion — vælg efter hvor stram I vil være):

**A. Køb (core)**

1. `product_viewed` (valgfrit første trin hvis I vil måle browse→køb)
2. `product_added_to_cart`
3. `checkout_started`
4. `order_completed`

Filtrér evt. på `locale` eller `currency`.

**B. Kurv → betaling**

1. `cart_viewed`
2. `checkout_started`
3. `order_completed`

**C. Søgning → køb**

1. `search_submitted` eller `search_results_viewed`
2. `product_added_to_cart`
3. `order_completed`

Brug **tidsvindue** (fx7 eller 14 dage) konsistent på tværs af rapporter.

## 5. Cohorts (eksempler)

- **Har lagt i kurv, ikke købt (7 d):** Brugere med `product_added_to_cart` og uden `order_completed` i samme periode (PostHog: “performed event A” AND NOT “performed event B” med tidsvindue — eller brug funnel “drop-off” og gem som cohort afhængigt af UI-version).
- **Abonnement-interesse:** `product_added_to_cart` hvor `is_subscription` er true.
- **Genaktivering:** Har `user_logged_in` men ikke `order_completed` i seneste X dage.
- **Søgende uden køb:** Har `search_submitted` og ikke `order_completed` i X dage.

Tilknyt cohorts til **feature flags** eller **experiments** hvis I bruger dem senere.

## 6. Kvalitet og vedligehold

- **Property-typer**: Tjek i PostHog at numeriske felter (`price`, `value`, `cart_value`, …) ikke bliver behandlet som ren tekst (ret type hvis nødvendigt).
- **Dubletter**: I sender kun én `$pageview` pr. route change via `PostHogPageView` — undgå at slå `capture_pageview: true` til samtidig.
- **Test**: Brug PostHog “Live events” med filter på jeres test-`distinct_id` efter login.

## 7. Miljøvariabler (reference)

- `NEXT_PUBLIC_POSTHOG_KEY` — påkrævet for tracking.
- `NEXT_PUBLIC_POSTHOG_HOST` — default `https://eu.i.posthog.com`.
