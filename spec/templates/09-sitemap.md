# Sitemap / Information Architecture

This document prevents “missing pages” by making the UI surface area explicit **before implementation**.

## MVP sitemap (required)

Write the MVP navigation as a tree. Keep it user-facing (not technical routes).

Example:

```text
/
  - Landing
  - Pricing
  - Sign in
  - Sign up

/app
  - Dashboard
  - Projects
    - Project details
  - Settings
```

## Route notes (optional)

- **Auth-gated areas**: [list pages]
- **Roles**: [who can see what]
- **SEO pages**: [list]
- **Deep links**: [list]

## Page inventory (MVP)

For each page, define the minimum:

- **Page**: [name]
  - **Goal**: [what user achieves]
  - **Primary actions**: [1–3]
  - **Data**: [entities needed]
  - **States required**: loading / empty / error

## Future pages / Roadmap (park here)

- [Page]

## Planning rule

- Every MVP feature must map to **at least one page** (or an explicit API-only surface).
- Every page must be represented in tasks (at least: scaffold + basic states).

