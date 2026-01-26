# Sitemap / Information Architecture

This document prevents “missing pages” by making the UI surface area explicit **before implementation**.

## MVP sitemap (required)

```text
/
  - Redirect to /da (default) or language picker (TBD)

/da
  - Home
  - Categories
    - Category (PLP)
  - Shop by concern
    - Concern (PLP)
  - Brands
    - Brand (PLP)
  - Search results
  - Product (PDP)
  - Cart
  - Checkout (guest allowed)
  - Order confirmation
  - Account (auth-gated)
    - Profile (optional)
    - Orders
    - Subscriptions
      - Subscription detail (skip/pause/resume/cancel after commitment)
    - Addresses (optional; TBD)
    - Payment method update (for subscriptions; TBD)
  - Content
    - Blog
      - Article
    - Landing pages (campaigns/collections)
  - Support
    - FAQ
    - Contact
  - Policies
    - Terms (TBD)
    - Privacy (TBD)
    - Cookies (TBD)
    - Returns policy

/en
  - Same structure as /da (English content)
```

## Route notes (optional)
- **Auth-gated areas**: account + subscription management
- **SEO pages**: /da and /en content pages + PLP + PDP + blog + landing pages
- **Canonical**: filter/search pages canonical to base category (default)
- **Tracking**: PostHog behind analytics consent; Meta/Google Ads behind marketing consent

## Page inventory (MVP)

- **Page**: Home
  - **Goal**: discovery + merchandising + trust
  - **Primary actions**: browse categories/concerns; view featured products; search
  - **Data**: homepage sections (CMS), featured products (Medusa), consent state
  - **States required**: loading / empty / error

- **Page**: Category / Brand / Concern (PLP)
  - **Goal**: find relevant products quickly
  - **Primary actions**: filter/sort; open PDP; add to cart
  - **Data**: products, prices, availability
  - **States required**: loading / empty / error

- **Page**: Product (PDP)
  - **Goal**: understand product + choose to buy (one-time or subscription)
  - **Primary actions**: add to cart; choose subscription cycle; read guidance
  - **Data**: product details/pricing (Medusa), guidance/SEO (Payload)
  - **States required**: loading / error

- **Page**: Cart
  - **Goal**: review order and proceed to checkout
  - **Primary actions**: adjust quantities; proceed
  - **Data**: cart items/prices
  - **States required**: loading / empty / error

- **Page**: Checkout
  - **Goal**: complete purchase
  - **Primary actions**: enter shipping details; choose parcel shop; pay
  - **Data**: shipping options (Shipmondo), payment methods (Adyen)
  - **States required**: loading / error

- **Page**: Order confirmation
  - **Goal**: confirm order + next steps
  - **Primary actions**: view order; create account (optional)
  - **Data**: order summary
  - **States required**: loading / error

- **Page**: Account (Orders + Subscriptions)
  - **Goal**: manage orders and subscriptions
  - **Primary actions**: view orders; skip/pause/resume/cancel subscription
  - **Data**: subscriptions state (Medusa), payment retry/on-hold state
  - **States required**: loading / empty / error

- **Page**: Blog/Article + Static pages
  - **Goal**: SEO content + customer support
  - **Primary actions**: read; navigate to product categories
  - **Data**: CMS content + SEO fields + structured data
  - **States required**: loading / error

## Future pages / Roadmap (park here)
- Membership club / loyalty
- Self-serve returns portal
- Advanced personalization / quizzes

## Planning rule
- Every MVP feature must map to **at least one page** (or an explicit API-only surface).
- Every page must be represented in tasks (at least: scaffold + basic states).

