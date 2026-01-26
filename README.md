# Project Name

This project uses Spec-Driven Development (SDD) with the Project Operating System (POS).

## Repo

- GitHub: `https://github.com/eskoubar95/guapo`
- Repo layout: monorepo with `apps/*` (`apps/storefront`, `apps/commerce`, `apps/cms`)
- Package manager: pnpm (via Corepack)
- Env var inventory: `env.example` (names only; no secrets)

## Getting Started

1. Open this project in Cursor
2. Run `/spec/init` to begin defining your project specification
3. Follow the SDD workflow: spec → plan → task → validate

## Workflow

```txt
/spec/init
/spec/refine   (optional, repeatable)
/spec/plan
/task/start
[work]
/task/validate
```

## Project Structure

- `spec/` - Source of truth (specifications)
- `work/` - Execution artifacts (milestones, tasks)
- `.cursor/` - POS rules and commands

For more information, see the POS documentation in `.cursor/rules/`.

## GitHub workflow (local → PR)

1. Create a task branch (example):
   - `git checkout -b task/t1.2-package-manager`
2. Push the branch:
   - `git push -u origin HEAD`
3. Create a PR (CLI):
   - `gh pr create --base main --head HEAD`

CI-required checks are TBD until we add GitHub Actions.

