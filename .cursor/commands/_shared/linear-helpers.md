---
helper_id: linear-helpers
load_when:
  - linear_mode_enabled
  - linear_operation_needed
sections:
  status_mapping:
    title: "Status Mapping"
    lines: [1, 50]
  label_detection:
    title: "Label Detection"
    lines: [51, 100]
  idempotency:
    title: "Idempotency Checks"
    lines: [101, 150]
always_load: false
---

# Linear Helper Functions

This document contains helper logic for Linear operations, including status mapping, label detection, idempotency checks, and error handling.

## Status Mapping

**Purpose:** Map SDD workflow states to Linear statuses with support for custom statuser.

**Logic:**
1. Read status mapping from `work/linear/sync-config.md`
2. If status name provided → try to find by name using `list_issue_statuses`
3. If status ID provided → use directly
4. If status not found → guide user to create custom status

**Function:**
```markdown
**Map SDD State to Linear Status:**

1. Read sync-config.md
2. Get status mapping for SDD state:
   - Planned → STATUS_BACKLOG
   - In Progress → STATUS_IN_PROGRESS
   - Validated/Approved → STATUS_DONE
   - Blocked → STATUS_BLOCKED

3. If status mapping is name (not UUID):
   - Call list_issue_statuses to get all statuses
   - Find status by name (case-insensitive)
   - If found → use status ID
   - If not found → guide user: "Status '[name]' ikke fundet i Linear. Opret den i Linear Settings → Statuses, eller opdater sync-config.md med status ID"

4. If status mapping is UUID:
   - Use directly

5. Return status ID for Linear operations
```

**Usage in commands:**
- `/spec/plan`: Map "Planned" → STATUS_BACKLOG
- `/task/start`: Map "In Progress" → STATUS_IN_PROGRESS
- `/task/validate`: Map validation result → STATUS_DONE/STATUS_IN_PROGRESS/STATUS_BLOCKED

## Label Detection

**Purpose:** Determine Linear labels for a task (prefer task tags; fallback to heuristics).

**Logic:**
1. If the task exists in `work/backlog/tasks.local.md`, prefer `**Tags:**` as label names.
2. If no tags found (or task not found), fallback to keyword-based task type detection.
3. Check if labels exist; create if missing (when permitted).
4. Assign labels to issue.

**Task Type Detection:**
```markdown
**Detect Task Type:**

Keywords for task type detection:
- Design: "design", "ui", "ux", "visual", "styling", "component", "layout"
- Engineering: "implement", "code", "api", "endpoint", "function", "service", "module"
- Business: "requirement", "business", "user story", "feature", "product"
- Infrastructure: "infrastructure", "deployment", "devops", "ci/cd", "hosting", "database", "server"
- External Service: "integration", "api", "service", "third-party", "external"
- Risk Mitigation: "risk", "mitigation", "security", "backup", "recovery"

Task type priority (if multiple matches):
1. Infrastructure
2. External Service
3. Risk Mitigation
4. Design
5. Engineering
6. Business
```

**Label Mapping:**
```markdown
**Map Task Tags / Type to Labels:**

Priority order:

1) **Task tags (preferred):**
- Read task block in `work/backlog/tasks.local.md` (by task ID).
- Parse `**Tags:**` (comma-separated).
- Use each tag as a label name (optionally prefix with `LABEL_PREFIX` from `work/linear/sync-config.md`).
- Do not invent type labels; only add `feature`, `bug`, `improvement` if explicitly present in tags.

2) **Fallback (heuristics):**
- If tags are unavailable, use task type detection and map:
  - Design → ["design", "ui", "frontend"]
  - Engineering → ["engineering", "backend" or "frontend"]
  - Business → ["business", "requirements"]
  - Infrastructure → ["infrastructure", "devops", "deployment"]
  - External service → ["external-service", "integration"]
  - Risk mitigation → ["risk", "mitigation"]
```

