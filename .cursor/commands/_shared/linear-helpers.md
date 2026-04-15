---
helper_id: linear-helpers
load_when:
  - linear_mode_enabled
sections:
  status_mapping:
    title: "Status Mapping"
    lines: [1, 120]
  idempotency:
    title: "Idempotency & Safety"
    lines: [121, 260]
always_load: false
---

# Status Mapping

SDD commands can sync status/comments to Linear **only when** `work/linear/sync-config.md` exists and `MODE=linear`.

## Required config keys (in `work/linear/sync-config.md`)

- `TEAM_NAME`
- `STATUS_TODO`
- `STATUS_IN_PROGRESS`
- `STATUS_BLOCKED`
- `STATUS_DONE`

## How to resolve statuses safely

1. Fetch team by `TEAM_NAME`
2. List issue statuses for that team
3. Match by **name** (exact match). If not found:
   - Stop and instruct the user to create/rename the status in Linear to match config

## Recommended mapping (Guapo)

- Start work: set to `STATUS_IN_PROGRESS`
- Blocked: set to `STATUS_BLOCKED`
- Done: set to `STATUS_DONE`

---

# Idempotency & Safety

## Comment idempotency

When adding comments to Linear from commands/skills:
- Prefer a stable prefix like: `SDD:` or `SDD Cloud Agent:`
- If re-running, add a new comment rather than editing old ones (clear audit trail)

## Label idempotency

When applying labels:
- List existing labels on the issue
- Only add if missing (avoid duplicates)

## Cloud Agent pilot safety

If delegating to Cursor Cloud Agent:
- Use label from `CLOUD_AGENT_LABEL` (default: `agent-ok`)
- Require the issue body to include:
  - **Scope** (1–3 bullets)
  - **Out of scope** (1–3 bullets)
  - **Acceptance** (checklist)
- If any are missing → **do not delegate**. Ask the user to tighten the issue first.

