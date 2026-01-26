---
helper_id: detection
load_when:
  - always
sections:
  project_type:
    title: "Project Type Detection"
    lines: [1, 50]
  project_size:
    title: "Project Size Detection"
    lines: [51, 100]
  technologies:
    title: "Technology Detection"
    lines: [101, 200]
always_load: true
---

# Project Detection Engine

This detection engine automatically identifies project characteristics to enable dynamic rule activation and workflow adaptation.

## Purpose

Before any SDD command executes, this engine detects:
- Project type (web-app, cli-tool, library, api-service, mobile-app, monorepo)
- Project size (small, medium, large, enterprise)
- Project phase (initialization, expansion, maintenance, migration, legacy)
- Technologies (frameworks, databases, auth, styling, testing)
- Team size (if available from git)

## Detection Process

**Step 1: Read project structure**
- Check for `package.json` (Node.js projects)
- Check for `pyproject.toml`, `requirements.txt` (Python projects)
- Check for `Cargo.toml` (Rust projects)
- Check for `go.mod` (Go projects)
- Check file structure (app/, src/, lib/, etc.)
- Check config files (next.config.js, vite.config.js, etc.)

**Step 2: Detect project type**

```markdown
## Project Type Detection Rules

**web-app:**
- Has: next.config.js, vite.config.js, nuxt.config.js, remix.config.js
- OR: app/ directory (Next.js App Router)
- OR: src/app/ directory
- OR: pages/ directory (Next.js Pages Router)
- OR: React, Vue, Angular, Svelte in dependencies

**cli-tool:**
- Has: bin/ directory
- OR: commander, yargs, meow, oclif in dependencies
- OR: package.json has "bin" field

**library:**
- Has: package.json with "exports" field
- OR: package.json with "types" field
- OR: src/ with index.ts/js (main entry point)
- AND: No app/, pages/, or bin/ directories

**api-service:**
- Has: Express, FastAPI, Flask, Koa in dependencies
- OR: app/api/ directory (Next.js API routes)
- OR: routes/ directory
- OR: server.ts/js file
- AND: No app/ or pages/ directories (unless Next.js API routes)

**mobile-app:**
- Has: react-native, flutter, expo in dependencies
- OR: ios/ directory
- OR: android/ directory
- OR: app.json (Expo)

**monorepo:**
- Has: package.json with "workspaces" field
- OR: packages/ directory
- OR: apps/ directory
- OR: pnpm-workspace.yaml, lerna.json, nx.json
```

**Step 3: Detect project size**

```markdown
## Project Size Detection Rules

Count files (excluding node_modules, .git, dist, build):
- **Small:** < 50 files, < 10 dependencies, simple spec structure
- **Medium:** 50-200 files, 10-50 dependencies, moderate spec structure
- **Large:** 200-1000 files, 50-200 dependencies, complex spec structure
- **Enterprise:** > 1000 files, > 200 dependencies, very complex spec structure

**Complexity indicators:**
- Number of spec files
- Number of work/backlog tasks
- Number of milestones
- Depth of directory structure
```

**Step 4: Detect project phase**

```markdown
## Project Phase Detection Rules

**initialization:**
- New git repo (few or no commits)
- Empty or initial spec files
- No or minimal work/backlog content
- Recent first commit (< 1 week old)

**expansion:**
- Active development (regular commits)
- Growing spec (multiple spec files, evolving content)
- Active work/backlog (tasks being added/completed)
- Recent commits (< 1 month old)

**maintenance:**
- Stable codebase (infrequent commits)
- Stable spec (minimal changes)
- Bugfix/refactor commits dominate
- Long history (> 3 months old)

**migration:**
- Framework upgrade commits
- Architecture change commits
- Spec updates related to migration
- Breaking changes in git history

**legacy:**
- Existing codebase (long history > 6 months)
- Old spec (not updated recently)
- Minimal changes (few commits)
- Outdated dependencies
```

**Step 5: Detect technologies**

