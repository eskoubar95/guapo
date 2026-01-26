---
helper_id: retrospective-spec-creation
load_when:
  - legacy_project_detected
  - retrospective_mode_requested
  - spec_audit
  - spec_sync
sections:
  overview:
    title: "Retrospective Spec Creation Overview"
    lines: [1, 50]
  audit_strategy:
    title: "Audit Strategy"
    lines: [51, 120]
  sync_process:
    title: "Sync Process"
    lines: [121, 200]
  documentation_patterns:
    title: "Documentation Patterns"
    lines: [201, 300]
  enterprise_patterns:
    title: "Enterprise-Specific Patterns"
    lines: [301, 400]
always_load: false
---

# Retrospective Spec Creation

This helper provides guidance for creating specifications from existing codebases, enabling SDD adoption in legacy and enterprise projects.

## Purpose

Create comprehensive specifications that document what already exists in an existing codebase, serving as:
- Foundation for future development work
- Knowledge preservation and transfer
- Alignment baseline for refactoring and migration
- Source of truth for undocumented features

## When to Use

Use retrospective spec creation when:
- Working with existing projects older than 6 months
- Codebase lacks comprehensive documentation
- Team needs to understand current state before changes
- Adopting SDD in an established project
- Planning major refactoring or migration

## Difference from New Project Specs

**New Project Specs (Prospective):**
- Define what will be built
- Start from business requirements
- Evolve as implementation progresses

**Retrospective Specs:**
- Document what already exists
- Derived from codebase analysis
- Reflect current state and discovered decisions
- Serve as baseline for future changes

## Section: Retrospective Spec Creation Overview (Lines 1-50)

### Benefits

1. **Knowledge Preservation**
   - Capture tribal knowledge embedded in code
   - Document implicit decisions and patterns
   - Create living documentation

2. **Foundation for Future Work**
   - Understand current architecture before changes
   - Identify technical debt and improvement opportunities
   - Plan migrations and refactorings with full context

3. **Team Onboarding**
   - Accelerate new team member onboarding
   - Provide structured learning path
   - Reduce knowledge silos

4. **Quality Improvement**
   - Identify undocumented features
   - Surface architectural inconsistencies
   - Document known issues and workarounds

## Section: Audit Strategy (Lines 51-120)

### Comprehensive Audit Approach

Reference: `/spec/audit` command provides the audit execution logic. This section focuses on strategy and prioritization.

### What to Analyze

#### 1. File Structure and Organization

**Analysis Points:**
- Directory structure patterns
- File naming conventions
- Module boundaries
- Import/export patterns

**Questions to Answer:**
- How is code organized?
- What patterns emerge from structure?
- Are there clear module boundaries?
- Does structure align with architecture?

**Documentation:**
- Map structure in `spec/02-architecture.md`
- Document patterns in `spec/05-decisions.md`
- Note inconsistencies and technical debt

#### 2. Features and Functionality

**Analysis Points:**
- User-facing features
- API endpoints
- Background jobs and processes
- Admin/management interfaces

**Questions to Answer:**
- What does this application actually do?
- What features exist that aren't documented?
- How do features interact?
- What are the critical user flows?

**Documentation:**
- Feature inventory in `spec/00-root-spec.md`
- Feature descriptions with code references
- User flows and interactions

#### 3. Architecture Patterns

**Analysis Points:**
- Design patterns in use
- Architectural patterns (MVC, Clean Architecture, etc.)
- Data flow patterns
- State management approaches

**Questions to Answer:**
- What architectural patterns are used?
- How is separation of concerns handled?
- What design patterns are common?
- Are patterns consistent across codebase?

**Documentation:**
- Architecture overview in `spec/02-architecture.md`
- Pattern catalog in `spec/05-decisions.md`
- Code examples illustrating patterns

#### 4. Technology Stack

**Analysis Points:**
- Frameworks and libraries
- Database and data storage
- Authentication and authorization
- External services and integrations
- Build and deployment tools

**Questions to Answer:**
- What is the actual tech stack in use?
- What versions are deployed?
- What dependencies are critical?
- What integrations exist?

**Documentation:**
- Technology inventory in `spec/08-infrastructure.md`
- Dependency analysis
- Version information and upgrade paths

#### 5. Dependencies and Integrations

**Analysis Points:**
- External API integrations
- Third-party services
- Internal service dependencies
- Database dependencies

**Questions to Answer:**
- What external systems does this depend on?
- What are the integration points?
- What are the failure modes?
- How is error handling done?

