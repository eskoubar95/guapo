---
name: sdd-task-preflight
description: Prepare a task workspace safely before implementation: clean working tree, correct base branch, and task branch naming. Use before /task/start execution work.
metadata:
  sdd_category: git
---

# SDD: Task Preflight (Git Safety)

## When to use

- Right before starting implementation for a task (single task or batch task).
- When you suspect you’re on the wrong branch or have dirty state.

## Inputs

- Task context (ideally: `taskId`, short description)
- Repo state: `git status`, current branch, remotes
- Base branch: resolve via `/sdd-git-default-branch` (preferred) or helper `branch-detection.md`

## Output contract

Return:
- `baseBranch`
- `taskBranch`
- `actionsTaken` (bullets)
- `blockingIssues` (bullets; empty if none)

## Procedure

1. **Validate working tree is clean**
   - If dirty/untracked: stop and report as `blockingIssues` (do not auto-stash).
2. **Resolve `baseBranch`**
   - Use `/sdd-git-default-branch` to resolve `defaultBranch`.
3. **Ensure base branch is up to date**
   - Checkout `baseBranch`
   - If remote exists: pull latest (`git pull origin <baseBranch>`)
4. **Create/checkout task branch**
   - Naming: `task/<task-id>-<short-description>` (kebab-case)
   - If exists locally: checkout
   - Else: create from `baseBranch`

## Rules

- Never merge/rebase in preflight.
- Never commit anything in preflight.
- Never assume `main`.
