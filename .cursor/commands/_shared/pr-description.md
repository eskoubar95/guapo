---
helper_id: pr-description
load_when:
  - pr_creation_needed
  - pr_update_needed
sections:
  template:
    title: "PR Description Template"
    lines: [1, 100]
  generation:
    title: "Auto-generation Logic"
    lines: [101, 200]
always_load: false
---

# PR Description Generation

This helper provides logic for automatically generating meaningful PR descriptions based on task specs, commit history, and changes.

## Purpose

Generate comprehensive PR descriptions that include:
- Task information
- Changes summary
- Testing notes
- Acceptance criteria
- Related issues

## Template Structure

### Standard Template

```markdown
## Task: [task-id] - [task description]

### Changes
[Auto-generated summary of changes from git diff and commit history]

### Testing
[Testing notes from task spec or manual testing]

### Acceptance Criteria
[Acceptance criteria from task spec]

### Related
[Related Linear issues, dependencies, or related tasks]
```

### Detailed Template (for complex tasks)

```markdown
## Task: [task-id] - [task description]

### Overview
[Brief overview of what this PR accomplishes]

### Changes
[Detailed summary of changes]

#### Files Changed
- [List of key files changed]

#### Key Changes
- [Bullet points of main changes]

### Testing
[Testing notes]

### Acceptance Criteria
[Acceptance criteria checklist]

### Related
[Related issues, dependencies, etc.]

### Notes
[Any additional notes or context]
```

## Auto-Generation Process

### Step 0: Resolve the base branch

Do NOT assume the base branch is `main`.

1. Resolve `defaultBranch` using one of:
   - Skill (Cursor 2.4+): `/sdd-git-default-branch`
   - Helper: `.cursor/commands/_shared/branch-detection.md` (if present in the project)
2. Use `defaultBranch` consistently for diff, commit history, and PR base.

### Step 1: Read Task Information

**From task spec:**
1. Read `work/backlog/tasks.local.md` for task details
2. If task-level spec exists (`spec/tasks/[task-id]/spec.md`), read it
3. Extract:
   - Task ID
   - Task description
   - Acceptance criteria
   - Dependencies
   - Testing requirements

### Step 2: Generate Changes Summary

**From git diff:**
1. Get diff summary: `git diff <default-branch>...HEAD --stat`
2. Get commit history: `git log <default-branch>..HEAD --oneline`
3. Analyze changed files:
   - Count files changed
   - Identify file types (components, services, tests, etc.)
   - Note key additions/deletions

**Format changes summary:**
- "Modified X files: [key files]"
- "Added Y new files: [new files]"
- "Removed Z files: [removed files]"
- Include commit messages in summary

### Step 3: Extract Testing Notes

**From task spec:**
- If task spec includes testing notes → use them
- If task spec mentions manual testing → include that
- If tests were added → mention test files

**From commit history:**
- Check if test files were added/modified
- Mention test coverage if applicable

### Step 4: Include Acceptance Criteria

**From task spec:**
- Read acceptance criteria from task
- Format as checklist:
  ```markdown
  - [ ] Criteria 1
  - [ ] Criteria 2
  - [ ] Criteria 3
  ```

### Step 5: Add Related Information

**Linear issues:**
- If Linear enabled and task is Linear issue → reference Linear issue
- Format: `Related to [Linear issue ID]`

**Dependencies:**
- If task has dependencies → list them
- Format: `Depends on: [task IDs]`

**Related tasks:**
- If related tasks exist → mention them
- Format: `Related: [task IDs]`

## Integration with GitHub Helpers

### PR Creation

**When creating PR:**
1. Generate PR description using this helper
2. Use description in PR creation (via GitHub MCP or CLI)
3. Update PR description if needed after deployment

### PR Updates

**After deployment:**
1. If preview URL available → add to PR description
2. Format: `### Preview\n[Preview URL](url)`

**After CodeRabbit comments:**
1. If significant changes made → update PR description
2. Note changes in "Changes" section

## Framework-Specific Adaptations

### Next.js Projects

**Include:**
- Route changes (if App Router)
- API route changes (if applicable)
- Component changes
- Build/configuration changes

### API Projects

**Include:**
- Endpoint changes
- Request/response format changes
- Database schema changes (if applicable)
- Authentication changes

### Library Projects

**Include:**
- API changes
- Breaking changes (if any)
- New exports
- Documentation updates

## Error Handling

- **Task spec not found:** Use git diff and commit history only
- **Git operations fail:** Use task description as fallback
- **Linear not available:** Skip Linear references
- **Deployment not available:** Skip preview URL

## Best Practices

1. **Be comprehensive:** Include all relevant information
2. **Be concise:** Keep descriptions readable
3. **Use checklists:** Make acceptance criteria actionable
4. **Reference related work:** Link to related issues/tasks
5. **Update as needed:** Keep PR description current

## Examples

### Example 1: Simple Feature

```markdown
## Task: T1.2 - Add user authentication

### Changes
Modified 5 files:
- Added `src/auth/service.ts` (authentication service)
- Updated `src/app/login/page.tsx` (login UI)
- Added `src/app/api/auth/route.ts` (auth API route)
- Updated `src/middleware.ts` (auth middleware)
- Added tests: `src/auth/__tests__/service.test.ts`

### Testing
- Manual testing: Login flow tested
- Unit tests: Authentication service tests added
- Integration tests: API route tests added

### Acceptance Criteria
- [x] User can log in with email/password
- [x] User session is maintained
- [x] Protected routes require authentication
- [x] Error handling for invalid credentials

### Related
Related to LIN-123 (User Authentication Epic)
```

### Example 2: Bug Fix

```markdown
## Task: T2.3 - Fix database connection timeout

### Changes
Modified 2 files:
- Updated `src/db/connection.ts` (increased timeout, added retry logic)
- Updated `src/db/__tests__/connection.test.ts` (added timeout tests)

### Testing
- Manual testing: Verified connection works under load
- Unit tests: Connection retry logic tested
- Integration tests: Database operations tested

### Acceptance Criteria
- [x] Database connection doesn't timeout under normal load
- [x] Connection retries on failure
- [x] Error messages are clear

### Related
Fixes issue reported in LIN-456
```

### Example 3: With Preview Deployment

```markdown
## Task: T3.1 - Refactor payment processing

### Changes
[Changes summary...]

### Testing
[Testing notes...]

### Acceptance Criteria
[Acceptance criteria...]

### Preview
[Preview URL](https://preview-url.vercel.app)

### Related
[Related issues...]
```

