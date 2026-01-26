---
helper_id: scaling
load_when:
  - task_start
  - spec_plan
sections:
  workflow_variants:
    title: "Workflow Variants"
    lines: [1, 100]
  complexity:
    title: "Complexity Assessment"
    lines: [101, 200]
always_load: false
---

# Scaling Logic

Scaling logic adapts workflows based on project size and phase, ensuring appropriate level of detail and process.

## Purpose

Different project sizes and phases require different workflows:
- Small projects: Simplified, lightweight process
- Medium projects: Standard SDD workflow
- Large projects: Extended, detailed process
- Enterprise projects: Complex, comprehensive process

## Size-Based Workflows

### Small Projects (< 50 files, < 10 dependencies)

**Spec Structure:**
- Minimal spec files (00-root-spec.md, 03-risks.md, 04-open-questions.md)
- Lightweight content, focus on essentials
- Skip detailed design/infrastructure docs unless critical

**Planning:**
- Simplified milestones (2-3 milestones max)
- Direct task execution (skip planning for simple tasks)
- Minimal task breakdown

**Validation:**
- Manual validation only
- Lightweight checklist
- Quick verification

**Example Workflow:**
```
/spec/init → /spec/plan (simplified) → /task/start → /task/validate (manual)
```

### Medium Projects (50-200 files, 10-50 dependencies)

**Spec Structure:**
- Standard spec files (all standard files)
- Moderate detail level
- Include design/infrastructure if applicable

**Planning:**
- Standard SDD workflow
- 3-5 milestones
- Full task breakdown
- Standard acceptance criteria

**Validation:**
- Automated checks (linter, build, type check)
- Manual testing
- Standard checklist

**Example Workflow:**
```
/spec/init → /spec/refine → /spec/plan → /task/start → /task/validate
```

### Large Projects (200-1000 files, 50-200 dependencies)

**Spec Structure:**
- Extended spec (multiple spec files, detailed sections)
- Comprehensive documentation
- Design system and infrastructure docs required

**Planning:**
- Detailed planning (milestones, epics, tasks)
- 5-7 milestones
- Comprehensive task breakdown
- Detailed acceptance criteria

**Validation:**
- Comprehensive validation (automated + manual + integration)
- Full test suite
- Detailed checklist

**Example Workflow:**
```
/spec/init → /spec/refine → /spec/plan (detailed) → /task/start → /task/validate (comprehensive)
```

### Enterprise Projects (> 1000 files, > 200 dependencies)

**Spec Structure:**
- Enterprise spec structure (multiple levels, comprehensive docs)
- Full documentation suite
- Architecture documentation
- Design system and infrastructure required

**Planning:**
- Complex planning (programs, epics, milestones, tasks)
- 7+ milestones
- Very detailed task breakdown
- Comprehensive acceptance criteria

**Validation:**
- Full validation suite (automated, manual, integration, performance)
- Complete test coverage
- Enterprise checklist

**Example Workflow:**
```
/spec/init → /spec/refine → /spec/plan (complex) → /task/start → /task/validate (enterprise)
```

## Phase-Based Workflows

### Initialization Phase

**Characteristics:**
- New project
- Empty or initial spec
- No or minimal code

**Workflow:**
- Full spec → plan → task workflow
- Comprehensive setup
- Detailed planning

**Commands:**
- `/spec/init` - Create initial spec
- `/spec/refine` - Refine spec
- `/spec/plan` - Create detailed plan
- `/task/start` - Begin implementation

### Expansion Phase

**Characteristics:**
- Active development
- Growing spec
- Regular commits

**Workflow:**
- Spec refine → plan → task workflow
- Feature-focused
- Incremental planning

**Commands:**
- `/spec/refine` - Refine spec for new feature
- `/spec/plan` - Plan new feature
- `/task/start` - Implement feature
- `/task/validate` - Validate feature

### Maintenance Phase

**Characteristics:**
- Stable codebase
- Stable spec
- Bugfix/refactor commits

**Workflow:**
- Direct task execution
- Minimal spec changes
- Bugfix-focused

**Commands:**
- `/task/start` - Direct task execution (minimal spec changes)
- `/task/validate` - Validate fix
- `/spec/evolve` - Update spec if needed

### Migration Phase

**Characteristics:**
- Framework upgrade
- Architecture change
- Spec updates

**Workflow:**
- Spec update → plan → task workflow
- Architecture-focused
- Comprehensive planning

**Commands:**
- `/spec/refine` - Update spec for migration
- `/spec/plan` - Plan migration tasks
- `/task/start` - Execute migration
- `/task/validate` - Validate migration

### Legacy Phase

**Characteristics:**
- Existing codebase
- Old spec
- Minimal changes

**Workflow:**
- Spec audit → sync → refine workflow
- Documentation-focused
- Alignment-focused

**Commands:**
- `/spec/audit` - Audit spec compliance
- `/spec/sync` - Sync spec with code
- `/spec/refine` - Refine spec
- `/spec/evolve` - Evolve spec

## Workflow Adaptation

**In Commands:**

1. **Detect project size and phase** (from detection engine)
2. **Adapt workflow accordingly:**
   - Small projects: Simplified steps, skip non-essential
   - Medium projects: Standard steps
   - Large projects: Extended steps, more detail
   - Enterprise projects: Comprehensive steps, full detail

3. **Adapt to phase:**
   - Initialization: Full workflow
   - Expansion: Feature workflow
   - Maintenance: Direct workflow
   - Migration: Update workflow
   - Legacy: Sync workflow

**Example in /spec/plan:**

```markdown
## Adapt Planning to Project Size

**Small Projects:**
- 2-3 milestones max
- Simplified task breakdown
- Lightweight acceptance criteria

**Medium Projects:**
- 3-5 milestones
- Standard task breakdown
- Standard acceptance criteria

**Large Projects:**
- 5-7 milestones
- Detailed task breakdown
- Comprehensive acceptance criteria

**Enterprise Projects:**
- 7+ milestones
- Very detailed task breakdown
- Enterprise acceptance criteria
```

## Usage in Commands

All commands should:
1. Read project size and phase from detection
2. Adapt workflow steps accordingly
3. Show adapted workflow to user
4. Execute with appropriate level of detail

