# Acceptance Criteria / Ship Checklist

This document defines what “done” means for the **MVP** (and optionally later phases).
Use it as the project’s **ship gate** during planning and validation.

## MVP definition (1–5 bullets)

- [What must be true to call the MVP shipped?]

## Success criteria (measurable if possible)

- [Metric / outcome]

## Scope boundaries

### In scope (MVP)
- [Feature / capability]

### Out of scope (MVP)
- [Feature / capability]

### Future ideas / Roadmap (park here)
- [Item]

## Non-functional requirements (MVP)

- **Performance**: [e.g., pages load < 2s on mid-tier device]
- **Reliability**: [e.g., error budget / retries]
- **Security**: [e.g., auth, roles, audit trail]
- **Accessibility**: [e.g., WCAG AA]
- **Privacy/Compliance**: [if applicable]

## Quality gates (must pass to ship MVP)

- [ ] Key user journeys verified end-to-end
- [ ] Error/empty/loading states implemented for primary flows
- [ ] Logging/monitoring in place (minimum viable observability)
- [ ] Data migrations/backups strategy (if DB)
- [ ] Security basics covered (auth, access control, secrets handling)
- [ ] CI checks passing (lint/typecheck/tests/build as applicable)
- [ ] Deployment pipeline ready (preview + production)

## Test plan (MVP)

- **Manual smoke tests**:
  - [Flow 1]
  - [Flow 2]
- **Automated tests**:
  - Unit: [yes/no]
  - Integration: [yes/no]
  - E2E: [yes/no]

## Release plan (MVP)

- **Rollout**: [gradual/full]
- **Rollback**: [plan]
- **Monitoring**: [what to watch]
- **Support**: [who responds to incidents]

