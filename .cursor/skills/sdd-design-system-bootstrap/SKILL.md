---
name: sdd-design-system-bootstrap
description: Bootstrap a usable design system early (Tailwind + shadcn/ui) to avoid design babysitting later. Produces spec/07-design-system.md and a UI Definition of Done checklist.
metadata:
  sdd_category: design
---

# SDD: Design System Bootstrap (Tailwind + shadcn/ui)

## When to use

- During `/spec/init` or `/spec/refine` when design direction is unclear or repeatedly causes rework.
- Before `/spec/plan` so design work can be turned into concrete, non-babysat tasks.

## Inputs (ask if missing)

- Product vibe / adjectives (3–5)
- Target surfaces (primary screens + whether data-dense)
- Brand constraints (logo, existing colors, typography)
- Accessibility target (default: WCAG AA)

## Output contract

Produce or update `spec/07-design-system.md` with:
- Style direction (do/don’t)
- Token table (semantic colors, typography, spacing, radius/shadows)
- Component conventions (shadcn/ui)
- UI patterns (nav/forms/tables/states)
- UI Definition of Done checklist

## Rules

- Make it usable, not aspirational.
- Prefer semantic tokens over raw colors.
- Keep it compatible with Tailwind + shadcn/ui defaults (can be overridden intentionally).
