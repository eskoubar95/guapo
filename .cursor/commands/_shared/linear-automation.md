---
helper_id: linear-automation
load_when:
  - linear_mode_enabled
  - spec_init
  - spec_refine
  - spec_plan
  - task_start
  - task_validate
dependencies:
  - linear-helpers
sections:
  detection:
    title: "Detection Logic"
    lines: [9, 32]
  documents:
    title: "Documents"
    lines: [35, 80]
  issues:
    title: "Issues"
    lines: [82, 130]
  projects:
    title: "Projects"
    lines: [132, 180]
  labels:
    title: "Labels"
    lines: [182, 220]
  statuses:
    title: "Statuses"
    lines: [222, 260]
always_load: false
---

# Linear MCP Automation Rules

This document defines when and how to automatically use Linear MCP functions within the SDD workflow.

## Purpose

Automate Linear operations based on SDD workflow events, ensuring seamless integration between spec-driven development and Linear project management, while remaining optional and lightweight.

## Detection Logic

**Before using Linear MCP, always check:**

1. **Check if Linear mode is enabled:**
   - Check if `work/linear/sync-config.md` exists
   - Verify `MODE=linear` in sync-config
   - If not found or not set to linear → use local mode only

2. **Determine which MCP connection to use:**
   - Read `MCP_CONNECTION_NAME` from sync-config.md
   - If specified → use that specific MCP connection (e.g., "linear", "linear-huddle")
   - If not specified → use default Linear MCP connection
   - **Note:** Each workspace can have its own Linear workspace, so the connection name should match this project's Linear workspace

3. **Verify Linear MCP availability:**
   - Test Linear MCP connection using the specified connection name (try a simple operation like `list_teams`)
   - If MCP is unavailable → fallback to local mode automatically
   - Report fallback to user but continue workflow normally

4. **Check configuration completeness:**
   - Required keys (when `MODE=linear`):
     - `STATUS_BACKLOG`, `STATUS_IN_PROGRESS`, `STATUS_DONE`, `STATUS_BLOCKED`
   - **Hard stop policy (planning):** during `/spec/plan`, if any required key is missing → **BLOCK Linear sync** until the user fixes `work/linear/sync-config.md`.
   - **Execution policy (tasks):** during `/task/*`, if config is incomplete → **skip Linear operations** for this run and continue in local mode (do not block code execution).
   - Reference:
     - `work/linear/SETUP.md` (setup)
     - `work/linear/LABEL-MAPPING-GUIDE.md` (tags → labels + comment templates)
     - `work/linear/FALLBACK-STRATEGY.md` (availability/operation failure fallback)

## Linear MCP Functions and Automation Rules

### 1. Documents (`create_document`, `update_document`, `get_document`, `list_documents`)

**When to create/update Linear Documents:**

**A) During `/spec/init`:**
- **Create document:** If PRD is created (`spec/01-prd.md`) → create Linear document with PRD content
- **Document title:** `[Project Name] - PRD`
- **Document content:** Full PRD content from `spec/01-prd.md`
- **Link:** Add document link to Linear project (if project exists)
- **Only if:** `AUTO_CREATE_DOCUMENTS=true` in sync-config

**B) During `/spec/refine`:**
- **Update document:** If PRD document exists → update with refined PRD content
- **Create document:** If architecture is documented (`spec/02-architecture.md`) → create Linear document
  - **Document title:** `[Project Name] - Architecture`
  - **Document content:** Full architecture content from `spec/02-architecture.md`

**C) During `/spec/plan`:**
- **Create document:** If acceptance criteria are created (`spec/06-acceptance.md`) → create Linear document
  - **Document title:** `[Project Name] - Acceptance Criteria`
  - **Document content:** Full acceptance criteria from `spec/06-acceptance.md`

**D) During `/task/start` (complex tasks):**
- **Create document:** If task-level spec is created (`spec/tasks/[task-id]/spec.md`) → create Linear document
  - **Document title:** `[Task ID] - [Task Name] - Specification`
  - **Document content:** Task-level spec content
  - **Link:** Link document to Linear issue (if issue exists)

