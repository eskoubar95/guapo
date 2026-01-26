# Helper Metadata System

This document defines metadata for all helper files to enable smart, conditional loading and reduce token consumption.

## Purpose

Enable AI to:
- Load helpers only when conditions are met
- Read only relevant sections of large helpers
- Understand when each helper is needed
- Reduce unnecessary token consumption

## Metadata Format

Each helper should have YAML frontmatter with:
- `helper_id`: Unique identifier
- `load_when`: Conditions that trigger loading
- `sections`: Map of section IDs to titles and line ranges
- `dependencies`: List of helper IDs that this helper depends on (optional)
- `always_load`: Whether helper should always be loaded (default: false)

## Helper Registry

### test-automation.md

```yaml
helper_id: test-automation
file: test-automation.md
load_when:
  - test_framework_detected
  - validation_step
  - refactoring_analysis
sections:
  detection:
    title: "Test Framework Detection"
    lines: [39, 67]
  execution:
    title: "Test Execution"
    lines: [68, 154]
  coverage:
    title: "Test Coverage Tracking"
    lines: [180, 207]
  failure_detection:
    title: "Test Failure Detection"
    lines: [233, 247]
  generation:
    title: "Test Generation Assistance"
    lines: [273, 273]
always_load: false
```

### performance-monitoring.md

```yaml
helper_id: performance-monitoring
file: performance-monitoring.md
load_when:
  - preview_url_available
  - performance_enabled
  - validation_step
  - refactoring_analysis
sections:
  metrics:
    title: "Performance Metrics Collection"
    lines: [37, 80]
  tools:
    title: "Monitoring Tools Integration"
    lines: [104, 146]
  regression:
    title: "Performance Regression Detection"
    lines: [170, 180]
  lighthouse:
    title: "Lighthouse Integration"
    lines: [222, 250]
always_load: false
```

### deployment-detection.md

```yaml
helper_id: deployment-detection
file: deployment-detection.md
load_when:
  - pr_created
  - pr_updated
  - validation_step
sections:
  detection:
    title: "Provider Detection"
    lines: [32, 91]
  preview:
    title: "Preview Deployment Logic"
    lines: [111, 194]
  status:
    title: "Deployment Status Checking"
    lines: [214, 217]
always_load: false
```

### linear-automation.md

```yaml
helper_id: linear-automation
file: linear-automation.md
load_when:
  - linear_mode_enabled
  - spec_init
  - spec_refine
  - spec_plan
  - task_start
  - task_validate
dependencies:
  - linear-helpers
sections:
  detection:
    title: "Detection Logic"
    lines: [9, 32]
  documents:
    title: "Documents"
    lines: [35, 80]
  issues:
    title: "Issues"
    lines: [82, 130]
  projects:
    title: "Projects"
    lines: [132, 180]
  labels:
    title: "Labels"
    lines: [182, 220]
  statuses:
    title: "Statuses"
    lines: [222, 260]
always_load: false
```

### linear-helpers.md

```yaml
helper_id: linear-helpers
file: linear-helpers.md
load_when:
  - linear_mode_enabled
  - linear_operation_needed
sections:
  status_mapping:
    title: "Status Mapping"
    lines: [1, 50]
  label_detection:
    title: "Label Detection"
    lines: [51, 100]
  idempotency:
    title: "Idempotency Checks"
    lines: [101, 150]
always_load: false
```

### branch-detection.md

```yaml
helper_id: branch-detection
file: branch-detection.md
load_when:
  - task_start
  - task_validate
  - pr_creation_needed
  - git_operation_needed
sections:
  detection:
    title: "Default Branch Detection"
    lines: [1, 140]
  usage:
    title: "Usage in Commands"
    lines: [141, 220]
always_load: false
```

### git-workflow.md

```yaml
helper_id: git-workflow
file: git-workflow.md
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
```

### pr-description.md

```yaml
helper_id: pr-description
file: pr-description.md
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
```

### documentation-lookup.md

```yaml
helper_id: documentation-lookup
file: documentation-lookup.md
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
```

### coderabbit-integration.md

```yaml
helper_id: coderabbit-integration
file: coderabbit-integration.md
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
```

### github-helpers.md

```yaml
helper_id: github-helpers
file: github-helpers.md
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
```

### github-workflows.md

```yaml
helper_id: github-workflows
file: github-workflows.md
load_when:
  - spec_plan
  - spec_refine
  - ci_cd_needed
sections:
  detection:
    title: "Workflow Detection"
    lines: [1, 50]
  generation:
    title: "Workflow Generation"
    lines: [51, 200]
  templates:
    title: "Workflow Templates"
    lines: [201, 300]
always_load: false
```

### detection.md

```yaml
helper_id: detection
file: detection.md
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
```

### activation.md

```yaml
helper_id: activation
file: activation.md
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
```

### scaling.md

```yaml
helper_id: scaling
file: scaling.md
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
```

### state-assertions.md

```yaml
helper_id: state-assertions
file: state-assertions.md
load_when:
  - always
sections:
  mode_boundaries:
    title: "Mode Boundaries"
    lines: [1, 50]
  state_checks:
    title: "State Checks"
    lines: [51, 100]
always_load: true
```

### verification-checkpoints.md

```yaml
helper_id: verification-checkpoints
file: verification-checkpoints.md
load_when:
  - file_creation
  - file_modification
  - critical_operation
sections:
  gates:
    title: "Verification Gates"
    lines: [1, 50]
  critical_files:
    title: "Critical Files"
    lines: [51, 100]
always_load: false
```

### command-stacks.md

```yaml
helper_id: command-stacks
file: command-stacks.md
load_when:
  - command_invocation
  - workflow_automation
sections:
  invocation:
    title: "Command Invocation"
    lines: [1, 50]
  stacks:
    title: "Command Stacks"
    lines: [51, 100]
always_load: false
```

### retrospective-spec-creation.md

```yaml
helper_id: retrospective-spec-creation
file: retrospective-spec-creation.md
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
```

## Usage Instructions

### For Commands

When referencing a helper in a command:

**Instead of:**
```markdown
**Reference:** See `.cursor/commands/_shared/test-automation.md` for test framework detection.
```

**Use:**
```markdown
**ONLY READ IF test framework detected:**
- Read `.cursor/commands/_shared/test-automation.md` ONLY IF test framework detected in Step 0
- Read sections: "Test Framework Detection" (lines 14-67), "Test Execution" (lines 68-154)
- Skip if: No test framework found → skip test automation entirely
- Check condition: Run detection first, then read helper only if condition met
```

### For AI Agents

1. **Check load_when conditions** before reading any helper
2. **Read only specified sections** if condition is met
3. **Skip helper entirely** if condition is not met
4. **Always load** helpers marked with `always_load: true` (detection, activation, state-assertions)

### Condition Examples

- `test_framework_detected`: Test framework found in package.json or config
- `linear_mode_enabled`: `work/linear/sync-config.md` exists and `MODE=linear`
- `pr_exists`: PR exists for current branch
- `validation_step`: Currently in validation phase
- `framework_detected`: Framework detected in tech stack
- `always`: Always load (for core helpers)

## Cache Strategy

Helper metadata is static and can be cached. If metadata changes, invalidate cache.

## Error Handling

- **Metadata missing:** Fallback to reading entire helper (safe default)
- **Condition unclear:** Read helper (safe fallback)
- **Section not found:** Read entire helper
- **Never block workflow:** All optimizations are optional

