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

## Rules

- Never assume base is `main`.
- Prefer updating an existing PR over creating duplicates.
- Do not push unless user asked to push (or the workflow explicitly requires it).