**E) During `/task/validate`:**
- **Update document:** If task-level spec was updated during implementation → update Linear document

**Automation Logic:**
```markdown
IF Linear mode enabled AND AUTO_CREATE_DOCUMENTS=true AND spec file created/updated:
  - Check if Linear document exists (search by title using list_documents)
  - IF exists → update_document
  - IF not exists → create_document
  - Link document to Linear project/issue if applicable
  - IF operation fails → log error, continue with local mode
```

### 2. Issues (`create_issue`, `update_issue`, `get_issue`, `list_issues`)

**When to create/update Linear Issues:**

**A) During `/spec/plan`:**
- **Create issues:** For each task in `work/backlog/tasks.local.md` → create Linear issue
  - **Issue title:** `[task-id] – [task description]` (include the task ID for stable idempotency)
  - **Issue description:** Full task details (description, acceptance, dependencies, estimate)
  - **Issue status:** Map to "Backlog" (or custom status from config)
  - **Issue priority:** Map from task estimate (S=Low, M=Medium, L=High)
  - **Issue labels:** Prefer task tags → labels (see `work/linear/LABEL-MAPPING-GUIDE.md`)
  - **Issue project:** Link to Linear project (if milestone project exists)
  - **Issue team:** Assign to default team (if configured)
  - **Ask before creating:** Always ask user: "Skal jeg oprette Linear issues for tasks?"

**B) During `/task/start`:**
- **Get issue:** Fetch Linear issue details (if Linear task ID provided)
- **Update issue:** Set status to "In Progress" (or custom status from config)
- **Update issue:** Add comment (recommended format):
  - “Started `<task-id>` via SDD. Branch: `<branch>`. Plan: `<1–3 bullets>`.”
- **If issue not found:** Error: "Linear issue [ID] ikke fundet"

**C) During `/task/validate`:**
- **Update issue:** Set status based on validation result:
  - **Approved:** "Done" (or custom status from config)
  - **Requires fixes:** "In Progress" (or custom status from config)
  - **Requires spec refinement:** "Blocked" (or custom status from config)
- **Update issue:** Add comment with validation summary (recommended format):
  - “Validated `<task-id>` via SDD: `<pass/fail>`. Evidence: `<lint/tests/build>`. PR: `<url>` (if any).”

**D) During `/spec/refine` or `/spec/evolve`:**
- **Update issues:** If spec changes affect tasks → update related Linear issues
  - Add comment: "Spec updated: [summary of changes]"
  - Update issue description if task scope changed

**Automation Logic:**
```markdown
IF Linear mode enabled AND task created/updated:
  - Check if Linear issue exists (search by title or task ID in issue description)
  - IF exists → update_issue
  - IF not exists → create_issue (after user confirmation)
  - Auto-assign status, labels, project, team based on rules
  - IF operation fails → log error, continue with local mode
```

### 3. Projects (`create_project`, `update_project`, `get_project`, `list_projects`)

**When to create/update Linear Projects:**

**A) During `/spec/plan`:**
- **Create projects:** For each milestone in `work/backlog/milestones.md` → create Linear project
  - **Project name:** Milestone objective (first line)
  - **Project description:** Full milestone details (objective, scope, exit criteria)
  - **Project status:** Set to "Active" (or default status)
  - **Project team:** Assign to default team (if configured)
  - **Link issues:** Link all milestone tasks (issues) to project
  - **Only if:** `AUTO_CREATE_PROJECTS=true` in sync-config
  - **Ask before creating:** Always ask user: "Skal jeg oprette Linear projects for milestones?"

**B) During `/spec/evolve`:**
- **Update projects:** If milestone changes → update Linear project
  - Update project description
  - Update linked issues if task scope changed

**C) During `/task/start` or `/task/validate`:**
- **Get project:** Fetch Linear project for context (if issue is linked to project)

**Automation Logic:**
```markdown
IF Linear mode enabled AND AUTO_CREATE_PROJECTS=true AND milestone created/updated:
  - Check if Linear project exists (search by name)
  - IF exists → update_project
  - IF not exists → create_project (after user confirmation)
  - Link all milestone tasks (issues) to project
  - IF operation fails → log error, continue with local mode
```

