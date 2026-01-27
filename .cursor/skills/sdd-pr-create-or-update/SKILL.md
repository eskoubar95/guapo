---
name: sdd-pr-create-or-update
description: Create or update a PR with correct base branch, task-linked title, and a structured body (changes, testing, acceptance). Use after validation or at milestone boundaries.
metadata:
  sdd_category: github
---

# SDD: Create or Update Pull Request

## When to use

- After `/task/validate` passes (or passes with known exceptions).
- During `/task/batch` when configured to open PRs per task or per milestone.

## Inputs

- Base branch: resolve via `/sdd-git-default-branch`
- Task ID + short title
- Git changes: commits since base branch, `git diff <base>...HEAD --stat`
- Validation result summary (lint/tests/build)

## Output contract

Return:
- `action`: created/updated/noop
- `prUrl` (if created/updated)
- `baseBranchUsed`

## Body template

Use a structured PR body:

- **Summary**: 1–3 bullets
- **Test plan**: checklist
- **Notes / risks**: optional

## Promotion PR (Release to Production)

**When to use:**
- After feature work has been merged to `staging` and tested
- When ready to release to production (`main`)

**Process:**
1. Resolve branches from `.sdd/git-config.json`:
   - `default_branch` (typically `staging`) → head branch
   - `production_branch` (typically `main`) → base branch
2. Verify `developmentBranch` is up-to-date and contains all features to release
3. Create PR: head=`developmentBranch`, base=`productionBranch`
4. PR title: `Release: [milestone/version]` or `Promote staging to main`
5. PR body should include:
   - Summary of changes since last production release
   - Testing evidence from staging
   - Deployment checklist
   - Rollback plan (if applicable)

**Note:** Use `/task/promote` command for promotion PRs (see command documentation).

## Rules

- Never assume base is `main` for feature PRs (use `default_branch` from config).
- For promotion PRs, use `default_branch` → `production_branch` from config.
- Prefer updating an existing PR over creating duplicates.
- Do not push unless user asked to push (or the workflow explicitly requires it).