**Documentation:**
- Integration map in `spec/08-infrastructure.md`
- API contracts and interfaces
- Failure handling strategies

#### 6. Code Quality and Technical Debt

**Analysis Points:**
- Code duplication
- Complexity hotspots
- Test coverage gaps
- Known issues and workarounds
- Deprecated patterns

**Questions to Answer:**
- What technical debt exists?
- What are the highest-risk areas?
- What needs immediate attention?
- What can wait?

**Documentation:**
- Technical debt inventory in `spec/03-risks.md`
- Prioritized improvement opportunities
- Known issues and workarounds

### How to Organize Findings

**Phase 1: Discovery**
- Create audit checklist
- Identify key areas to analyze
- Set scope boundaries

**Phase 2: Analysis**
- Systematically analyze each area
- Document findings as you go
- Take code samples for reference

**Phase 3: Synthesis**
- Organize findings by category
- Identify patterns and themes
- Prioritize findings by importance

**Phase 4: Documentation**
- Structure findings into spec format
- Cross-reference code locations
- Create diagrams where helpful

### Prioritization Strategies

**High Priority:**
- Core user-facing features
- Critical integration points
- Architecture and patterns
- Security-sensitive areas

**Medium Priority:**
- Supporting features
- Internal utilities
- Configuration patterns
- Development workflows

**Low Priority:**
- Edge cases
- Deprecated code paths
- Unused features
- Historical context

**Time-Constrained Approach:**
- Start with critical paths
- Document enough for future work
- Leave detailed documentation for later
- Focus on "what" over "why" initially

## Section: Sync Process (Lines 121-200)

### Creating Specs from Audit Findings

Reference: `/spec/sync` command provides the sync execution logic. This section focuses on the process of transforming audit findings into specification documents.

### Organizing Information into Spec Structure

#### Step 1: Map Findings to Spec Files

**`spec/00-root-spec.md` (Current State)**
- What exists: Feature inventory
- Current state: System capabilities
- Scope: What's actually implemented
- Structure: Similar to new project spec but documenting existing state

**`spec/02-architecture.md` (Discovered Architecture)**
- Architecture overview from code analysis
- Patterns discovered in codebase
- Data flow and component interactions
- Technology choices and their implications

**`spec/05-decisions.md` (Inferred Decisions)**
- Decisions inferred from code patterns
- Trade-offs visible in implementation
- Historical context where available
- Rationale for current approach

**`spec/08-infrastructure.md` (Actual Tech Stack)**
- Actual technologies in use
- Dependencies and their purposes
- Infrastructure setup and configuration
- Deployment and operational patterns

#### Step 2: Document Current State

**For Each Feature:**
- What it does (functionality)
- How it works (implementation approach)
- Where it lives (file locations)
- Dependencies (what it depends on, what depends on it)

**Example Structure:**
```markdown
## Feature: User Authentication

**Current State:**
- Implements OAuth2 with Google and GitHub providers
- Uses JWT tokens for session management
- Token refresh logic in `/app/auth/refresh`
- Session storage: Redis (expires after 7 days)

**Code Locations:**
- `/app/auth/login.tsx` - Login UI
- `/app/api/auth/callback/route.ts` - OAuth callback
- `/lib/auth/session.ts` - Session management
- `/lib/auth/token.ts` - JWT handling

**Dependencies:**
- NextAuth.js v4.24
- Redis client for session storage
- External: Google OAuth, GitHub OAuth

**Known Issues:**
- Token refresh sometimes fails silently
- Session timeout not communicated to user
```

#### Step 3: Handle Undocumented Features

**When Feature Has No Documentation:**
1. Analyze code to understand functionality
2. Document what it does (not what it should do)
3. Mark as "undocumented" for future clarification
4. Add to open questions if behavior is unclear

**Questions to Ask:**
- What is the intended behavior?
- Is this feature actively used?
- Should it be documented or removed?
- Are there tests that clarify intent?

#### Step 4: Identify Decisions from Code Patterns

**Pattern Analysis:**
- Repeated patterns → deliberate decisions
- Consistent approaches → architectural choices
- Inconsistencies → areas needing clarification

**Inferring Decisions:**
- Why this pattern? (performance, simplicity, constraints)
- What trade-offs were made?
- What alternatives exist?
- Is this still the right choice?

