# Linear MCP Fallback Strategy

This document defines how the SDD workflow should behave when Linear integration is unavailable or a Linear operation fails.

## Goals

- **Never block the SDD workflow** if Linear is unavailable.
- **Log clearly** what failed (operation + error), and what fallback is used.
- **Keep local artifacts authoritative** (`work/backlog/*`) even when Linear sync is enabled.

## Detecting Linear mode

Linear mode is enabled when:
- `work/linear/sync-config.md` exists, and
- it contains `MODE=linear`

If Linear mode is not enabled, operate in local mode only.

## Connectivity verification

Before critical Linear operations:
- Read `MCP_CONNECTION_NAME` from `work/linear/sync-config.md` (optional).
- Run a simple “health” call (e.g. `list_teams`).

If the call fails or times out → treat Linear MCP as unavailable for this run.

## Fallback cases

### 1) MCP connection unavailable

**Behavior:**
- Continue with **local mode only**.
- Report: “Linear MCP is unavailable. Continuing in local mode.”
- Skip all Linear operations (projects/issues/documents/comments/status updates).

### 2) A specific Linear operation fails

**Behavior:**
- Log the failure clearly:
  - operation name (e.g. `create_issue`, `update_issue`, `create_project`)
  - the error message
- Continue the workflow in **local mode** for the rest of the run (do not retry endlessly).
- Allow a user-initiated retry later (next command run).

### 3) Resource not found (status/label/project/issue)

**Behavior:**
- **Status not found**: guide user to create the status in Linear (or update `sync-config.md` to use a status ID).
- **Label not found**: try to create the label automatically; if that fails, guide user to create it manually in Linear.
- **Project not found**: create it only if `AUTO_CREATE_PROJECTS=true` and user confirmed creation.
- **Issue not found**: guide user to verify the issue exists or re-run `/spec/plan` to re-sync tasks.

### 4) Partial failure (some operations succeed)

**Behavior:**
- Keep the successful operations.
- Log what failed.
- Do not rollback.

## Recovery strategy

When Linear becomes available again:
- Re-run `/spec/plan` to ensure milestones/projects and tasks/issues are in sync.
- Re-run `/task/start` or `/task/validate` to re-apply status/comments for the active task.

## Where to log

When in Linear mode:
- Add a brief **Linear comment** on the issue for:
  - task start
  - task validation result
  - errors (if any)

Always keep local artifacts updated:
- `work/backlog/tasks.local.md` remains the primary source of truth for tasks and status in local mode.

## Related docs

- `work/linear/SETUP.md`
- `work/linear/sync-config.md`
- `work/linear/LABEL-MAPPING-GUIDE.md`
- `.cursor/commands/_shared/linear-automation.md`
- `.cursor/commands/_shared/linear-helpers.md`

