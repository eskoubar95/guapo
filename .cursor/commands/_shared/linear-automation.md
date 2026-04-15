---
helper_id: linear-automation
load_when:
  - linear_mode_enabled
sections:
  detection_logic:
    title: "Detection Logic"
    lines: [1, 120]
  documents:
    title: "Documents"
    lines: [121, 220]
  issues:
    title: "Issues"
    lines: [221, 420]
always_load: false
---

# Detection Logic

Linear sync is **opt-in**.

Enable Linear sync only when:
- `work/linear/sync-config.md` exists, AND
- it contains `MODE=linear`

If Linear MCP is unavailable:
- Continue in local mode
- Never block SDD execution due to Linear errors

---

# Documents

This project currently treats Linear documents as optional.

If you want to use documents:
- Set `AUTO_CREATE_DOCUMENTS=true` in `work/linear/sync-config.md`
- Then commands may create/update a Linear document with the task spec contents

---

# Issues

## Start (Task start)

When starting a Linear issue:
- Update status to `STATUS_IN_PROGRESS`
- Add a short comment:
  - `SDD: Started <ISSUE_ID>. Branch: <branch>. Plan: <1–3 bullets>.`

## Validate (Task validate)

When validating:
- If pass → set to `STATUS_DONE`
- If needs fixes → keep `STATUS_IN_PROGRESS`
- If blocked/spec refinement → set to `STATUS_BLOCKED`
- Add comment:
  - `SDD: Validated <ISSUE_ID>. Result: <pass/fail>. Evidence: <...>. PR: <url>.`

## Cloud Agent Pilot (Cursor Cloud Agents)

We use a dedicated Linear label to mark tasks safe to delegate:
- Label: `agent-ok` (configurable via `CLOUD_AGENT_LABEL` in `work/linear/sync-config.md`)

Delegation rules:
- Only delegate **small, isolated** tasks
- Require explicit:
  - Scope
  - Out of scope
  - Acceptance
- The agent must open a **draft PR to `staging`**
- Do not allow “process invention” or broad refactors

Recommended delegation comment template (post on the issue):

```
@cursor
SDD Cloud Agent: Please implement ONLY what is in Scope below.

Constraints:
- No new processes or ceremonies.
- If missing info: ask max 2 questions then pause.
- Draft PR targeting `staging` only.
- Keep changes minimal and scoped to the listed files/workspace.

Scope:
- <fill>

Out of scope:
- <fill>

Acceptance:
- [ ] <fill>
```

