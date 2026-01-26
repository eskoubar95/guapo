---
helper_id: activation
load_when:
  - always
sections:
  matching:
    title: "Match detection results"
    lines: [1, 50]
  dependencies:
    title: "Check rule dependencies"
    lines: [51, 100]
  activation:
    title: "Activate matching rules"
    lines: [101, 150]
always_load: true
---

# Rule Activation Engine

This engine activates relevant rules based on project detection results.

## Purpose

After project detection, this engine:
- Matches detection results against rule metadata
- Activates relevant rules based on activation conditions
- Handles rule dependencies (requires field)
- Outputs active rule list with categories

## Activation Algorithm

**Step 1: Always activate foundation rules**
- `00-pos.mdc` - Project Operating System (always apply)
- `01-sdd.mdc` - Spec-Driven Development (always apply)
- `02-work-mode.mdc` - Work Mode (always apply)

**Step 2: Match detection results against rule metadata**

**2.1: Check for tech stack in spec (if available)**
- Read tech stack from `spec/08-infrastructure.md` or `spec/02-architecture.md`
- If tech stack found → use it as primary source for framework/tool detection
- For each framework/tool in tech stack:
  - Check if rule exists (e.g., `20-nextjs.mdc` for "Next.js")
  - If rule exists → add to activation queue
  - If rule doesn't exist → note for user guidance: "Framework [X] detected but no specific rule exists. Should I create a framework-specific rule, or use general patterns with Context7 documentation lookup?"

**2.2: Match detection results against rule metadata**

**Rule Metadata Cache Strategy:**

1. **Check cache validity:**
   - Check if `.sdd/rule-metadata-cache.json` exists
   - Check if cache is valid (compare rule file modification times with cache timestamp)
   - If cache valid → use cached metadata
   - If cache invalid or missing → rebuild cache

2. **Rebuild cache (if needed):**
   - Scan all rule files in `.cursor/rules/`
   - Extract metadata (activation conditions, requires, etc.)
   - Store in `.sdd/rule-metadata-cache.json`:
     ```json
     {
       "rules": {
         "20-nextjs.mdc": {
           "activation": {
             "projectTypes": ["web-app"],
             "technologies": ["nextjs"]
           },
           "requires": ["10-engineering"]
         }
       },
       "last_updated": "2026-01-07T12:00:00Z",
       "rule_files": {
         "20-nextjs.mdc": {
           "mtime": 1704633600000
         }
       }
     }
     ```

3. **Match detection results against cached metadata:**
   - For each rule in cache:
     - Check if rule matches detection:
       - `projectTypes` contains detected project type
       - `projectSizes` contains detected project size
       - `projectPhases` contains detected project phase
       - `technologies` contains any detected technology (from package.json or spec tech stack)
     - If match → add to activation queue

**Cache Invalidation:**
- Invalidate cache if any rule file is modified (compare mtime)
- Invalidate cache if new rule files are added
- Invalidate cache if rule files are deleted
- Rebuild cache automatically when invalid

**Step 3: Check rule dependencies**

For each rule in activation queue:
1. Check `requires` field
2. If required rules not active → activate them first
3. Handle circular dependencies (warn and break cycle)

**Step 4: Activate matching rules**

Activate rules in dependency order:
1. Foundation rules (already active)
2. Domain rules (10-engineering, 11-design, 12-business)
3. Technology rules (20-nextjs, 21-api-design, 30-database, etc.)

**Step 5: Output active rule list**

```markdown
**Active Rule Sets:**

**Foundation (always active):**
- 00-pos.mdc - Project Operating System
- 01-sdd.mdc - Spec-Driven Development
- 02-work-mode.mdc - Work Mode

**Domain (context-based):**
- 10-engineering.mdc - Engineering patterns
- 11-design.mdc - Design patterns

**Technology (auto-activated):**
- 20-nextjs.mdc - Next.js patterns
- 21-api-design.mdc - API design patterns
- 30-database.mdc - Database patterns
```

## Rule Metadata Format

Each rule file should include activation metadata:

```markdown
---
title: [Rule Title]
description: [Description]
owner: sdd-system
severity: warn
globs: [File patterns - optional]
alwaysApply: false
activation:
  projectTypes: [web-app, cli-tool, library, api-service, mobile-app, monorepo]
  projectSizes: [small, medium, large, enterprise]
  projectPhases: [initialization, expansion, maintenance, migration, legacy]
  technologies: [nextjs, react, postgres, clerk, tailwindcss, jest]
  requires: [10-engineering, 11-design]
---
```

## Activation Logic Examples

**Example 1: Next.js web app (medium, expansion)**
- Foundation: 00-pos, 01-sdd, 02-work-mode
- Domain: 10-engineering, 11-design
- Technology: 20-nextjs, 21-api-design (if API routes exist), 30-database (if database detected)

**Example 2: CLI tool (small, initialization)**
- Foundation: 00-pos, 01-sdd, 02-work-mode
- Domain: 10-engineering
- Technology: 40-cli-patterns (if exists)

**Example 3: Legacy Express API (large, maintenance)**
- Foundation: 00-pos, 01-sdd, 02-work-mode
- Domain: 10-engineering
- Technology: 21-api-design, 30-database

## User Override

Users can override activation:
- Manually activate/deactivate specific rules
- Force activation of rules that didn't match
- Disable auto-activation for specific rules

## Rule Metadata Cache

**Cache Location:** `.sdd/rule-metadata-cache.json`

**Cache Structure:**
```json
{
  "rules": {
    "20-nextjs.mdc": {
      "activation": {
        "projectTypes": ["web-app"],
        "projectSizes": ["small", "medium", "large"],
        "projectPhases": ["initialization", "expansion"],
        "technologies": ["nextjs", "react"]
      },
      "requires": ["10-engineering"]
    }
  },
  "last_updated": "2026-01-07T12:00:00Z",
  "rule_files": {
    "20-nextjs.mdc": {
      "mtime": 1704633600000
    }
  }
}
```

**Cache Management:**
- **Build cache:** Parse all rule files, extract metadata, store in cache
- **Validate cache:** Compare rule file mtimes with cache mtimes
- **Invalidate cache:** If any rule file modified, rebuild cache
- **Use cache:** Read from cache instead of scanning all rule files

**Benefits:**
- Faster activation (read from cache instead of scanning all files)
- Reduced token consumption (cache is small JSON file)
- Automatic invalidation ensures cache stays current

## Usage in Commands

All SDD commands should:
1. Run detection (or read from cache)
2. Run activation engine (use rule metadata cache)
3. Include active rule list in state assertion
4. Apply active rules during execution

