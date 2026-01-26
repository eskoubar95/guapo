---
helper_id: documentation-lookup
load_when:
  - framework_detected
  - tool_detected
  - documentation_needed
  - task_start
  - task_validate
sections:
  context7:
    title: "Context7 Integration"
    lines: [10, 80]
  lookup_logic:
    title: "Documentation Lookup Logic"
    lines: [17, 150]
  fallback:
    title: "Fallback Strategies"
    lines: [151, 220]
always_load: false
---

# Documentation Lookup Helper

This document provides guidance for fetching up-to-date documentation for frameworks, tools, and libraries using Context7 MCP.

## Purpose

Enable dynamic documentation lookup for any framework/tool/library without requiring library ID mapping. Context7 MCP can automatically resolve library IDs based on queries.

## Context7 Integration

**Context7 MCP Functions:**
- `mcp_context7_resolve-library-id`: Resolves library name to Context7 library ID (optional, Context7 can find it automatically)
- `mcp_context7_query-docs`: Queries documentation directly using library name or ID

**Key Insight:** Context7 can automatically resolve library IDs from queries, so library ID mapping is not necessary.

## Documentation Lookup Logic

### Step 1: Check Context7 MCP Availability

**Before fetching documentation:**
1. Check if Context7 MCP is available
2. If available → proceed with Context7 lookup
3. If unavailable → use cached documentation or continue without documentation

### Step 2: Query Context7 (If Available)

**Query Format:**
- Use framework/tool name directly in query
- Format: "[Framework/Tool Name] [specific topic]"
- Context7 automatically resolves library ID based on query

**Example Queries:**
- "Next.js Server Components patterns"
- "Payload CMS collection setup"
- "Vite build configuration"
- "FastAPI endpoint implementation"
- "PostgreSQL connection pooling"
- "React hooks best practices"

**Query Strategy:**
1. **Direct Query (Recommended):**
   - Use `mcp_context7_query-docs` directly with framework/tool name in query
   - Example: `mcp_context7_query-docs(libraryId: null, query: "Next.js Server Components patterns")`
   - Context7 will automatically resolve the library ID from the query

2. **Resolve First (If Needed):**
   - If you need the library ID explicitly, use `mcp_context7_resolve-library-id` first
   - Example: `mcp_context7_resolve-library-id(libraryName: "next.js", query: "Server Components")`
   - Then use resolved library ID in `mcp_context7_query-docs`

**Best Practice:**
- Use direct query approach (Step 1) - it's simpler and Context7 handles resolution automatically
- Only use resolve-first approach if you need the library ID for other purposes

### Step 3: Cache Management

**Cache File:** `.sdd/docs-cache.json`

**Cache Structure:**
```json
{
  "nextjs": {
    "queries": {
      "Server Components patterns": {
        "content": "...",
        "timestamp": "2024-01-01T00:00:00Z",
        "ttl": 86400
      }
    }
  },
  "vite": {
    "queries": {
      "Build configuration": {
        "content": "...",
        "timestamp": "2024-01-01T00:00:00Z",
        "ttl": 86400
      }
    }
  }
}
```

**Cache Strategy:**
1. Before querying Context7, check cache:
   - If query exists in cache and not expired (TTL: 24 hours) → use cached content
   - If query doesn't exist or expired → fetch from Context7
2. After fetching from Context7, update cache with new content and timestamp
3. Cache key: framework/tool name + query topic

