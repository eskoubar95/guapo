# Milestone Ready Checklist

This checklist should be used **before starting any milestone tasks** to ensure the SDD workflow is properly configured and understood. Use this for M2, M3, M4, M5, or any future milestones.

## Pre-Flight Checks

### 1. Git Configuration
- [ ] `.sdd/git-config.json` exists and is valid JSON
- [ ] `default_branch` = `staging` (development branch)
- [ ] `production_branch` = `main` (production branch)
- [ ] Verify: `cat .sdd/git-config.json`

### 2. Branch Status
- [ ] `staging` branch exists locally: `git branch | grep staging`
- [ ] `staging` is up-to-date with remote:
  ```bash
  git checkout staging
  git pull origin staging
  ```
- [ ] Working tree is clean: `git status` (no uncommitted changes)

### 3. Task Configuration
- [ ] Tasks in `work/backlog/tasks.local.md` have correct `**Workspace:**` field (e.g., `apps/cms`, `apps/commerce`, `apps/storefront`)
- [ ] Task dependencies are clear
- [ ] Acceptance criteria are defined for each task

### 4. SDD Commands Understanding
- [ ] `/task/start` will:
  - Resolve base branch from `.sdd/git-config.json` (should be `staging`)
  - Create branch: `task/<task-id>-<description>`
  - Initialize state tracking
- [ ] `/task/validate` will:
  - Run validation checks
  - Auto-create PR targeting `staging` (if validated)
  - PR base will be `staging` (not `main`)
- [ ] `/task/promote` will:
  - Create promotion PR: `staging` → `main`
  - **Use only when ready to release** (can include multiple milestones/features)

### 4.1 Cloud Agent Pilot (Cursor Cloud Agents via Linear)
- [ ] Linear label **`agent-ok`** exists (Guapo team label)
- [ ] Only mark tasks `agent-ok` when they are **small + isolated** (docs, narrow refactor, small script, workflow tweak)
- [ ] Each `agent-ok` issue must include:
  - **Scope** (1–3 bullets)
  - **Out of scope** (1–3 bullets)
  - **Acceptance** (checklist)
  - **Workspace** (monorepo scope)
- [ ] Delegation rule: agent must open a **draft PR to `staging`** (never direct to `main`)
- [ ] Use skill: `/sdd-linear-delegate-cloud-agent` for consistent prompt + labeling
  - Delegation comment should include `@cursor` so the Linear integration triggers the Cloud Agent

### 5. GitHub Workflow Understanding
- [ ] Feature PRs → base = `staging` (development)
- [ ] Release PRs → base = `main`, head = `staging` (production)
- [ ] Direct feature → `main` PRs are **blocked by PR Policy workflow**
- [ ] **Release strategy**: You can accumulate multiple milestones/features in `staging` before promoting to `main`
- [ ] Required checks:
  - `SDD Sanity Checks` (must pass)
  - `Enforce Branch Policy` (must pass)

### 6. Branch Protection (if not yet set up)
- [ ] Review `.github/BRANCH-PROTECTION.md` for setup instructions
- [ ] Set up branch protection for `staging` and `main` (if not already done)
- [ ] Verify protection rules are active

### 7. Batch Parallelization Understanding (if using `/task/batch`)
- [ ] Understand that `/task/batch` can run tasks in parallel (max 2) when safe
- [ ] Know that parallel execution requires:
  - Tasks in **different workspaces** (e.g., `apps/cms` vs `apps/commerce`)
  - Tasks **not touching global lock paths** (spec/**, README.md, .github/**, .sdd/**, .cursor/**, lockfiles)
- [ ] Understand that tasks touching shared paths or same workspace run **sequentially**
- [ ] Know that merge/promotion to `staging` → `main` is **always sequential** (even if tasks ran in parallel)

## Quick Start Commands

### Starting a Task
```bash
# 1. Ensure staging is up-to-date
git checkout staging
git pull origin staging

# 2. Start task (in Cursor)
/task/start <task-id>
# Command will:
# - Resolve base=staging from git-config.json
# - Create branch: task/<task-id>-<description>
# - Checkout new branch
```

### Delegating a Small Linear Task to Cloud Agent (pilot)
```bash
# For small, isolated Linear tasks only (label: agent-ok)
/task/delegate <LINEAR-ISSUE-ID>
# Command will:
# - Apply label agent-ok (if eligible)
# - Post a strict @cursor delegation comment
# - Set status to In Progress
```

### After Task Completion
```bash
# 1. Validate task (in Cursor)
/task/validate
# Command will:
# - Run validation checks
# - Create PR targeting staging (if validated)
# - PR URL will be provided
```

### Running Batch Execution (Multiple Tasks)
```bash
# 1. Run batch for milestone (in Cursor)
/task/batch <milestone-id>
# Command will:
# - Run scheduler to analyze tasks and build execution plan
# - Show which tasks can run in parallel (max 2) and why
# - Execute tasks using worktrees for parallel isolation
# - Sequentially merge completed tasks to staging
# - Create PRs for each task targeting staging
```

### When Ready to Release (After Multiple Milestones/Features)
```bash
# 1. Promote to production (in Cursor)
# Use this when you've tested multiple milestones/features in staging
# and are ready to release them all to production
/task/promote
# Command will:
# - Verify staging is ready
# - Show all commits since last production release
# - Create promotion PR: staging → main
# - PR URL will be provided
```

## Release Strategy

**Important:** You can (and should) accumulate multiple milestones/features in `staging` before promoting to `main`:

1. **Feature Development**: All feature PRs merge to `staging`
2. **Staging Testing**: Test multiple features/milestones together in staging
3. **Release Decision**: When ready, use `/task/promote` to create a single promotion PR containing all changes since last production release
4. **Production Release**: Merge promotion PR to `main` when approved

This allows you to:
- Test feature interactions in staging
- Batch releases for better coordination
- Avoid frequent production deployments
- Have a clear "what changed since last release" view

## Troubleshooting

**If `/task/start` uses wrong base branch:**
- Check `.sdd/git-config.json` exists and has `default_branch` set
- Verify branch-detection helper is reading config correctly

**If PR Policy check fails:**
- Ensure PR base is `staging` (not `main`)
- For production releases, use `/task/promote` instead

**If branch protection blocks you:**
- Verify you have required approvals
- Ensure CI checks are passing
- Check `.github/BRANCH-PROTECTION.md` for setup

## Reference

- Branch strategy: `spec/08-infrastructure.md` (CI/CD section)
- GitHub workflow: `README.md` (GitHub workflow section)
- Branch protection setup: `.github/BRANCH-PROTECTION.md`
- Git config: `.sdd/git-config.json`