**Documentation Format:**
```markdown
## Decision: State Management Pattern

**Current Approach:** React Context API for global state

**Evidence:**
- Consistent use across 12+ components
- Custom hooks for state access (`useAppState`)
- No Redux or Zustand found in codebase

**Inferred Rationale:**
- Simplicity over scalability
- Built-in React solution
- Smaller bundle size

**Context:**
- Project started 2020, before state management libraries were standardized
- Team prefers minimal dependencies

**Status:** Active, but may need reconsideration for scale
```

#### Step 5: Document "Why" Through Code Analysis

**Code Analysis Techniques:**
- Comment analysis (capture rationale in comments)
- Git history (check commit messages for context)
- Related code (patterns suggest intent)
- Test files (tests often document expected behavior)

**When "Why" is Unclear:**
- Mark as open question in `spec/04-open-questions.md`
- Note speculation separately from facts
- Identify who might know (team members, original authors)
- Plan follow-up investigation

### Handling Discrepancies

**Spec vs Implementation Divergence:**
- If spec exists but differs from code → Document both, note discrepancy
- If no spec exists → Create retrospective spec from code
- Prioritize code as source of truth for current state
- Document desired state separately if known

**Multiple Versions of Truth:**
- Code is authoritative for "what is"
- Comments may be outdated
- Git history provides timeline
- Documentation may be aspirational

## Section: Documentation Patterns (Lines 201-300)

### Spec Structure for Existing Projects

#### `spec/00-root-spec.md` - What Exists, Current State

**Structure:**
```markdown
# Project Root Specification (Retrospective)

**Created:** [Date of retrospective]
**Last Updated:** [Date]
**Status:** Retrospective documentation of existing system

## Overview

[What the system currently does, derived from codebase analysis]

## Current Features

[Feature inventory with code references]

## Current State

[Architectural state, technical debt, known issues]

## Target State (Optional)

[If known, document where the system should evolve]
```

**Key Differences from New Project Spec:**
- Focus on "is" not "will be"
- Include code references
- Document technical debt
- Note discrepancies with desired state

#### `spec/02-architecture.md` - Discovered Architecture Patterns

**Structure:**
```markdown
# Architecture (Discovered)

**Analysis Date:** [Date]
**Analysis Scope:** [What was analyzed]

## Architecture Overview

[High-level architecture derived from codebase]

## Patterns in Use

[Design patterns, architectural patterns found in code]

## Component Structure

[How components/modules are organized]

## Data Flow

[How data flows through the system]

## Technology Stack

[Reference to spec/08-infrastructure.md for details]
```

**Include:**
- Architecture diagrams (generated from code structure)
- Pattern examples with code snippets
- Evolution over time (if visible in git history)
- Architectural debt and inconsistencies

#### `spec/05-decisions.md` - Inferred Decisions from Code

**Structure:**
```markdown
# Decisions (Inferred)

**Note:** These decisions are inferred from code patterns and may not reflect explicit choices.

## Architectural Decisions

[Major architectural choices visible in code]

## Technology Decisions

[Technology choices and their rationale (inferred)]

## Pattern Decisions

[Design patterns and why they were chosen (inferred)]

## Historical Context

[What can be determined from git history, comments, etc.]
```

**Documentation Format:**
- Decision statement
- Evidence (code patterns, git history)
- Inferred rationale
- Context (when, constraints)
- Status (still valid, needs review, deprecated)

#### `spec/08-infrastructure.md` - Actual Tech Stack in Use

**Structure:**
```markdown
# Infrastructure (Current State)

**As of:** [Date of analysis]

## Technology Stack

[Actual technologies in use, versions]

## Dependencies

[Dependencies and their purposes]

## Infrastructure Setup

[How infrastructure is configured]

## Deployment

[How the system is deployed]
```

**Include:**
- Exact versions (from package.json, requirements.txt, etc.)
- Configuration patterns
- Environment setup
- Operational procedures (if documented)

### How to Document

#### Current State vs Desired State

**Current State Section:**
- What exists now
- Derived from code analysis
- Code references for verification
- Known limitations

**Desired State Section (Optional):**
- Where the system should evolve
- If planning refactoring/migration
- Separate clearly from current state
- Document rationale for changes

#### Technical Debt Sections

**Document in `spec/03-risks.md`:**
```markdown
## Technical Debt

### High Priority
- [Issue description]
- Impact: [What's at risk]
- Location: [Code references]
- Suggested Fix: [If known]

### Medium Priority
[Similar format]

### Low Priority
[Similar format]
```

