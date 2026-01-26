---
helper_id: branch-detection
load_when:
  - task_start
  - task_validate
  - pr_creation_needed
  - git_operation_needed
sections:
  detection:
    title: "Default Branch Detection"
    lines: [1, 140]
  usage:
    title: "Usage in Commands"
    lines: [141, 220]
always_load: false
---

# Default Branch Detection

This helper defines a **project-agnostic** way to detect the base branch to use for:
- creating task branches
- generating diffs and commit counts
- creating PRs
- merging (when applicable)

## Detection logic (priority order)

**Priority 0 — Project config (preferred):**
- If `.sdd/git-config.json` exists, read:
  - `default_branch` OR `development_branch` → base branch
  - optional: `production_branch`

Example config:

```json
{
  "default_branch": "main",
  "development_branch": "main",
  "production_branch": "main"
}
```

**Priority 1 — Remote HEAD:**
- If `origin` exists, resolve remote default branch (HEAD branch).

**Priority 2 — Conventional fallbacks (local or remote):**
- `main`
- `master`
- `develop`

**Priority 3 — Last resort:**
- Use `main` and log a warning that branch detection failed.

## Notes

- Do **not** assume `staging` exists. If a project uses `staging` (or any non-standard branch), it must be configured in `.sdd/git-config.json`.
- Never hardcode `main` in commands or helpers. Always use `<default-branch>` resolved by this helper (or the Cursor 2.4+ skill `/sdd-git-default-branch`).

## Usage in Commands

### In `/task/start`

1. Resolve `<default-branch>` using the detection logic above.
2. Checkout and update base branch:
   - `git checkout <default-branch>`
   - `git pull origin <default-branch>` (if remote exists)
3. Create task branch from base:
   - `git checkout -b task/<task-id>-<kebab-description>`

### In PR creation

- Always set PR base to `<default-branch>`.

### For diff and commit counts

- Diff: `git diff <default-branch>...HEAD`
- Commit list: `git log <default-branch>..HEAD`
- Commit count: `git rev-list --count <default-branch>..HEAD`
