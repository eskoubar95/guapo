# Design System (Tailwind + shadcn/ui default)

This document defines the **visual direction, tokens, component conventions, and UI quality gates** for this project.
It is intended to reduce “design babysitting” by making decisions explicit early.

## Design goals (1–3 bullets)

- [e.g., “Calm, professional dashboard UI with strong information hierarchy.”]
- [e.g., “Fast to build with shadcn/ui primitives, customized via tokens.”]

## References (2–3 links)

- [Link 1]
- [Link 2]
- [Link 3] (optional)

## Style direction

- **Adjectives**: [e.g., minimal, calm, premium, technical, playful]
- **Do**: [e.g., subtle borders, low saturation, consistent spacing]
- **Don’t**: [e.g., heavy shadows everywhere, inconsistent radii, random colors]

## Target surfaces

- **Primary**: [e.g., dashboard, editor, settings]
- **Secondary**: [e.g., marketing pages, onboarding]
- **Dense data UI?**: [yes/no] (tables, filters, bulk actions)

## UI stack assumptions (edit if different)

- **Styling**: Tailwind CSS
- **Component library**: shadcn/ui
- **Icons**: [lucide-react / other]
- **Typography**: [Inter / other]

## Tokens

### Color tokens (semantic-first)

Define tokens by meaning, not by raw hex usage.

#### Neutral scale

- `background`: [hex]
- `surface`: [hex]
- `surfaceMuted`: [hex]
- `border`: [hex]
- `textPrimary`: [hex]
- `textSecondary`: [hex]
- `textMuted`: [hex]

#### Brand / accent

- `primary`: [hex]
- `primaryForeground`: [hex]
- `secondary`: [hex] (optional)
- `secondaryForeground`: [hex] (optional)

#### Semantic colors

- `success`: [hex]
- `successForeground`: [hex]
- `warning`: [hex]
- `warningForeground`: [hex]
- `error`: [hex]
- `errorForeground`: [hex]
- `info`: [hex]
- `infoForeground`: [hex]

#### States

- **Focus ring**: [color + thickness]
- **Disabled**: [opacity + cursor rules]
- **Hover/active**: [rule of thumb]

### Typography tokens

- **Font family**: [e.g., Inter]
- **Scale**:
  - `xs`: [size/line-height]
  - `sm`: [size/line-height]
  - `base`: [size/line-height]
  - `lg`: [size/line-height]
  - `xl`: [size/line-height]
- **Weights**: [regular/medium/semibold/bold]

### Spacing tokens

- **Base unit**: 4px (default)
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64 (edit as needed)

### Radius + shadow tokens

- **Radius**: `sm`, `md`, `lg` with definitions (or “use shadcn defaults”)
- **Shadow**: [subtle / medium / none] (define when to use which)

### Motion (optional)

- **Animation duration**: [e.g., 150–250ms]
- **Easing**: [e.g., ease-out]

## Component conventions (shadcn/ui)

### Phase 1 “must-have” components

- Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Dialog, Sheet/Drawer, DropdownMenu, Tooltip
- Tabs, Table, Badge, Card, Skeleton
- Toast/Sonner, Separator

### Component rules

- Variants must be token-driven (no ad-hoc colors).
- Every interactive component must have:
  - hover/active/disabled
  - focus-visible state
  - loading state (if async)
  - error state (if form-related)

## UI patterns

- **Navigation**: [sidebar/topbar/breadcrumb rules]
- **Forms**: validation rules, error copy tone, required vs optional
- **Tables**: empty state, loading skeleton, pagination, bulk actions
- **Empty/error/loading states**: required for primary flows

## Accessibility (minimum)

- **Target**: WCAG AA
- **Contrast**: document minimum ratios for text and UI elements
- **Keyboard**: all interactive UI must be reachable and operable
- **Focus**: visible focus ring everywhere, no focus traps
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