**Categories:**
- Code quality issues
- Architecture inconsistencies
- Outdated dependencies
- Performance bottlenecks
- Security concerns

#### Migration Opportunities

**Document Potential Improvements:**
- Framework upgrades
- Architecture improvements
- Dependency modernization
- Performance optimizations

**Format:**
```markdown
## Migration Opportunities

### Framework Upgrade: Next.js 12 → 15
**Current State:** Next.js 12.3.4
**Target State:** Next.js 15.1.3
**Effort:** High
**Benefits:** App Router, React 19, better performance
**Risks:** Breaking changes, large codebase
**Recommendation:** Plan for Q2 2025
```

#### Known Issues and Workarounds

**Document Operational Knowledge:**
- Known bugs and workarounds
- Configuration quirks
- Deployment gotchas
- Performance workarounds

**Format:**
```markdown
## Known Issues and Workarounds

### Issue: Memory Leak in Background Jobs
**Symptom:** Server memory increases over time
**Location:** `/app/jobs/process-queue.ts`
**Workaround:** Restart service daily via cron
**Permanent Fix:** Not yet identified
**Status:** Monitoring, needs investigation
```

## Section: Enterprise-Specific Patterns (Lines 301-400)

### Large Codebase Strategies

#### Module-by-Module Documentation

**For Very Large Projects:**
- Don't try to document everything at once
- Prioritize modules by importance
- Document critical paths first
- Create module-level specs if needed

**Approach:**
1. Identify modules/services (monolith) or services (microservices)
2. Prioritize: Core business logic → Supporting features → Utilities
3. Document one module at a time
4. Create module overview linking to detailed docs

**Structure:**
```
spec/
├── 00-root-spec.md (overview)
├── modules/
│   ├── 01-auth.md
│   ├── 02-payments.md
│   ├── 03-notifications.md
│   └── ...
```

#### Prioritizing Critical Paths

**Critical Path Definition:**
- User-facing features
- Revenue-generating features
- Security-sensitive areas
- Infrastructure dependencies

**Documentation Order:**
1. Core business logic
2. Authentication and authorization
3. Payment/transaction processing
4. Data storage and retrieval
5. Supporting features
6. Admin/management interfaces
7. Utilities and helpers

#### Handling Microservices

**For Microservices Architecture:**
- Document each service separately
- Create service-level specs
- Document inter-service communication
- Map dependencies between services

**Structure:**
```
spec/
├── 00-root-spec.md (system overview)
├── services/
│   ├── auth-service.md
│   ├── payment-service.md
│   ├── notification-service.md
│   └── ...
├── 02-architecture.md (service interactions)
├── 08-infrastructure.md (service infrastructure)
```

**Document for Each Service:**
- Purpose and responsibilities
- API contracts
- Dependencies (other services, databases)
- Data models
- Deployment and scaling

#### Database Schema Documentation

**For Complex Databases:**
- Document schema structure
- Document relationships
- Document indexes and constraints
- Document data migration history

**Include:**
- ER diagrams (if applicable)
- Table structures
- Key relationships
- Index strategies
- Data constraints and validations

**Format:**
```markdown
## Database Schema

### Tables

#### users
**Purpose:** User accounts and profiles
**Relationships:** 
- One-to-many: orders, sessions
- Many-to-many: roles (via user_roles)
**Indexes:** email (unique), username (unique)
**Constraints:** email required, created_at auto-set
```

### Team Considerations

#### Involving Subject Matter Experts

**Who to Involve:**
- Original developers (if available)
- Long-term team members
- Domain experts
- Product owners

**How to Involve:**
- Interviews for context on decisions
- Code walkthroughs for complex areas
- Review sessions for spec accuracy
- Feedback on inferred decisions

**Documentation:**
- Capture SME input in spec
- Note uncertainty where consensus is lacking
- Document different perspectives if relevant
- Include attribution for insights

#### Knowledge Transfer Sessions

**Format:**
- Pair programming for code review
- Architecture walkthroughs
- Feature deep-dives
- Q&A sessions

**Documentation:**
- Capture key insights in specs
- Record questions and answers
- Document assumptions validated
- Note areas needing further investigation

#### Documentation Reviews

**Review Process:**
- Have team review retrospective specs
- Validate accuracy against code
- Fill in missing context
- Identify areas needing more detail

**Review Checklist:**
- [ ] Specs match actual code
- [ ] Decisions documented accurately
- [ ] All critical features covered
- [ ] Technical debt identified
- [ ] Open questions surfaced

