---
name: sdd-linear-delegate-cloud-agent
description: Delegate a small, isolated Linear task to Cursor Cloud Agent using the `agent-ok` label + a strict scope prompt. Creates a comment that can trigger the agent in Linear and updates issue status.
metadata:
  sdd_category: linear
---

# SDD: Delegate Linear issue to Cursor Cloud Agent (pilot)

## When to use

- For **small, isolated** tasks only (docs, small scripts, narrow refactors, workflow tweaks).
- When the Linear issue is explicit and safe to delegate.

## Preconditions (HARD STOP if missing)

The Linear issue description MUST include:
- **Scope** (1–3 bullets)
- **Out of scope** (1–3 bullets)
- **Acceptance** (checklist)
- **Workspace** (if monorepo; e.g. `apps/cms`, `apps/commerce`, `apps/storefront`, or `.`)

Also required:
- `work/linear/sync-config.md` exists and `MODE=linear`
- Linear label `agent-ok` exists (or `CLOUD_AGENT_LABEL` in config)

## Steps (use Linear MCP)

1. **Fetch issue**
   - `get_issue(issueId)`
   - Confirm it belongs to the expected team (`TEAM_NAME` in config)

2. **Verify “agent-ok” eligibility**
   - Confirm it’s small and isolated
   - Confirm Scope/Out-of-scope/Acceptance present
   - Confirm it does NOT require architecture decisions

3. **Apply label**
   - Add label: `CLOUD_AGENT_LABEL` (default: `agent-ok`)
   - Do not duplicate label if already present

4. **Set status to In Progress**
   - Resolve `STATUS_IN_PROGRESS` from config and update issue status

5. **Post delegation comment (strict prompt)**
   - Create a comment that triggers the Cursor agent (via Linear integration).
   - Use this template:

```text
@cursor
SDD Cloud Agent: Please implement ONLY what is in Scope below.

Constraints:
- No new processes or ceremonies.
- If missing info: ask max 2 questions then pause.
- Draft PR targeting `staging` only.
- Keep changes minimal and scoped to the listed files/workspace.

Scope:
- <copy from issue>

Out of scope:
- <copy from issue>

Acceptance:
- [ ] <copy from issue>
```

6. **Optional: Add a tracking comment**
   - `SDD: Delegated to Cursor Cloud Agent. Expect a draft PR to staging.`

## Output contract

Return:
- `issueId`
- `labelApplied`: true/false
- `statusSetTo`: name
- `commentId`

## Rules

- Never delegate tasks that touch global/shared paths (`spec/**`, `.github/**`, `.sdd/**`, `.cursor/**`, lockfiles) unless the issue is explicitly scoped and approved.
- Never allow feature PRs directly to `main`.
- Keep the agent in “implementation only” mode (no process invention).

