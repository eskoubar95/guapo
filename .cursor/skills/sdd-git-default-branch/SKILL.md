---
name: sdd-git-default-branch
description: Resolve default/development/production branches consistently across projects. Use before creating task branches, counting commits, creating PRs, or generating diffs.
metadata:
  sdd_category: git
---

# SDD: Resolve Git Default Branch

## When to use

- You are about to create a task branch.
- You need to compute diffs/commit counts against the base branch.
- You are about to create or update a PR.
- You see any workflow text hardcoding `main`/`develop`/`staging` and need to make it project-agnostic.

## Inputs

- Optional: `.sdd/git-config.json` (project-specific config; preferred)
- Git remote metadata: `origin` HEAD branch (if available)
- Local/remote branch existence

## Output contract (what you must return)

Return a short structured result:

- `defaultBranch`: the branch to use as PR base and “clean base” checkout
- `developmentBranch`: optional; defaults to `defaultBranch` if not known
- `productionBranch`: optional; defaults to `defaultBranch` if not known
- `source`: `config` | `remoteHead` | `fallback`

## Algorithm (project-agnostic)

1. **Config (highest priority)**: If `.sdd/git-config.json` exists, read:
   - `default_branch` OR `development_branch` as `defaultBranch`
   - `development_branch` as `developmentBranch` (fallback: `defaultBranch`)
   - `production_branch` as `productionBranch` (fallback: `defaultBranch`)
2. **Remote HEAD**: If `origin` exists, read the remote default branch (e.g., `git remote show origin` and parse `HEAD branch`).
3. **Fallback**: If remote HEAD is unavailable, pick the first existing branch in this order (local OR remote):
   - `main`
   - `master`
   - `develop`
4. If nothing is detectable, return `defaultBranch: "main"` and include a warning in your explanation.

## Rules

- Do not assume `staging` exists. If a project uses `staging`, it should be configured in `.sdd/git-config.json`.
- Never hardcode `main` as “the” default branch in documentation. Use `defaultBranch` (resolved by this skill).
- If the project has `work/backlog/tasks.local.md`, include the task ID in downstream commit/PR titles (but this skill itself only resolves branches).
