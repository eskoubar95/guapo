# Linear Label + Status Mapping Guide

This guide defines how SDD task metadata maps to Linear statuses, labels, and projects.

## Status mapping

SDD status values (from `work/backlog/tasks.local.md`) map to Linear issue statuses via `work/linear/sync-config.md`:

- `backlog` → `STATUS_BACKLOG`
- `in-progress` → `STATUS_IN_PROGRESS`
- `done` → `STATUS_DONE`
- `blocked` → `STATUS_BLOCKED`

Use **status names** (recommended) unless you need fixed status IDs.

## Label strategy (project-agnostic)

### 1) Source of truth: task tags

Prefer using `**Tags:**` in `work/backlog/tasks.local.md`.

Example:

```markdown
**Tags:** backend, security, documentation
```

**Rule:** Each tag can be used as a Linear label name.

- If `LABEL_PREFIX` is set in `sync-config.md`, prepend it to every auto-assigned label.
- If a label does not exist, the system may try to create it. If creation fails, guide the user to create it manually.

### 2) Recommended label groups (optional)

These are suggestions, not requirements. Your team can rename them freely.

- **Core / domain labels**: `backend`, `frontend`, `infrastructure`, `security`, `design`, `documentation`, `performance`, `observability`, `integration`
- **Type labels (only when true)**: `feature`, `bug`, `improvement`
- **Decision label**: `decision` (for explicit choices / comparisons)
- **Release label**: `release`

### 3) Avoid default “Feature everywhere”

Do **not** auto-add a “feature” label to all issues by default.
Only add `feature` if the task is actually a new feature (best: include `feature` explicitly in `**Tags:**`).

## Projects / milestones

If `AUTO_CREATE_PROJECTS=true` in `sync-config.md`:
- Each milestone in `work/backlog/milestones.md` can be represented as a Linear project.
- Tasks link to projects via `**Milestone:** Mx` in `tasks.local.md`.

## Comment templates (recommended)

### Task started

- “Started `<task-id>` via SDD. Branch: `<branch>`. Plan: `<1–3 bullets>`.”

### Task validated

- “Validated `<task-id>` via SDD: `<pass/fail>`. Evidence: `<lint/tests/build>`. PR: `<url>` (if any).”

### Error / fallback

- “Linear operation `<op>` failed: `<error>`. Continuing in local mode.”

## Related docs

- `work/linear/SETUP.md`
- `work/linear/sync-config.md`
- `work/linear/FALLBACK-STRATEGY.md`

