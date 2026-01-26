---
helper_id: verification-checkpoints
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
---

# Verification Checkpoints

Verification checkpoints provide safety gates before creating or modifying critical files.

## Purpose

Verification checkpoints ensure:
- **File Safety**: Prevent accidental overwrites or incorrect file creation
- **Path Correctness**: Verify directory structure and file naming
- **Content Alignment**: Ensure content matches command purpose
- **User Control**: Give user explicit control over critical file operations

## Critical Files

The following files are considered critical and require verification checkpoints:

- `spec/00-root-spec.md` - Root specification (project foundation)
- `work/backlog/tasks.local.md` - Task definitions (execution plan)
- `work/backlog/milestones.md` - Milestone definitions (project structure)
- `spec/tasks/[task-id]/spec.md` - Task-level specifications (if created)
- `spec/tasks/[task-id]/acceptance.md` - Task-level acceptance criteria (if created)

## Checkpoint Protocol

**Before creating or modifying a critical file, verify:**

1. **File Existence Check:**
   - Check if file already exists
   - If exists → ask: "File exists. Overwrite, append, or skip?"
   - Wait for user decision before proceeding

2. **File Path Verification:**
   - Verify directory structure exists (create if needed)
   - Verify file naming matches convention
   - Verify file path is correct relative to project root

3. **Content Alignment:**
   - Verify content matches command purpose
   - Verify no conflicting information with existing files
   - Verify content aligns with project-level spec (if applicable)

4. **User Confirmation:**
   - For critical files → ask: "Ready to create [file]?"
   - Wait for explicit confirmation
   - For non-critical files → proceed if safe

## Checkpoint Format

```markdown
## Verification Checkpoint (Before File Creation)

**Before creating [critical file], verify:**

1. **File doesn't exist:**
   - Check if `[file path]` exists
   - If exists → ask: "File exists. Overwrite, append, or skip?"
   - Wait for user decision

2. **File path is correct:**
   - Verify directory structure exists: `[directory path]`
   - Verify file naming matches convention: `[naming pattern]`
   - Create directory if needed

3. **Content aligns with command purpose:**
   - Verify content matches command purpose: [purpose]
   - Verify no conflicting information
   - Verify alignment with project-level spec (if applicable)

4. **User confirmation:**
   - Ask: "Ready to create [file]?"
   - Wait for confirmation before proceeding
```

## Usage in Commands

Commands that create or modify critical files must:
1. Run verification checkpoint before file operation
2. Wait for user confirmation if file exists
3. Verify path and content alignment
4. Proceed only after verification passes

## Examples

**Example 1: Creating Root Spec**
```markdown
## Verification Checkpoint (Before File Creation)

**Before creating spec/00-root-spec.md, verify:**

1. **File doesn't exist:**
   - Check if `spec/00-root-spec.md` exists
   - If exists → ask: "File exists. Overwrite, append, or skip?"

2. **File path is correct:**
   - Verify `spec/` directory exists
   - Verify file naming: `00-root-spec.md`

3. **Content aligns with command purpose:**
   - Verify content matches /spec/init purpose: Create initial root specification
   - Verify no conflicting information

4. **User confirmation:**
   - Ask: "Ready to create spec/00-root-spec.md?"
   - Wait for confirmation
```

**Example 2: Creating Tasks File**
```markdown
## Verification Checkpoint (Before File Creation)

**Before creating work/backlog/tasks.local.md, verify:**

1. **File doesn't exist:**
   - Check if `work/backlog/tasks.local.md` exists
   - If exists → ask: "File exists. Overwrite, append, or skip?"

2. **File path is correct:**
   - Verify `work/backlog/` directory exists (create if needed)
   - Verify file naming: `tasks.local.md`

3. **Content aligns with command purpose:**
   - Verify content matches /spec/plan purpose: Create task definitions
   - Verify tasks are traceable to spec

4. **User confirmation:**
   - Ask: "Ready to create work/backlog/tasks.local.md?"
   - Wait for confirmation
```

