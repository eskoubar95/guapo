# Design System

This document defines the **visual direction, tokens, component conventions, and UI quality gates** for Guapo.
It is intended to reduce “design babysitting” by making decisions explicit early and keeping the UI consistent.

## Design goals (1–3 bullets)
- Calm, **unisex**, and trustworthy e-commerce experience with strong information hierarchy.
- “Matas-like” clarity and scannability, but **distinct** brand expression (Guapo).
- Fast, intuitive flows (browse → PDP → cart → checkout) with excellent performance perception.

## References
- Matas (layout inspiration; exact pages TBD)

## Style direction
- **Adjectives**: clean, calm, premium-but-approachable, unisex, modern, light
- **Do**:
  - Use generous whitespace and consistent spacing
  - Keep surfaces light; use **dark navy** as a strong brand anchor (CTAs, nav highlights)
  - Use soft, low-saturation pastel accents sparingly (categories, highlights, badges)
  - Prioritize readability for ingredient and guidance content (PDP)
- **Don’t**:
  - Overuse heavy shadows or high-contrast, aggressive colors
  - Use “gendered” styling cues (overly masculine/feminine patterns)
  - Create random one-off colors per page/section

## Target surfaces
- **Primary**: storefront (PLP/PDP), cart, checkout, account, support pages
- **Secondary**: content pages + blog (SEO)
- **Dense data UI?**: no (storefront-first; avoid dashboard-like density)

## UI stack assumptions (edit if different)
- **Styling**: TBD (likely Tailwind CSS if using Next.js)
- **Component library**: TBD (optional; choose later)
- **Icons**: TBD
- **Typography**: TBD

## Tokens

Tokens are **semantic-first**: name by meaning, not raw hex.
Hex values below are **initial direction** and can be adjusted once the final logo color is confirmed.

### Color tokens

#### Neutral scale (light-first)
- `background`: #FFFFFF
- `surface`: #F8FAFC
- `surfaceMuted`: #F1F5F9
- `border`: #E2E8F0
- `textPrimary`: #0F172A
- `textSecondary`: #334155
- `textMuted`: #64748B

#### Brand / accent
- `primary`: TBD (Guapo logo dark navy)
- `primaryForeground`: #FFFFFF
- `secondary`: #E6F0FF (soft, unisex pastel-blue; optional)
- `secondaryForeground`: #0F172A

#### Semantic colors
- `success`: #16A34A
- `successForeground`: #FFFFFF
- `warning`: #F59E0B
- `warningForeground`: #0F172A
- `error`: #DC2626
- `errorForeground`: #FFFFFF
- `info`: #2563EB
- `infoForeground`: #FFFFFF

#### States
- **Focus indicator (no focus rings)**: use a strong **active border** (2px) in `primary` (fallback: #2563EB). Avoid glow/ring effects.
- **Disabled**: 50–60% opacity + `cursor: not-allowed`
- **Hover/active**: darken `primary` slightly; increase border contrast for neutral controls

### Typography tokens
- **Font family**: TBD (recommended: a modern sans-serif, e.g., Inter)
- **Scale** (initial):
  - `xs`: 12/16
  - `sm`: 14/20
  - `base`: 16/24
  - `lg`: 18/28
  - `xl`: 20/30
- **Weights**: 400, 500, 600

### Spacing tokens
- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64

### Radius + shadow tokens
- **Radius**: subtle and consistent (avoid extremes)
  - `sm`: 6px
  - `md`: 10px
  - `lg`: 14px
- **Shadow**: subtle only; use borders as the primary separation tool

### Motion (optional)
- **Animation duration**: 150–250ms
- **Easing**: ease-out

## Component conventions

### Phase 1 “must-have” components
- Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Dialog/Modal, Sheet/Drawer, Dropdown, Tooltip
- Tabs, Badge, Card, Skeleton/Loading
- Toast/Notifications, Separator

### Component rules
- Variants must be token-driven (no ad-hoc colors).
- Every interactive component must have:
  - hover/active/disabled
  - focus-visible state (implemented via **active border**, not a focus ring)
  - loading state (if async)
  - error state (if form-related)

## UI patterns

- **Navigation**:
  - Simple top navigation with clear categories and search prominence
  - Use breadcrumbs on PDP and deep category pages
- **Product listing (PLP)**:
  - Strong scannability: image, brand, key benefit, price, rating (if available)
  - Filters should be fast and not block browsing
- **Product detail (PDP)**:
  - Split content into clear sections: “What it is”, “Who it’s for”, “Key ingredients”, “How to use”
  - Guidance content should be readable and consistent; avoid wall-of-text
  - Subscription option should be clear but not confusing: cycle selector + “why subscribe” summary
- **Forms**:
  - Short, calm microcopy; error messages should be actionable
  - Required vs optional fields must be explicit
- **Empty/error/loading states**:
  - Required for primary flows (search no results, cart empty, checkout errors, subscription failures)

## Accessibility (minimum)
- **Target**: WCAG AA
- **Contrast**: ensure text and interactive controls meet AA (especially `primary` on `background`)
- **Keyboard**: all interactive UI reachable and operable
- **Focus**: visible focus indicator everywhere (use **active border**); no focus traps
- **Screen readers**: labels/roles for inputs, dialogs, menus

## UI Definition of Done (copy into tasks)
- [ ] Matches tokens and component conventions
- [ ] Responsive: mobile (320px), tablet (768px), desktop (1024px+)
- [ ] No horizontal scrolling in primary flows
- [ ] Keyboard navigation works end-to-end
- [ ] Focus states are visible and consistent
- [ ] Contrast meets WCAG AA
- [ ] Empty/loading/error states implemented for the flow
- [ ] No UI regressions in common paths (verify key screens)

