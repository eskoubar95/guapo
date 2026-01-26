---
helper_id: github-helpers
load_when:
  - pr_exists
  - github_operation_needed
  - coderabbit_integration
sections:
  detection:
    title: "GitHub Integration Detection"
    lines: [1, 50]
  pr_comments:
    title: "Read PR Conversations"
    lines: [51, 100]
  resolve:
    title: "Resolve Conversations"
    lines: [101, 150]
always_load: false
---

# GitHub Helpers

This helper provides logic for GitHub PR conversation resolution and argumentation logging, with fallback support for GitHub CLI and local mode.

## Purpose

Handle GitHub PR operations with fallback strategy:
- Detect GitHub integration availability (MCP → CLI → Local)
- Read PR conversations
- Resolve conversations
- Track resolved issues
- Log argumentation when issues shouldn't be resolved

## GitHub Integration Detection

### Detection Process

**Step 1: Check GitHub MCP**
1. Try to call GitHub MCP function (e.g., `mcp_github_get_pull_request_comments`)
2. If function available → MCP is available
3. If function not available → proceed to Step 2

**Step 2: Check GitHub CLI**
1. Check if `gh` is installed: `gh --version`
2. If installed → CLI is available
3. If not installed → proceed to Step 3

**Step 3: Local Mode**
1. If both MCP and CLI unavailable → use local mode
2. Log operations to `work/backlog/tasks.local.md`

### Integration Priority

**Priority 1: GitHub MCP**
- Use MCP functions when available
- Most reliable and feature-rich
- Direct API access

**Priority 2: GitHub CLI**
- Use `gh` commands when MCP unavailable
- Requires CLI installation
- Parse CLI output

**Priority 3: Local Mode**
- Log to local files when both unavailable
- No GitHub integration, but workflow continues

## Reading PR Conversations

### Via GitHub MCP

**Function:** `mcp_github_get_pull_request_comments`

**Usage:**
- Get PR number from current branch or user input
- Call MCP function with PR number
- Parse returned comments

**Example:**
```typescript
// Pseudo-code
const comments = await mcp_github_get_pull_request_comments({
  owner: "username",
  repo: "repo-name",
  pull_number: 123
});
```

### Via GitHub CLI

**Command:** `gh pr view --comments <pr-number>`

**Usage:**
1. Get PR number from current branch: `gh pr view --json number`
2. Get comments: `gh pr view <pr-number> --comments`
3. Parse JSON output for comments

**Example:**
```bash
# Get PR number from current branch
PR_NUMBER=$(gh pr view --json number -q .number)

# Get comments
gh pr view $PR_NUMBER --comments --json comments
```

### Via Local Mode

**Fallback:**
- If both MCP and CLI unavailable
- Log to `work/backlog/tasks.local.md`
- Format: "CodeRabbit comment on PR #X: [comment text]"

## Resolving Conversations

### Via GitHub MCP

**If MCP has resolve function:**
- Use MCP function to resolve conversation
- Mark conversation as resolved with comment

**If MCP doesn't have resolve function:**
- Use review comments to mark as resolved
- Add comment: "Issue resolved in code"

### Via GitHub CLI

**Command:** `gh pr comment <pr-number> --body "<comment>"`

**Usage:**
1. Add comment indicating resolution
2. Use review comments if available: `gh pr review --comment`

**Example:**
```bash
# Add resolution comment
gh pr comment $PR_NUMBER --body "Issue resolved in code. Changes applied."

# Or use review comment
gh pr review $PR_NUMBER --comment --body "Issue resolved"
```

### Via Local Mode

**Fallback:**
- Log resolution to `work/backlog/tasks.local.md`
- Format: "Resolved CodeRabbit comment on PR #X: [comment text]"
- Include timestamp and resolution reason

## Tracking Resolved Issues

### Purpose

Avoid duplicate resolution attempts and track what's been resolved.

### Tracking Method

**Local tracking file:** `.sdd/github-resolved-issues.json`

**Structure:**
```json
{
  "resolved": [
    {
      "pr_number": 123,
      "comment_id": "abc123",
      "resolved_at": "2026-01-07T12:00:00Z",
      "resolved_by": "system",
      "resolution_reason": "Issue fixed in code"
    }
  ]
}
```

