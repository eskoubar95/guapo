# Linear Setup Guide

This guide walks you through setting up Linear integration with the SDD workflow.

## Prerequisites

- A Linear workspace + team
- Linear MCP configured in Cursor
- Access to Linear Settings

## Hard stop (recommended)

If you enable Linear mode (`MODE=linear`), `/spec/plan` treats missing required status mappings as a **hard stop** for Linear sync:

- Required keys in `work/linear/sync-config.md`:
  - `STATUS_BACKLOG`
  - `STATUS_IN_PROGRESS`
  - `STATUS_DONE`
  - `STATUS_BLOCKED`

## Step 1: Create/choose a Linear team

1. Create a team (if needed)
2. Note the team ID for `work/linear/sync-config.md` (optional)

## Step 2: Ensure statuses exist

1. Go to Linear Settings → Statuses
2. Ensure you have statuses that match your desired mapping (defaults: Backlog, In Progress, Done, Blocked)
3. Use status **names** in `sync-config.md` (recommended), or IDs if you need fixed UUIDs

### Current project MCP connection name (Guapo)

In this repo/workspace, the Linear MCP connection name is:

- `MCP_CONNECTION_NAME=guapo-linear`

This should match your Cursor MCP server name for Linear.

## Step 3: Ensure labels exist (optional)

Labels can be created automatically when missing, but you can also create them manually in Linear Settings → Labels.

## Step 4: Configure sync config

1. Create/update `work/linear/sync-config.md`
2. Set `MODE=linear`
3. Optionally set:
   - `MCP_CONNECTION_NAME` (if you have multiple Linear MCP connections)
   - `DEFAULT_TEAM_ID`
   - `USE_CYCLES=true` and optionally `ACTIVE_CYCLE_ID` (if you use Cycles as sprints)
4. Set status mapping keys:
   - `STATUS_BACKLOG`, `STATUS_IN_PROGRESS`, `STATUS_DONE`, `STATUS_BLOCKED`
5. Enable optional automation:
   - `AUTO_ASSIGN_LABELS=true`
   - `AUTO_CREATE_PROJECTS=true`
   - `AUTO_CREATE_DOCUMENTS=true`

### Sprint / cycle strategy (Guapo)

- We use Linear **Cycles** as sprints.
- **Sprint 1 = Cycle #1** (Cycle numbering is the sprint numbering).
- `ACTIVE_CYCLE_ID` in `work/linear/sync-config.md` should point at the current sprint/cycle when you want automation to attach new issues to the active sprint.

## Step 5: Tag-driven label mapping (recommended)

Use `**Tags:**` in `work/backlog/tasks.local.md` to drive labels:
- See `work/linear/LABEL-MAPPING-GUIDE.md`

## Step 6: Test

- Run `/spec/plan` (creates projects/issues/docs if enabled)
- Run `/task/start` and `/task/validate` on a Linear issue ID to verify status + comments

## Troubleshooting

- Fallback behavior: `work/linear/FALLBACK-STRATEGY.md`

## What SDD can do automatically (once configured)

- **/spec/plan**: create milestone projects (optional), create/update task issues, create/update spec documents (optional)
- **/task/start**: update status + add a structured “Started …” comment
- **/task/validate**: update status + add a structured “Validated …” comment

## What the user must do manually

- Configure the Linear MCP connection in Cursor (and provide `MCP_CONNECTION_NAME` if multiple)
- Ensure your desired statuses exist in Linear (or adjust mappings)
- Decide label taxonomy (recommended: `**Tags:**` in `work/backlog/tasks.local.md` → labels; see `LABEL-MAPPING-GUIDE.md`)