### 4. Teams (`get_team`, `list_teams`)

**When to use Teams:**

**A) During `/spec/plan`:**
- **Get team:** Fetch default team (if configured in sync-config)
- **Assign team:** Auto-assign Linear projects and issues to default team

**B) During `/task/start`:**
- **Get team:** Fetch team for context (if issue is assigned to team)

**Configuration:**
- Store default team ID in `work/linear/sync-config.md`:
  ```markdown
  DEFAULT_TEAM_ID=[team-id]
  ```

**Automation Logic:**
```markdown
IF Linear mode enabled AND project/issue created:
  - IF DEFAULT_TEAM_ID configured → assign to team
  - IF not configured → skip team assignment (no error)
```

### 5. Labels (`create_issue_label`, `list_issue_labels`)

**When to create/assign Labels:**

**A) During `/spec/plan`:**
- **Auto-assign labels:** For each task → assign labels based on task type:
  - **Design tasks:** `design`, `ui`, `frontend`
  - **Engineering tasks:** `engineering`, `backend`, `frontend`, `infrastructure`
  - **Business tasks:** `business`, `requirements`
  - **Infrastructure tasks:** `infrastructure`, `devops`, `deployment`
  - **External service tasks:** `external-service`, `integration`
  - **Risk mitigation tasks:** `risk`, `mitigation`

**B) During `/task/start`:**
- **Get labels:** Fetch issue labels for context
- **Auto-assign labels:** If task type detected → ensure labels are assigned

**C) During `/spec/refine`:**
- **Create labels:** If new task types emerge → create new labels (if they don't exist)

**Label Naming Convention:**
- Use lowercase, hyphenated names: `design`, `ui`, `frontend`, `backend`, `infrastructure`
- Use consistent prefixes: `type-*` for task types, `priority-*` for priorities

**Automation Logic:**
```markdown
IF Linear mode enabled AND AUTO_ASSIGN_LABELS=true AND issue created/updated:
  - Detect task type from description/title
  - Map task type to label names
  - Check if labels exist (list_issue_labels)
  - IF label doesn't exist → create_issue_label (try to create, if fails guide user)
  - Assign labels to issue
  - IF operation fails → log error, continue without labels
```

### 6. Statuses (`get_issue_status`, `list_issue_statuses`)

**When to update Status:**

**A) During `/spec/plan`:**
- **Set status:** New issues → "Backlog" (or custom status from config)

**B) During `/task/start`:**
- **Set status:** Issue → "In Progress" (or custom status from config)
- **Get status:** Fetch current status for context

**C) During `/task/validate`:**
- **Set status:** Based on validation result:
  - **Approved:** "Done" (or custom status from config)
  - **Requires fixes:** "In Progress" (or custom status from config)
  - **Requires spec refinement:** "Blocked" (or custom status from config)

**D) During `/spec/refine` or `/spec/evolve`:**
- **Set status:** If spec changes block tasks → set related issues to "Blocked"

**Status Mapping:**
- Map SDD workflow states to Linear statuses:
  - **Planned:** "Backlog" (or `STATUS_BACKLOG` from config)
  - **In Progress:** "In Progress" (or `STATUS_IN_PROGRESS` from config)
  - **Validated/Approved:** "Done" (or `STATUS_DONE` from config)
  - **Blocked:** "Blocked" (or `STATUS_BLOCKED` from config)

**Custom Status Support:**
- Status mapping supports both status IDs and status names
- If status name is provided in config → try to find by name
- If status ID is provided in config → use directly
- If status not found → guide user: "Status '[name]' ikke fundet i Linear. Opret den i Linear Settings → Statuses, eller opdater sync-config.md med status ID"

**Automation Logic:**
```markdown
IF Linear mode enabled AND task state changes:
  - Map SDD state to Linear status (from config or default)
  - Get available statuses (list_issue_statuses)
  - Find matching status (by name or ID)
  - Update issue status
  - IF status not found → guide user to create custom status
```

