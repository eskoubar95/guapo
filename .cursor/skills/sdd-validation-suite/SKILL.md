---
name: sdd-validation-suite
description: Run a lightweight, project-agnostic validation suite (lint, typecheck, build, tests when present) and summarize pass/fail with actionable error highlights.
metadata:
  sdd_category: validation
---

# SDD: Validation Suite

## When to use

- During `/task/validate` before opening/updating a PR.
- During `/task/batch` after each task (and optionally after each logical unit).

## Inputs

- Project type + tooling (from detection or repo files)
- Available scripts (package.json, makefile, etc.)
- Optional: workspace scope (monorepo), e.g. `apps/storefront`

## Output contract

Return a compact report:
- `lint`: pass/fail/skipped
- `typecheck`: pass/fail/skipped
- `tests`: pass/fail/skipped
- `build`: pass/fail/skipped
- `highlights`: top 3 actionable errors (if any)

## Execution strategy (project-agnostic)

- If JS/TS: prefer `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` when scripts exist.
- If Python: prefer `ruff`, `mypy`, `pytest` when configured.
- If unknown: run the minimum safe checks available, and clearly mark skipped items.

**Monorepo rule (if applicable):**
- If the repo is a monorepo, run commands **scoped to the task workspace** (do not run repo-wide by default).
- Examples:
  - `pnpm -C <workspace> run lint`
  - `npm --prefix <workspace> run test`
  - `yarn --cwd <workspace> test`
- If no workspace scope is provided for a monorepo task, treat validation as **blocked** until scope is clarified.

## Rules

- Do not invent commands that don’t exist.
- If a step fails, stop and report errors before continuing.
