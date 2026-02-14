# Guapo — Root Specification

## 1. Idea overview
Guapo is a Denmark-first beauty e-commerce store. The initial focus is **face skincare**, with a longer-term vision to expand into additional beauty categories (body, hair, fragrance).

Guapo is **not a private label**: it sells established brands (with a strong emphasis on Korean beauty, without being limited to it).

## 2. Problem & primary goal
From a customer perspective, Guapo solves the combination of:
- **Decision fatigue**: it is hard to choose the right skincare products without guidance.
- **Trust and clarity**: customers want understandable information about ingredients, skin type fit, and intended outcomes.
- **Ease of purchase**: the experience should be fast, intuitive, and dependable.

**Primary goal (MVP):** Launch a trustworthy and easy-to-buy skincare store where **curation and guidance** make it simpler to choose products, while still being competitively priced.

## 3. Target users (MVP)
Primary audience is **all genders in Denmark**.

Notes:
- The idea originated with a men-first angle, but MVP is explicitly **unisex** to match market realities.
- Personas can be refined later (e.g., “new to skincare”, “ingredient-focused”, “gift buyer”).

## 4. Core value proposition
**Curation-first guidance** that helps customers buy with confidence:
- Guidance by **skin type** and common concerns (e.g., dryness, acne, sensitivity)
- Clear **ingredient explanations** and “what it is good for”
- Recommendations for **product combinations/routines** where possible
  - MVP routines: simple templates by skin type and concern (3-step baseline + optional 5-step variant)

Secondary value:
- **Great UX**: fast, intuitive, “top-notch” UI/UX
- **Competitive pricing** positioning (avoid strict “cheapest” claim in MVP)

## 5. Initial scope (high-level)
In scope:
- Face skincare-focused catalog at launch
- Unisex brand tone and presentation
- SEO-ready content and product pages (metadata and indexable pages)

Out of scope (explicit):
- Selling own produced products (private label)
- Physical retail presence (shops/pop-ups)
- Becoming a multi-vendor marketplace (third parties selling through Guapo)

## 5.1 MVP vs future (scope locking)

### MVP (ship target)
- **Product discovery**: catalog, search, filters (category, brand, price) and product detail pages
- **Guidance**: skin type fit, ingredients, and “good for” content on product pages; light “recommended combinations”
- **Commerce flow**: cart, checkout, order confirmation
- **Accounts**: login/account + order history
- **Payments + shipping (DK)**:
  - Payment provider integration (Adyen)
  - Payment methods in MVP: cards, Apple Pay, Google Pay, MobilePay, Klarna
  - Guest checkout is allowed for one-time purchases; **subscriptions require an account**
  - Shipping via Shipmondo (carrier selection via Shipmondo; MVP: parcel shop only)
  - Shipping carriers (MVP): GLS + DAO
  - Shipping price policy: flat rate (39 DKK)
  - Returns: 14-day window; customer pays return label
  - Email notifications
- **Content + SEO basics**:
  - CMS-managed pages (about/help/policy pages as needed)
  - Blog/articles capability with SEO fields
  - Landing pages (campaigns/collections) managed via CMS
  - Homepage composition managed via CMS (reorder components/content easily)
  - SEO foundations:
    - content SEO fields: meta title/description, OpenGraph, canonical, robots, structured data where relevant
    - technical SEO: indexable pages, sitemap, canonical strategy
- **Product subscriptions (MVP)**:
  - Customers can subscribe to an item with a cycle: **every 4, 8, or 12 weeks**
  - Discount model: **5% off** subscription deliveries
  - Minimum commitment: **2 deliveries** before cancellation is allowed
  - Requires **recurring billing** (details in open questions / infrastructure)
  - Customer controls in MVP: **skip next delivery**, **pause**, **cancel** (cancel after minimum commitment)
- **Reviews**: product review capability
- **Support**: FAQ + contact/support entry point

### Future ideas / roadmap (park here)
- Membership club with subscription fee + points/loyalty perks
- Expansion beyond Denmark (languages/currencies/shipping rules)
- Major category expansion beyond face skincare (body/hair/fragrance as first-class categories)
- Advanced personalization (skin quiz, AI recommendations)
- Qogita integration for automated import/pricing/stock/supplier selection (decision pending after investigation)
- Advanced subscription lifecycle features (pause/skip/swap/bundles/rules)
- Self-serve returns portal

## 6. Success signals (MVP)
Primary early success signal (first 60–90 days):
- **10 orders/week**

Secondary (to define later, not required for /spec/init):
- Conversion rate, AOV, margin/unit economics, repeat purchases

## 7. Notes
- Initial market entry is Denmark; launch should support **Danish and English** language content (still DK fulfillment).
- Fulfillment is planned as **own stock / self-shipping** (not dropship as default).

## 8. Related specifications
- `spec/02-architecture.md`
- `spec/03-risks.md`
- `spec/04-open-questions.md`
- `spec/07-design-system.md`
- `spec/08-infrastructure.md`
- `spec/10-cms-commerce-synergy.md` (Payload vs Medusa; canonical keys; storefront data flow)