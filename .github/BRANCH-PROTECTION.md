# Branch Protection Setup Guide

This guide explains how to set up branch protection rules for `staging` and `main` branches to enforce the SDD workflow.

## Required Setup (GitHub UI - Rulesets)

**Navigation:** Settings → Rules → Rulesets → Create ruleset

### Step 1: Create Ruleset for `staging` branch

1. **Ruleset Name:** `staging-protection` (or any descriptive name)
2. **Enforcement status:** Set to **"Active"** (not "Disabled")
3. **Target branches:**
   - Click "Add target"
   - Select "Branch name pattern"
   - Enter: `staging`
4. **Rules → Branch rules:**
   - ✅ **Restrict updates:** "Only allow users with bypass permission to update matching refs" (prevents direct pushes)
   - ✅ **Restrict deletions:** "Only allow users with bypass permissions to delete matching refs"
   - ✅ **Require a pull request before merging:**
     - Required number of approvals: **1**
     - Dismiss stale pull request approvals when new commits are pushed: ✅
   - ✅ **Require status checks to pass:**
     - Required status checks:
       - `CI / SDD Sanity Checks`
       - `PR Policy / Enforce Branch Policy`
     - Require branches to be up to date before merging: ✅
   - ✅ **Require conversation resolution before merging:** ✅
5. **Bypass list:** (optional) Add specific users/teams that can bypass (leave empty for strict enforcement)
6. Click **"Create"**

### Step 2: Create Ruleset for `main` branch (production)

1. **Ruleset Name:** `main-protection` (or any descriptive name)
2. **Enforcement status:** Set to **"Active"**
3. **Target branches:**
   - Click "Add target"
   - Select "Branch name pattern"
   - Enter: `main`
4. **Rules → Branch rules:**
   - ✅ **Restrict updates:** "Only allow users with bypass permission to update matching refs" (prevents direct pushes)
   - ✅ **Restrict deletions:** "Only allow users with bypass permissions to delete matching refs"
   - ✅ **Require a pull request before merging:**
     - Required number of approvals: **1** (or more, per team preference)
     - Dismiss stale pull request approvals when new commits are pushed: ✅
   - ✅ **Require status checks to pass:**
     - Required status checks:
       - `CI / SDD Sanity Checks`
       - `PR Policy / Enforce Branch Policy`
     - Require branches to be up to date before merging: ✅
   - ✅ **Require conversation resolution before merging:** ✅
   - ✅ **Block force pushes:** "Prevent users with push access from force pushing to refs"
5. **Bypass list:** (recommended) Leave empty or restrict to admins only
6. Click **"Create"**

**Note:** If you see the old "Branch protection rules" UI instead of Rulesets, use the alternative method below.

## Alternative Method: Legacy Branch Protection Rules (if Rulesets not available)

If your repository uses the older "Branch protection rules" interface:

**Settings → Branches → Add rule → Branch name pattern**

### For `staging` branch:
- ✅ Require a pull request before merging (1 approval)
- ✅ Require status checks to pass (`CI / SDD Sanity Checks`, `PR Policy / Enforce Branch Policy`)
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

### For `main` branch:
- ✅ Require a pull request before merging (1 approval)
- ✅ Require status checks to pass (`CI / SDD Sanity Checks`, `PR Policy / Enforce Branch Policy`)
- ✅ Require conversation resolution before merging
- ✅ Block force pushes
- ✅ Do not allow bypassing the above settings
- ❌ Include administrators (recommended: admins must also follow rules)

## Alternative: Using GitHub CLI

If you prefer using `gh` CLI:

```bash
# Protect staging branch
gh api repos/:owner/:repo/branches/staging/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / SDD Sanity Checks","PR Policy / Enforce Branch Policy"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / SDD Sanity Checks","PR Policy / Enforce Branch Policy"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

**Note:** Replace `:owner/:repo` with your GitHub username/repo (e.g., `eskoubar95/guapo`).

## Verification

After setting up branch protection:

1. Try to push directly to `main` → should be blocked
2. Try to push directly to `staging` → should be blocked (if restrictions enabled)
3. Create a PR from feature branch to `main` → PR Policy check should fail
4. Create a PR from `staging` to `main` → PR Policy check should pass
5. Create a PR from feature branch to `staging` → PR Policy check should pass

## Troubleshooting

**If status checks don't appear:**
- Ensure GitHub Actions workflows are enabled (Settings → Actions → General)
- Run a test PR to trigger workflows
- Check that workflow files are in `.github/workflows/` and committed

**If branch protection doesn't work:**
- Verify you have admin access to the repository
- Check that branch names match exactly (`staging`, `main`)
- Ensure "Include administrators" is unchecked if you want admins to follow rules
