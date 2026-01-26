---
helper_id: coderabbit-integration
load_when:
  - pr_exists
  - code_review_needed
  - task_validate
  - refactoring_analysis
dependencies:
  - github-helpers
sections:
  detection:
    title: "CodeRabbit Detection"
    lines: [14, 60]
  categorization:
    title: "Issue Categorization"
    lines: [61, 120]
  resolution:
    title: "Conversation Resolution"
    lines: [121, 180]
  argumentation:
    title: "Argumentation Logging"
    lines: [181, 234]
always_load: false
---

# CodeRabbit Integration

This helper provides logic for detecting, reading, and handling CodeRabbit code review comments from GitHub PRs.

## Purpose

Automatically handle CodeRabbit comments by:
- Detecting CodeRabbit comments in PRs
- Categorizing issues (Minor, Major, Bottleneck, Optimization)
- Evaluating if issues are already resolved in code
- Resolving conversations when issues are fixed
- Providing argumentation when issues shouldn't be resolved

## CodeRabbit Detection

### Detection Methods

**Method 1: Pattern Search**
- Search for patterns in comment text:
  - "CodeRabbit"
  - "code rabbit"
  - "CodeRabbit AI"
  - "coderabbit"
  - Case-insensitive matching

**Method 2: Author Check**
- Check if comment author is CodeRabbit bot
- Common bot usernames:
  - "coderabbitai"
  - "coderabbit[bot]"
  - "code-rabbit"
  - "CodeRabbit"

**Combined Detection:**
- Use both methods for reliable detection
- If either method matches → treat as CodeRabbit comment

## Reading PR Comments

### GitHub Integration Fallback Strategy

**Priority 1: GitHub MCP**
- Use `mcp_github_get_pull_request_comments` if available
- Check MCP availability first

**Priority 2: GitHub CLI**
- If MCP not available → use GitHub CLI `gh pr view --comments`
- Check if `gh` is installed: `gh --version`
- Parse CLI output for comments

**Priority 3: Local Mode**
- If both fail → log to local mode
- Store in `work/backlog/tasks.local.md` for manual review

### Comment Structure

CodeRabbit comments typically include:
- **Issue type:** Minor, Major, Bottleneck, Optimization
- **File path:** Which file has the issue
- **Line numbers:** Specific lines affected
- **Suggestion:** What should be changed
- **Reason:** Why the change is suggested

## Issue Categorization

### Categories

**Minor:**
- Styling issues (formatting, spacing)
- Naming conventions
- Code style preferences
- Minor optimizations

**Major:**
- Performance issues
- Security vulnerabilities
- Bugs or potential bugs
- Architecture concerns

**Bottleneck:**
- Performance bottlenecks
- Slow operations
- Resource-intensive code
- Scalability issues

**Optimization:**
- Code optimization suggestions
- Efficiency improvements
- Better algorithms
- Reduced complexity

### Categorization Logic

1. **Read comment text:**
   - Look for keywords: "minor", "major", "bottleneck", "optimization"
   - Check CodeRabbit labels/markers

2. **Analyze suggestion:**
   - If performance-related → Bottleneck or Optimization
   - If security-related → Major
   - If styling-related → Minor
   - If bug-related → Major

3. **Default categorization:**
   - If unclear → treat as Minor (less disruptive)

## Evaluating Resolution

### Step 1: Check if Issue Already Resolved

**For each CodeRabbit comment:**
1. **Read file mentioned in comment:**
   - Get file path from comment
   - Read current file content

2. **Check if issue is fixed:**
   - Compare comment suggestion with current code
   - If suggestion already implemented → mark as resolved
   - If code changed but issue persists → mark as unresolved

3. **Verify resolution:**
   - Check if the specific issue mentioned is addressed
   - Don't assume all changes resolve the issue

### Step 2: Evaluate if Issue Should Be Resolved

**If issue not resolved:**
1. **Assess importance:**
   - Minor issues: Can be deferred
   - Major issues: Should be addressed
   - Bottlenecks: Should be addressed if performance-critical
   - Optimizations: Can be deferred if not critical

2. **Check refactoring rules:**
   - Compare with refactoring rules (see `/tools/refactor`)
   - If aligns with refactoring rules → should be resolved
   - If conflicts with project patterns → may not need resolution

3. **Consider project context:**
   - Is this a critical path?
   - Is this blocking other work?
   - Is this a known pattern in the project?

## Resolution Actions

### When Issue is Resolved

1. **Resolve conversation:**
   - Use GitHub helpers (see `github-helpers.md`)
   - Mark conversation as resolved
   - Add comment: "Issue resolved in code"

2. **Track resolution:**
   - Log to tracking system (avoid duplicate resolution)
   - Update local tracking if needed

### When Issue Should Be Resolved (But Not Yet)

1. **Create task:**
   - Add to `work/backlog/tasks.local.md` or Linear
   - Reference CodeRabbit comment
   - Set appropriate priority

2. **Add comment to PR:**
   - Acknowledge the issue
   - Explain when it will be addressed
   - Reference created task

### When Issue Shouldn't Be Resolved

1. **Provide argumentation:**
   - Explain why the issue won't be resolved
   - Reference project patterns or decisions
   - Log to Linear issue or GitHub issue comment

2. **Log to local mode:**
   - If Linear/GitHub not available → log to `work/backlog/tasks.local.md`
   - Include argumentation for future reference

## Integration Points

### In `/task/validate`:

**After validation:**
1. Check if PR exists (from current branch)
2. If PR exists → read CodeRabbit comments
3. For each CodeRabbit comment:
   - Check if issue resolved
   - If resolved → resolve conversation
   - If not resolved → evaluate and take action

### In `/tools/refactor`:

**After refactoring:**
1. Check if PR exists
2. If PR exists → read CodeRabbit comments
3. For each refactoring-related comment:
   - Evaluate against refactoring rules
   - If refactoring needed → apply refactoring
   - If not needed → provide argumentation

## Error Handling

- **GitHub MCP not available:** Try GitHub CLI, then local mode
- **GitHub CLI not available:** Use local mode
- **CodeRabbit not found:** Skip CodeRabbit integration, continue workflow
- **PR not found:** Skip PR integration, continue workflow
- **Comment parsing fails:** Log error, continue with next comment

## Best Practices

1. **Don't block workflow:** If CodeRabbit integration fails, continue without it
2. **Respect user decisions:** If user explicitly ignores an issue, don't re-raise it
3. **Track resolutions:** Avoid duplicate resolution attempts
4. **Provide context:** When arguing against resolution, provide clear reasoning
5. **Prioritize correctly:** Address Major issues before Minor issues

## Examples

### Example 1: Minor Issue Resolved

**CodeRabbit comment:**
- "Consider using const instead of let for variable that's never reassigned"
- File: `src/utils/helpers.ts`, Line 42

**Action:**
- Check if code already uses `const`
- If yes → resolve conversation
- If no → check if should be changed (usually yes for Minor)

### Example 2: Major Issue Not Resolved

**CodeRabbit comment:**
- "Potential security vulnerability: SQL injection risk"
- File: `src/api/users.ts`, Line 15

**Action:**
- Check if code uses parameterized queries
- If no → create task to fix (Major issue)
- Add comment to PR acknowledging issue
- Log to Linear or local backlog

### Example 3: Optimization Deferred

**CodeRabbit comment:**
- "Consider using Map instead of Object for better performance"
- File: `src/data/processor.ts`, Line 89

**Action:**
- Evaluate if performance is critical
- If not critical → add comment explaining deferral
- Log to backlog for future optimization