**Priority 1: Read tech stack from spec (if available)**

1. **Check for tech stack in spec:**
   - Read `spec/08-infrastructure.md` for "Technology Stack" section
   - Read `spec/02-architecture.md` for "Technology Stack" section (if architecture exists)
   - Parse tech stack format: "Frontend Framework: [name], CMS: [name], Database: [name], etc."

2. **Extract frameworks/tools from tech stack:**
   - Parse each line in Technology Stack section
   - Extract framework/tool names
   - Normalize names (e.g., "Next.js" → "nextjs", "Payload CMS" → "payload-cms")

3. **If tech stack found in spec:**
   - Use tech stack from spec as primary source
   - This is the authoritative source of truth for frameworks/tools
   - Supplement with package.json detection if needed

**Priority 2: Detect from package.json (if tech stack not in spec)**

```markdown
## Technology Detection Rules

**Frameworks:**
- next → Next.js
- react → React
- vue → Vue.js
- angular → Angular
- svelte → Svelte
- express → Express.js
- fastapi → FastAPI
- flask → Flask

**Databases:**
- postgres, pg → PostgreSQL
- mysql, mysql2 → MySQL
- mongodb → MongoDB
- supabase → Supabase
- prisma → Prisma (ORM)

**Auth:**
- clerk → Clerk
- auth0 → Auth0
- next-auth → NextAuth.js
- supabase-auth → Supabase Auth

**Styling:**
- tailwindcss → Tailwind CSS
- styled-components → Styled Components
- emotion → Emotion
- css-modules → CSS Modules

**Testing:**
- jest → Jest
- vitest → Vitest
- playwright → Playwright
- cypress → Cypress
- testing-library → Testing Library
```

**Tech Stack Parsing Logic:**

When reading tech stack from spec:
1. Look for "Technology Stack" section in `spec/08-infrastructure.md` or `spec/02-architecture.md`
2. Parse lines like:
   - "Frontend Framework: Next.js" → extract "Next.js" → normalize to "nextjs"
   - "CMS: Payload CMS" → extract "Payload CMS" → normalize to "payload-cms"
   - "Database: PostgreSQL" → extract "PostgreSQL" → normalize to "postgres"
3. Create list of detected frameworks/tools from spec
4. Use this list for rule activation and documentation lookup

**Step 6: Detect team size (optional)**

```markdown
## Team Size Detection Rules

From git contributors (if available):
- **Solo:** 1 contributor
- **Small team:** 2-5 contributors
- **Medium team:** 5-15 contributors
- **Large team:** 15+ contributors
```

## Detection Output Format

```json
{
  "projectType": "web-app",
  "projectSize": "medium",
  "projectPhase": "expansion",
  "technologies": {
    "framework": "nextjs",
    "database": "postgres",
    "auth": "clerk",
    "styling": "tailwindcss",
    "testing": "jest"
  },
  "teamSize": "small",
  "confidence": {
    "projectType": 0.95,
    "projectSize": 0.85,
    "projectPhase": 0.90,
    "technologies": 0.95
  },
  "sources": {
    "projectType": ["next.config.js", "app/ directory"],
    "projectSize": ["file count: 127", "dependencies: 23"],
    "projectPhase": ["git history", "spec age"],
    "technologies": ["package.json dependencies"]
  },
  "timestamp": "2026-01-07T12:00:00Z"
}
```

## Cache Management

Detection results are cached in `.sdd/detection-cache.json` for performance.

**Cache invalidation triggers:**
- package.json changes
- New config files added
- Significant file structure changes
- Spec files added/removed
- Git history changes (new commits)

**Cache structure:**
- Store detection results with timestamp
- Include confidence scores
- Include sources for each detection
- Allow manual cache invalidation

## Usage in Commands

All SDD commands should:
1. Run detection (or read from cache if valid)
2. Use detection results for rule activation
3. Include detection context in state assertions
4. Adapt workflow based on detected characteristics