**Function:**
```markdown
**Auto-Assign Labels:**

1. Detect task type from description/title
2. Map task type to label names
3. For each label name:
   - Call list_issue_labels to check if label exists
   - IF exists → use label ID
   - IF not exists → try create_issue_label
     - IF succeeds → use new label ID
     - IF fails → guide user: "Label '[name]' kunne ikke oprettes. Opret den manuelt i Linear Settings → Labels"
4. Assign labels to issue
```

## Idempotency Check

**Purpose:** Check if Linear resource exists before creating to prevent duplicates.

**Logic:**
1. Search for existing resource by name/title
2. If found → update instead of create
3. If not found → create new

**Functions:**

**Check if Project Exists:**
```markdown
**Check Project Exists:**

1. Call list_projects
2. Search for project by name (exact match or case-insensitive)
3. IF found → return project ID
4. IF not found → return null
```

**Check if Issue Exists:**
```markdown
**Check Issue Exists:**

1. Call list_issues with query for title or description
2. Search for issue by title (exact match or case-insensitive)
3. IF found → return issue ID
4. IF not found → return null
```

**Check if Document Exists:**
```markdown
**Check Document Exists:**

1. Call list_documents
2. Search for document by title (exact match or case-insensitive)
3. IF found → return document ID
4. IF not found → return null
```

**Usage:**
- Before creating Linear project → check if exists, update if found
- Before creating Linear issue → check if exists, update if found
- Before creating Linear document → check if exists, update if found

## Error Handling

**Purpose:** Handle Linear MCP errors gracefully with fallback to local mode.

**Error Types:**

**1. Linear MCP Unavailable:**
```markdown
**Handle MCP Unavailability:**

1. Read MCP_CONNECTION_NAME from sync-config.md (if specified)
2. Test connection using specified connection name (try list_teams)
3. IF fails → detect unavailability
4. Report to user: "Linear MCP connection '[connection-name]' er utilgængelig. Fortsætter med local mode."
5. Continue workflow with local mode only
6. Do not block workflow
```

**2. Linear Operation Failed:**
```markdown
**Handle Operation Failure:**

1. Catch error from Linear MCP operation
2. Log error clearly (include operation type and error message)
3. Report to user: "Linear operation '[operation]' fejlede: [error]. Fortsætter med local mode."
4. Continue workflow with local mode
5. Allow user to retry or skip Linear operation
```

**3. Resource Not Found:**
```markdown
**Handle Resource Not Found:**

1. IF status not found → guide user to create custom status
2. IF label not found → try to create, if fails guide user
3. IF issue not found → error: "Linear issue [ID] ikke fundet"
4. IF project not found → error: "Linear project [name] ikke fundet"
```

**4. Configuration Error:**
```markdown
**Handle Configuration Error:**

1. IF sync-config.md missing → guide user to create it
2. IF MODE=linear but required status mapping keys are missing:
   - During `/spec/plan`: **HARD STOP** Linear sync until `work/linear/sync-config.md` is completed
   - During `/task/*`: skip Linear operations for this run and continue in local mode (do not block code execution)
3. IF team ID invalid → guide user to update sync-config.md
```

**Error Recovery:**
- Always fallback to local mode
- Never block workflow
- Always report errors to user
- Allow manual retry or skip

## Helper Function Usage

**In Commands:**

Commands should use these helpers via reference to this document:

```markdown
**Linear Operations:**

1. Check Linear mode (see linear-automation.md Detection Logic)
2. Use status mapping (see Status Mapping above)
3. Use label detection (see Label Detection above)
4. Use idempotency check (see Idempotency Check above)
5. Handle errors (see Error Handling above)
```

**Example Integration:**

```markdown
**During /spec/plan:**

1. Check if Linear mode enabled
2. For each milestone:
   - Check if project exists (idempotency check)
   - IF exists → update_project
   - IF not exists → create_project (after user confirmation)
3. For each task:
   - Detect task type (label detection)
   - Map to labels
   - Check if issue exists (idempotency check)
   - Map status (status mapping)
   - IF exists → update_issue
   - IF not exists → create_issue (after user confirmation)
4. Handle any errors (error handling)
```