### 7. Comments (`create_comment`, `list_comments`)

**When to create Comments:**

**A) During `/task/start`:**
- **Create comment:** "Task started via SDD workflow at [timestamp]"
- **Create comment:** If task-level spec exists → add comment with spec summary

**B) During `/task/validate`:**
- **Create comment:** Validation summary:
  - "Task validated: [result]"
  - "Acceptance criteria: [summary]"
  - "Issues found: [list]" (if any)
  - "Next steps: [list]" (if any)

**C) During `/spec/refine` or `/spec/evolve`:**
- **Create comment:** On affected issues: "Spec updated: [summary of changes]"

**D) During implementation (if errors occur):**
- **Create comment:** "Error encountered: [error description]"
- **Create comment:** "Fix applied: [fix description]"

**Automation Logic:**
```markdown
IF Linear mode enabled AND workflow event occurs:
  - Create comment on related Linear issue
  - Include relevant context (spec changes, validation results, etc.)
  - IF operation fails → log error, continue without comment
```

### 8. Cycles (`list_cycles`, `get_cycle`)

**When to use Cycles:**

**A) During `/spec/plan`:**
- **Get active cycle:** Fetch current active cycle (if cycles are used)
- **Assign to cycle:** Link milestone projects to active cycle (if applicable)

**B) During `/task/start`:**
- **Get cycle:** Fetch cycle for context (if issue is in cycle)

**Configuration:**
- Store cycle preference in `work/linear/sync-config.md`:
  ```markdown
  USE_CYCLES=true
  ACTIVE_CYCLE_ID=[cycle-id] (optional, auto-detect if not set)
  ```

**Automation Logic:**
```markdown
IF Linear mode enabled AND USE_CYCLES=true:
  - Get active cycle (list_cycles, filter by active)
  - IF cycle exists → link projects/issues to cycle
  - IF ACTIVE_CYCLE_ID set → use that cycle
  - IF not set → auto-detect active cycle
```

## Custom Setup Guidance

**Når systemet skal guide brugeren til custom setup:**

1. **Første gang Linear mode aktiveres:**
   - Guide til at oprette `work/linear/sync-config.md`
   - Guide til at oprette custom status/labels i Linear (hvis nødvendigt)
   - Reference til `work/linear/SETUP.md`

2. **Hvis custom status mangler:**
   - Systemet prøver at finde status ved name (hvis status name er i config)
   - Hvis ikke fundet → guide: "Status '[name]' ikke fundet i Linear. Opret den i Linear Settings → Statuses, eller opdater sync-config.md med status ID"

3. **Hvis custom labels mangler:**
   - Systemet prøver at oprette label automatisk
   - Hvis fejler → guide: "Label '[name]' kunne ikke oprettes. Opret den manuelt i Linear Settings → Labels"

## Error Handling

**Hvis Linear MCP operation fejler:**
1. Log error tydeligt (inkluder operation type og error message)
2. Fortsæt med local mode (blokér ikke workflow)
3. Rapporter error til bruger
4. Tillad manuel retry eller skip Linear operation

**Hvis Linear MCP er utilgængelig:**
1. Detekter unavailability (connection test fejler)
2. Fallback til local mode automatisk
3. Rapporter fallback til bruger: "Linear MCP er utilgængelig. Fortsætter med local mode."
4. Fortsæt workflow normalt

**Idempotency:**
- Always check if Linear resource exists before creating
- Use `list_*` functions to check for existing resources
- If resource exists → update instead of create
- Prevent duplicate resources

## Best Practices

1. **Always ask before creating:** Ask user before creating Linear projects/issues/documents (except for status updates and comments)
2. **Batch operations:** Group related Linear operations when possible
3. **Idempotency:** Check if Linear resource exists before creating (prevent duplicates)
4. **Error recovery:** Always fall back to local mode if Linear fails
5. **Respect Linear workflow:** Don't override Linear-specific workflows (status transitions, etc.)
6. **Custom status support:** Support both status IDs and status names for flexibility

