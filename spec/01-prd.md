# Guapo — Product Requirements Document (PRD)

This PRD summarizes the product intent for Guapo MVP and provides a shared reference for planning and delivery.

## 1) Overview
Guapo is a Denmark-first, unisex beauty e-commerce store. The initial focus is **face skincare**, with a longer-term vision to expand into additional beauty categories (body, hair, fragrance). Guapo sells established brands (not private label), with strong emphasis on Korean beauty (not exclusive).

## 2) Problem statement
Buying skincare is overwhelming without guidance. Customers want:
- clear, trustworthy information (ingredients, what it is good for, fit for skin type/concerns)
- a fast, intuitive shopping experience
- competitive pricing

## 3) Goals (MVP)
- Launch a trustworthy, **curation-first** skincare store for Denmark with a great UX.
- Support both one-time purchases and product subscriptions.
- Enable content + SEO iteration via CMS (pages, blog, landing pages, homepage composition).
- Enable consent-aware analytics and marketing tracking from day one.

## 4) Non-goals (MVP)
- Private label / own manufactured products
- Physical retail (shops/pop-ups)
- Multi-vendor marketplace (other sellers selling through Guapo)
- International expansion beyond Denmark
- Membership club with points/loyalty perks (future)

## 5) Target users (MVP)
- Primary: all genders in Denmark
- Secondary: new-to-skincare buyers, ingredient-focused buyers, gift buyers (personas to refine later)

## 6) MVP scope (capabilities)

### 6.1 Product discovery
- Catalog browsing (categories/brands)
- Search and filters (category, brand, price)
- Product detail pages (PDP)

### 6.2 Curation & guidance
- Guidance content by skin type and concern
- Ingredient explanations and usage guidance
- Routine templates:
  - templates by skin type and by concern
  - 3-step baseline + optional 5-step variant (K-beauty)

### 6.3 Commerce
- Cart → checkout → order confirmation
- Guest checkout allowed
- Accounts (login + order history)
- Reviews
- Support: FAQ + contact entry point

### 6.4 Payments (Denmark)
- Provider: Adyen
- Payment methods: cards, Apple Pay, Google Pay, MobilePay, Klarna

### 6.5 Shipping & returns (Denmark)
- Shipping via Shipmondo
- Delivery option: parcel shop only (MVP)
- Shipping price policy: flat rate (amount TBD)
- Returns: 14 days, customer-paid return label; opened products not returnable (except defective/faulty)

### 6.6 Subscriptions (MVP)
- Cycles: 4 / 8 / 12 weeks
- Discount: 5% on subscription deliveries (all renewals)
- Customer controls: skip next delivery, pause, resume, cancel (after commitment)
- Minimum commitment: 2 fulfilled deliveries before cancellation
- Failed payment retry: 2 retries over 3 days, then subscription on hold until payment method update
- Notifications: email-only (upcoming renewal 3 days before, receipts, failures/recovered, skip/pause/resume/cancel confirmations, shipping/tracking)
- Returns/refunds: partial refunds supported; if a subscription delivery is refunded/returned, subscription auto-pauses until customer resumes

### 6.7 CMS + SEO
- CMS (Payload) must manage:
  - static pages (about/contact/FAQ/policies)
  - blog/articles
  - landing pages (campaigns/collections)
  - navigation/footer links
  - PDP guidance fields
  - homepage composition via page builder with predefined section types
- SEO foundations:
  - required SEO fields for content/blog: meta title/description, OpenGraph, canonical, robots, structured data where applicable
  - structured data at launch: Product, BreadcrumbList, Organization, WebSite+SearchAction, Article, FAQPage
  - i18n URLs: `/da/...` and `/en/...`
  - sitemap: single `sitemap.xml`
  - canonical: filtered/search pages canonical to base category (no indexing of filter combinations by default)

### 6.8 Privacy, consent, analytics, marketing
- Cookie consent in MVP with categories: necessary / analytics / marketing
- Analytics: PostHog (behind analytics consent)
- Marketing: Meta + Google Ads pixels (behind marketing consent)

### 6.9 Transactional emails
- Provider: Plunk
- Requirements: deliverability setup (SPF/DKIM/DMARC), suppression/bounces, separation of transactional vs marketing sending streams

## 7) Success metrics
- Primary early success signal (first 60–90 days): **10 orders/week**
- Secondary (to define in planning): conversion rate, AOV, margin/unit economics, repeat purchase rate

## 8) Assumptions & constraints
- Denmark-first launch; content available in Danish + English
- Own-stock fulfillment (self-shipping)
- No advanced personalization/AI recommendations in MVP (future)

## 9) Risks and open questions
- Risks: `spec/03-risks.md`
- Open questions: `spec/04-open-questions.md`