**Cache TTL:** 24 hours (documentation doesn't change frequently)

### Step 4: Fallback Strategy (Multi-Source Documentation)

**If Context7 MCP Unavailable or insufficient:**

**Priority 1: Check Cache**
1. Check cache for existing documentation (if available and not expired)
2. If cached documentation available → use it

**Priority 2: Cursor Documentation Indexing**
1. If Context7 unavailable or insufficient → use Cursor's built-in documentation indexing
2. Cursor can index project documentation, README files, and code comments
3. Search indexed documentation for framework/tool information
4. Use indexed documentation to answer questions

**Priority 3: Web Search**
1. If Context7 unavailable and cache/indexed docs insufficient → use web search
2. Search for framework/tool documentation online
3. Use web search results to answer questions
4. Example queries: "[Framework] [topic] documentation", "[Framework] [topic] best practices"

**Priority 4: General Patterns**
1. If all documentation sources unavailable → use general engineering patterns from `10-engineering.mdc`
2. Continue workflow without blocking
3. Report to user: "Documentation lookup limited. Using general patterns and available information."

**Smart Thinking Approach:**
- Be flexible and adaptive
- Use multiple sources when available
- Don't be rigid - if one source fails, try others
- Combine information from multiple sources when helpful
- Only ask user if all sources exhausted and information critical

## When to Fetch Documentation

**Fetch documentation when:**
1. Framework/tool detected from tech stack in spec
2. Implementation question arises (how to implement X in framework Y)
3. Debugging framework-specific issue
4. Verifying framework patterns match best practices
5. Refactoring framework-specific code

**Do NOT fetch documentation when:**
- General code quality issues (use general patterns)
- Framework-agnostic problems
- Documentation already cached and not expired

## Query Examples by Use Case

### Implementation Guidance

**When implementing a feature:**
- Query: "[Framework] [feature type] implementation"
- Example: "Next.js Server Actions implementation"
- Example: "Payload CMS collection setup"

### Debugging

**When debugging an issue:**
- Query: "[Framework] [issue type] troubleshooting"
- Example: "Next.js hydration mismatch"
- Example: "Vite build errors"

### Best Practices

**When verifying patterns:**
- Query: "[Framework] [pattern type] best practices"
- Example: "Next.js Server Components best practices"
- Example: "FastAPI endpoint patterns"

### Common Patterns

**When checking common patterns:**
- Query: "[Framework] [pattern name]"
- Example: "Next.js API routes"
- Example: "React hooks patterns"

## Integration in Commands

### In `/task/start`:

**When framework/tool detected from tech stack:**
1. Check if documentation needed for implementation
2. If yes → try multiple sources (in order):
   - Query Context7: "[Framework] [implementation topic]"
   - If Context7 unavailable → use Cursor documentation indexing
   - If insufficient → use web search: "[Framework] [implementation topic] documentation"
   - Combine with general engineering patterns
3. Use documentation from available sources to guide implementation
4. Reference documentation source in suggestions

**Example:**
- Tech stack: "Next.js, Payload CMS"
- Task: "Implement blog post creation"
- Try: Context7 query "Next.js Server Actions form submission"
- If unavailable: Search Cursor indexed docs or web for "Next.js Server Actions form submission"
- Use: Information from available sources to guide implementation

### In `/task/validate`:

**When debugging framework-specific issue:**
1. Identify framework/tool from tech stack
2. Try multiple sources (in order):
   - Query Context7: "[Framework] [issue topic]"
   - If Context7 unavailable → use Cursor documentation indexing
   - If insufficient → use web search: "[Framework] [issue topic] troubleshooting"
   - Combine with general engineering patterns
3. Use documentation from available sources to verify correct usage
4. Suggest fixes based on documentation from available sources

**Example:**
- Issue: "Server Component using hooks"
- Try: Context7 query "Next.js Server Components limitations"
- If unavailable: Search Cursor indexed docs or web for "Next.js Server Components limitations"
- Use: Information from available sources to explain issue and suggest fix

### In `/tools/refactor`:

**When checking framework-specific patterns:**
1. Identify framework/tool from tech stack
2. Try multiple sources (in order):
   - Query Context7: "[Framework] [pattern topic]"
   - If Context7 unavailable → use Cursor documentation indexing
   - If insufficient → use web search: "[Framework] [pattern topic] best practices"
   - Combine with general engineering patterns
3. Check code against documentation from available sources
4. Reference documentation source in refactoring suggestions

**Example:**
- Framework: "Next.js"
- Pattern check: "Server Components vs Client Components"
- Try: Context7 query "Next.js Server Components vs Client Components"
- If unavailable: Search Cursor indexed docs or web for "Next.js Server Components vs Client Components"
- Use: Information from available sources to verify correct usage

## Tech Stack Source

**Read tech stack from:**
1. `spec/08-infrastructure.md` - Technology Stack section
2. `spec/02-architecture.md` - Technology Stack section (if architecture exists)

**Tech Stack Format:**
```markdown
## Technology Stack
- Frontend Framework: Next.js
- CMS: Payload CMS
- Database: PostgreSQL
- Build Tool: Vite
- Language: TypeScript
```

**Parse tech stack:**
- Extract framework/tool names from tech stack
- Use these names directly in Context7 queries
- No library ID mapping needed

## Error Handling & Multi-Source Strategy

**If Context7 query fails:**
1. Log error clearly
2. Try alternative sources (in order):
   - Check cache for alternative documentation
   - Use Cursor's documentation indexing
   - Use web search for framework documentation
   - Use general engineering patterns
3. Combine information from multiple sources if helpful
4. Continue workflow (don't block)
5. Report to user: "Context7 lookup failed for [framework]. Using alternative sources (cache/indexing/web search)."

**If Context7 MCP unavailable:**
1. Try alternative sources (in order):
   - Check cache first
   - Use Cursor's documentation indexing
   - Use web search for framework documentation
   - Use general engineering patterns
2. Combine information from multiple sources if helpful
3. Continue workflow (don't block)
4. Report to user: "Context7 unavailable. Using alternative sources (cache/indexing/web search)."

**Smart Thinking:**
- Don't be rigid - adapt to available resources
- Use multiple sources when helpful
- Combine information from different sources
- Only ask user if all sources exhausted and information is critical
- Be proactive in finding information, not passive

## Best Practices

1. **Use specific queries:** Be specific in queries to get relevant documentation
2. **Cache results:** Always cache successful queries to reduce API calls
3. **Don't block workflow:** Never block workflow if documentation unavailable
4. **Use multiple sources:** Combine Context7, Cursor indexing, web search, and general patterns
5. **Be adaptive:** If one source fails, try others - don't give up easily
6. **Combine information:** Use information from multiple sources when helpful
7. **Reference sources:** Always reference documentation source when suggesting implementation
8. **Smart thinking:** Be proactive in finding information, not passive

## Example Workflow

**Scenario: Implementing Next.js Server Component**

1. **Tech stack detected:** "Next.js" from `spec/08-infrastructure.md`
2. **Documentation needed:** Server Component implementation
3. **Check cache:** Look for "nextjs" → "Server Components patterns" in cache
4. **If not cached:** Query Context7: "Next.js Server Components patterns"
5. **Cache result:** Store in `.sdd/docs-cache.json`
6. **Use documentation:** Guide implementation based on documentation
7. **Reference in suggestions:** "According to Next.js documentation, Server Components..."