### Check Before Resolution

1. Read tracking file
2. Check if comment already resolved
3. If already resolved → skip
4. If not resolved → proceed with resolution

### Update After Resolution

1. Add entry to tracking file
2. Include PR number, comment ID, timestamp
3. Save tracking file

## Argumentation Logging

### When Issue Shouldn't Be Resolved

**Provide argumentation:**
- Explain why issue won't be resolved
- Reference project patterns or decisions
- Include context and reasoning

### Logging Methods

**Priority 1: Linear Issue**
- If Linear available → create issue or add comment
- Include argumentation and CodeRabbit comment reference

**Priority 2: GitHub Issue**
- If GitHub available → create issue or add comment
- Include argumentation and PR reference

**Priority 3: Local Mode**
- Log to `work/backlog/tasks.local.md`
- Format: "CodeRabbit issue deferred: [reason]"

### Argumentation Format

**Structure:**
- **Issue:** Brief description
- **CodeRabbit suggestion:** What was suggested
- **Decision:** Why not resolving
- **Reasoning:** Detailed explanation
- **Reference:** Project patterns, decisions, or context

**Example:**
```
Issue: CodeRabbit suggests using Map instead of Object
CodeRabbit suggestion: "Consider using Map for better performance"
Decision: Deferring this optimization
Reasoning: Current Object usage is sufficient for this use case (small dataset, infrequent access). Performance gain would be minimal and not worth the refactoring effort at this time.
Reference: spec/05-decisions.md - Performance optimization guidelines
```

## GitHub CLI Commands Reference

### PR Operations

**View PR:**
```bash
gh pr view <pr-number>
gh pr view --json number,title,comments
```

**Get PR comments:**
```bash
gh pr view <pr-number> --comments
gh pr view <pr-number> --comments --json comments
```

**Add PR comment:**
```bash
gh pr comment <pr-number> --body "<comment text>"
```

**Create PR review:**
```bash
gh pr review <pr-number> --approve
gh pr review <pr-number> --request-changes --body "<comment>"
gh pr review <pr-number> --comment --body "<comment>"
```

### Issue Operations

**Create issue:**
```bash
gh issue create --title "<title>" --body "<body>"
```

**Add issue comment:**
```bash
gh issue comment <issue-number> --body "<comment>"
```

**List issues:**
```bash
gh issue list
gh issue list --json number,title,state
```

## Integration Points

### In `/task/validate`:

**After validation:**
1. Check if PR exists (from current branch)
2. If PR exists → read conversations via helpers
3. For each CodeRabbit comment:
   - Check if resolved (via tracking)
   - If resolved → skip
   - If not resolved → check if issue fixed in code
   - If fixed → resolve conversation
   - If not fixed → evaluate and take action

### In `/tools/refactor`:

**After refactoring:**
1. Check if PR exists
2. If PR exists → read conversations
3. For refactoring-related comments:
   - Check if refactoring applied
   - If applied → resolve conversation
   - If not applied → provide argumentation

## Error Handling

- **GitHub MCP not available:** Try GitHub CLI, then local mode
- **GitHub CLI not available:** Use local mode
- **PR not found:** Skip PR integration, continue workflow
- **Comment parsing fails:** Log error, continue with next comment
- **Resolution fails:** Log error, continue workflow

## Best Practices

1. **Always check tracking:** Avoid duplicate resolution attempts
2. **Provide clear argumentation:** When deferring issues, explain why
3. **Don't block workflow:** If GitHub integration fails, continue without it
4. **Log operations:** Track what's been resolved for future reference
5. **Respect user decisions:** If user explicitly ignores issue, don't re-raise

## Examples

### Example 1: Resolve via MCP

1. Detect MCP available
2. Get PR comments via MCP
3. Resolve conversation via MCP
4. Update tracking file

### Example 2: Resolve via CLI

1. Detect MCP not available
2. Check CLI available
3. Get PR comments via CLI
4. Add resolution comment via CLI
5. Update tracking file

### Example 3: Local Mode Fallback

1. Detect MCP not available
2. Detect CLI not available
3. Log to `work/backlog/tasks.local.md`
4. Continue workflow

