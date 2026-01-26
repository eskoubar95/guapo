---
helper_id: git-workflow
load_when:
  - task_start
  - task_validate
  - commit_needed
  - pr_creation_needed
sections:
  commit_generation:
    title: "Commit Message Generation"
    lines: [13, 80]
  state_detection:
    title: "State Detection"
    lines: [81, 150]
  next_steps:
    title: "Next Step Logic"
    lines: [151, 220]
always_load: false
---

# Git Workflow Automation

This helper provides logic for automatic commit message generation, state detection, and next step determination for Git/GitHub workflows.

## Purpose

Automate Git workflow operations:
- Generate meaningful commit messages based on changes
- Detect current state (branch, PR, deployment)
- Determine next steps automatically
- Track state transitions

## Commit Message Generation

### Format

**Standard format:** `[task-id] type: description`

**Examples:**
- `[T1.2] feat: add user authentication`
- `[T2.3] fix: resolve database connection issue`
- `[T3.1] refactor: extract payment logic to service`
- `[T4.5] docs: update API documentation`

### Commit Types

**feat:** New feature
- New functionality added
- New components, pages, features
- New API endpoints

**fix:** Bug fix
- Fixes existing bugs
- Resolves errors or issues
- Corrects broken functionality

**refactor:** Code refactoring
- Code restructuring without changing functionality
- Improving code organization
- Extracting logic to services/utilities

**docs:** Documentation
- Documentation updates
- README changes
- Code comments

**test:** Tests
- Adding or updating tests
- Test infrastructure changes

**chore:** Maintenance
- Dependency updates
- Build configuration changes
- Tooling changes

**style:** Code style
- Formatting changes
- Linting fixes
- Code style improvements

### Type Detection Logic

**Analyze git diff to determine type:**

1. **Check file patterns:**
   - `*.test.ts`, `*.spec.ts` → `test`
   - `*.md`, `README*`, `docs/*` → `docs`
   - `package.json`, `*.config.*` → `chore`

2. **Check diff content:**
   - New files with `export function`, `export class` → `feat`
   - Changes to error handling, try-catch → `fix`
   - Large structural changes → `refactor`
   - Formatting-only changes → `style`

3. **Check commit context:**
   - If task description mentions "fix" or "bug" → `fix`
   - If task description mentions "refactor" → `refactor`
   - If task description mentions "add" or "implement" → `feat`

### Description Generation

**From task spec:**
- Use task description as base
- Extract key action: "Add user authentication" → "add user authentication"
- Keep concise (max 72 characters for first line)

**From git diff:**
- Summarize changed files
- Identify main change: "Modified 3 files: added auth service, updated routes, added tests"
- Extract key functionality added/changed

**Combined:**
- Task description + key changes
- Format: `[task-id] type: task description (key changes)`

## State Detection

### State Structure

**State file:** `.sdd/git-state.json`

**State format:**
```json
{
  "branch": {
    "name": "task/t1.2-setup-database",
    "exists": true,
    "pushed": false,
    "commits": 3,
    "last_commit": "abc123"
  },
  "pr": {
    "exists": false,
    "number": null,
    "url": null,
    "status": null,
    "merged": false
  },
  "deployment": {
    "provider": null,
    "preview_url": null,
    "status": null
  },
  "validated": false,
  "last_updated": "2026-01-07T12:00:00Z"
}
```

### Branch State Detection

**Check branch status:**
1. Get current branch: `git branch --show-current`
2. Check if branch exists: `git rev-parse --verify <branch-name>`
3. Check if pushed: `git ls-remote --heads origin <branch-name>`
4. Count commits:
   - Resolve `defaultBranch` (do not assume `main`) using `/sdd-git-default-branch` or `branch-detection.md`
   - Count: `git rev-list --count <default-branch>..<branch-name>`
5. Get last commit: `git rev-parse HEAD`

### PR State Detection

**Priority 1: GitHub MCP**
- Use `mcp_github_list_pull_requests` to find PR for branch
- Check if PR exists and get PR number/URL

**Priority 2: GitHub CLI**
- Use `gh pr list --head <branch-name> --json number,url,state`
- Parse JSON output for PR info

**Priority 3: Local Mode**
- Check state file for cached PR info
- If not found → assume no PR exists

### Deployment State Detection

**Check deployment provider:**
- Use deployment detection helper (see `deployment-detection.md`)
- Check provider-specific status
- Get preview URL if available

## Next Step Detection

### Decision Logic

**Based on current state, determine next action:**

1. **Branch created, no commits:**
   - Next step: "Start implementing task"
   - State: `{branch: exists, commits: 0, pr: null}`

2. **Commits made, not validated:**
   - Next step: "Run validation (/task/validate)"
   - State: `{branch: exists, commits: N, pr: null, validated: false}`

3. **Validated, no PR:**
   - Next step: "Create PR"
   - State: `{branch: exists, commits: N, pr: null, validated: true}`

4. **PR created, not pushed:**
   - Next step: "Push branch to remote"
   - State: `{branch: exists, pushed: false, pr: null}`

5. **PR exists, not deployed:**
   - Next step: "Deploy to preview (if available)"
   - State: `{branch: exists, pr: {exists: true}, deployed: false}`

6. **PR merged:**
   - Next step: "Cleanup branch"
   - State: `{pr: {merged: true}}`

### State Transitions

**Track transitions:**
1. Branch created → Initialize state
2. First commit → Update commit count
3. Validation passed → Set validated: true
4. PR created → Update PR info
5. Deployment triggered → Update deployment info
6. PR merged → Update merged status
7. Branch deleted → Mark branch as deleted

## Integration Points

### In `/task/start`:

**After branch creation:**
1. Initialize state tracking
2. Set state: `{branch: {exists: true, commits: 0}, pr: null, validated: false}`
3. Store in `.sdd/git-state.json`

### In `/task/validate`:

**Before validation:**
1. Read current state
2. Check if branch exists and has commits
3. If no commits → suggest committing changes first

**After validation:**
1. Update state: `validated: true`
2. Determine next step based on state
3. If validated and no PR → suggest creating PR
4. Update state file

### When Committing:

**Generate commit message:**
1. Analyze git diff
2. Determine commit type
3. Generate description from task/changes
4. Format: `[task-id] type: description`
5. Use generated message for commit

## Error Handling

- **Git operations fail:** Report error, continue without state update
- **State file not writable:** Continue without state tracking (degraded mode)
- **PR detection fails:** Assume no PR exists, continue workflow
- **Deployment detection fails:** Skip deployment, continue workflow

## Best Practices

1. **Always check state before actions:** Avoid duplicate operations
2. **Update state after each transition:** Keep state file current
3. **Generate meaningful messages:** Commit messages should be clear and descriptive
4. **Graceful degradation:** Work even if state tracking unavailable
5. **Auto-detect everything:** Minimize manual state management

## Examples

### Example 1: First Commit

**State before:** `{branch: exists, commits: 0}`
**Changes:** Added `src/auth/service.ts`
**Generated message:** `[T1.2] feat: add user authentication service`
**State after:** `{branch: exists, commits: 1}`

### Example 2: Bug Fix

**State before:** `{branch: exists, commits: 2, validated: false}`
**Changes:** Fixed database connection error
**Generated message:** `[T2.3] fix: resolve database connection timeout`
**State after:** `{branch: exists, commits: 3, validated: false}`

### Example 3: Ready for PR

**State:** `{branch: exists, commits: 3, validated: true, pr: null}`
**Next step:** "Create PR"
**Action:** Generate PR description and create PR

