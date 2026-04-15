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

**Before starting a new milestone:**
- If you keep local planning files under `work/backlog/` (gitignored), review `MILESTONE-READY-CHECKLIST.md` there
- Ensure git configuration and branch status are correct

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

### Feature Development (Feature → Staging)

1. Create a task branch (example):
   - `git checkout -b task/t2.1-scaffold-payload`
2. Push the branch:
   - `git push -u origin HEAD`
3. Create a PR (CLI):
   - `gh pr create --base staging --head HEAD`
   - Or use `/task/validate` which auto-creates PRs targeting `staging`
4. After PR approval and CI checks pass, merge to `staging`

### Production Release (Staging → Main)

1. **When ready to release** (can include multiple milestones/features):
   - Use `/task/promote` command to create promotion PR
   - Or manually: `gh pr create --base main --head staging`
   - **Note:** You can accumulate multiple milestones/features in staging before promoting. The promotion PR will include all changes since the last production release.
2. After PR approval and CI checks pass, merge to `main`

### Required Checks

All PRs must pass:
- `CI / SDD Sanity Checks` (validates git-config, helper metadata, spec files)
- `PR Policy / Enforce Branch Policy` (enforces branch workflow)

**Branch Protection:**
- Direct pushes to `staging` and `main` are blocked
- PRs require at least 1 approval
- See `.github/BRANCH-PROTECTION.md` for setup instructions