### Integration with Existing Tools

#### Confluence/Wiki Integration

**Export Strategy:**
- Generate markdown specs
- Convert to Confluence format if needed
- Link to code repositories
- Keep specs as source of truth

**Update Process:**
- Maintain specs in SDD format
- Sync to Confluence periodically
- Use Confluence for team discussion
- Keep spec files authoritative

#### Jira/Linear Synchronization

**Task Management Integration:**
- Link retrospective audit tasks to issues
- Create issues for technical debt items
- Track spec updates as tasks
- Use Linear documents for detailed sections

**Using Linear MCP:**
- Create Linear document for each spec file
- Sync updates automatically
- Link documents to issues
- Use Linear for team collaboration

**Format:**
- Linear document: Spec content
- Linear issue: Tasks for addressing findings
- Linear project: Retrospective spec creation project

#### Code Review Integration

**During Code Review:**
- Reference specs when reviewing code
- Update specs when code changes
- Document new patterns discovered
- Identify spec-code divergence

**Process:**
- Reviewer checks spec compliance
- Reviewer notes new patterns
- Spec updated after review approval
- Maintain spec as living document

## Best Practices

### Don't Try to Document Everything at Once

**Risk:** Overwhelm, analysis paralysis, burnout

**Approach:**
- Start with critical paths
- Document enough for immediate needs
- Iterate and expand over time
- Focus on what enables future work

**Strategy:**
- Phase 1: Core features and architecture
- Phase 2: Supporting features and integrations
- Phase 3: Utilities and edge cases
- Ongoing: Update as you learn more

### Focus on What Matters for Future Work

**Priority Framework:**
1. What will change soon? (document well)
2. What is complex? (document clearly)
3. What is critical? (document thoroughly)
4. What is obvious? (document briefly)

**Documentation Depth:**
- High: Features being refactored
- Medium: Features being extended
- Low: Stable, well-understood features
- None: Deprecated, unused code

### Document "Why" Not Just "What"

**Include:**
- Rationale for architectural choices
- Trade-offs made
- Constraints that influenced decisions
- Historical context

**Avoid:**
- Just describing what code does
- Missing the reasoning
- Ignoring context
- Pure speculation without evidence

### Include Code Examples in Specs

**Benefits:**
- Concrete illustrations of patterns
- Easy verification
- Learning resource for team
- Reference for future changes

**Format:**
- Brief code snippets
- File references for full context
- Explanations alongside code
- Updated when code changes

### Keep Specs Living Documents

**Maintenance:**
- Update specs when code changes
- Review specs periodically
- Remove outdated information
- Add new discoveries

**Process:**
- Update specs during code reviews
- Review specs during planning
- Validate specs during audits
- Evolve specs with the codebase

## Common Pitfalls

### Over-Documentation

**Symptom:** Spending too much time documenting, not enough developing

**Solution:**
- Focus on what enables work
- Document iteratively
- Set time limits
- Prioritize ruthlessly

### Under-Documentation

**Symptom:** Specs too high-level, missing critical details

**Solution:**
- Include code references
- Document complex areas thoroughly
- Capture rationale and context
- Review with team

### Spec-Impl Divergence (Already Exists)

**Symptom:** Specs describe desired state, code shows different reality

**Solution:**
- Document current state first
- Separate current vs desired
- Update specs when code changes
- Regular audits to catch divergence

### Outdated Information

**Symptom:** Specs become stale as code evolves

**Solution:**
- Update specs with code changes
- Review during code reviews
- Audit periodically
- Treat as living documents

### Pure Speculation

**Symptom:** Inferring too much from code without validation

**Solution:**
- Distinguish facts from inference
- Mark speculation clearly
- Validate with team members
- Document uncertainty

## Integration Points

### Reference `detection.md` for Legacy Phase Detection

- Use detection engine to identify legacy projects
- Leverage phase detection (legacy/migration)
- Activate appropriate workflow

### Reference `spec/audit.md` Command for Audit Process

- Use `/spec/audit` for comprehensive audit
- Follow audit command workflow
- Leverage audit findings for spec creation

### Reference `spec/sync.md` Command for Sync Process

- Use `/spec/sync` to create specs from audit
- Follow sync command workflow
- Maintain spec-code alignment

### Reference `command-stacks.md` for Legacy Onboarding Stack

- Use command stack: `/spec/audit → /spec/sync → /spec/refine`
- Execute stack for complete retrospective
- Leverage automated workflow

