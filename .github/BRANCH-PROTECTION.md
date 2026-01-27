# Branch Protection Setup Guide

This guide explains how to set up branch protection rules for `staging` and `main` branches to enforce the SDD workflow.

## Required Setup

### For `staging` branch (development)

**Settings → Branches → Add rule → Branch name pattern: `staging`**

Enable:
- ✅ Require a pull request before merging
  - Required number of approvals: **1**
  - Dismiss stale pull request approvals when new commits are pushed: ✅
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `CI / SDD Sanity Checks`
    - `PR Policy / Enforce Branch Policy`
  - Require branches to be up to date before merging: ✅
- ✅ Require conversation resolution before merging: ✅
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches: (optional, restrict to specific teams/users)

### For `main` branch (production)

**Settings → Branches → Add rule → Branch name pattern: `main`**

Enable:
- ✅ Require a pull request before merging
  - Required number of approvals: **1** (or more, per team preference)
  - Dismiss stale pull request approvals when new commits are pushed: ✅
- ✅ Require status checks to pass before merging
  - Required status checks:
    - `CI / SDD Sanity Checks`
    - `PR Policy / Enforce Branch Policy`
  - Require branches to be up to date before merging: ✅
- ✅ Require conversation resolution before merging: ✅
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches: (recommended: restrict to admins only)
- ✅ Include administrators: ❌ (recommended: admins must also follow rules)

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
