---
name: sdd-commit-unit
description: Create small, reviewable commits per logical unit of work with consistent messages tied to the task ID. Use during implementation and batch runs.
metadata:
  sdd_category: git
---

# SDD: Commit a Logical Unit

## When to use

- After completing a coherent step (not after every file).
- Before switching focus or running validation.
- During batch runs after each “unit” completes.

## Inputs

- Task ID (from `work/backlog/tasks.local.md` or user input)
- Current diff (`git diff` and `git status`)
- Commit message style: concise, why-focused, task-linked

## Output contract

Return:
- `commitCreated`: yes/no
- `commitHash` (if created)
- `message`
- `filesChangedSummary`

## Rules

- Never commit secrets (`.env`, credential files, tokens).
- If there are no changes, do not create an empty commit.
- Keep commits small and reviewable; split if multiple concerns.

## Suggested commit message pattern

- Title: `<task-id>: <verb> <scope> (<why>)`
- Body (optional): 1–3 bullets explaining intent and risk

Example:
- `t1.2: add branch detection helper (avoid hardcoded main)`
