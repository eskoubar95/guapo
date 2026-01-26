---
helper_id: command-stacks
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
---

# Command Stacks

Command stacks allow commands to invoke other commands in sequence, enabling automated workflows.

## Purpose

Command stacks provide:
- **Automated Workflows**: Execute multiple commands in sequence
- **Auto-Proceed Logic**: Optionally proceed without user confirmation between steps
- **Error Handling**: Stop on error, allow resume after fix
- **Stack Tracking**: Track progress through stack execution

## Available Command Stacks

### Full Project Initialization
**Stack:** `/spec/init` → `/spec/refine` → `/spec/plan`
**Purpose:** Complete project setup from idea to execution plan
**When to use:** New project initialization
**Auto-proceed:** Optional (ask user)
**Error handling:** Stop on error, allow resume

### Feature Development
**Stack:** `/spec/refine` → `/spec/plan` → `/task/start` → `/task/validate`
**Purpose:** Add new feature to existing project
**When to use:** Adding features to existing project
**Auto-proceed:** Optional (ask user)
**Error handling:** Stop on error, allow resume

### Task Execution
**Stack:** `/task/start` → `/task/validate`
**Purpose:** Execute and validate single task
**When to use:** Standard task execution workflow
**Auto-proceed:** Optional (ask user)
**Error handling:** Stop on error, allow resume

### Spec Evolution
**Stack:** `/spec/evolve` → `/spec/refine` → `/spec/plan`
**Purpose:** Update spec as project grows
**When to use:** Spec needs updating as project evolves
**Auto-proceed:** Optional (ask user)
**Error handling:** Stop on error, allow resume

### Legacy Project Onboarding
**Stack:** `/spec/audit` → `/spec/sync` → `/spec/refine`
**Purpose:** Onboard existing codebase into SDD
**When to use:** Working with legacy/existing codebase
**Auto-proceed:** Optional (ask user)
**Error handling:** Stop on error, allow resume

## Stack Execution

**Stack Invocation:**
Commands can invoke stacks using:
```markdown
**Command Stack:** /spec/init → /spec/refine → /spec/plan
**Auto-proceed:** [Yes | No]
```

**Execution Flow:**
1. Execute first command in stack
2. Wait for completion (or auto-proceed if enabled)
3. Execute next command in stack
4. Continue until all commands complete
5. Stop on error (report issue, allow resume)

**Error Handling:**
- If command fails → stop stack execution
- Report error clearly
- Allow user to fix issue
- Resume from failed command with same stack

**Progress Tracking:**
- Track which command is executing
- Show progress (e.g., "Step 2 of 4")
- Allow user to skip remaining steps
- Allow user to cancel stack

## Auto-Proceed Logic

**When Auto-Proceed is Enabled:**
- Commands execute in sequence
- No user confirmation between steps
- Stop only on errors
- Report completion at end

**When Auto-Proceed is Disabled:**
- Ask user before each step
- Wait for confirmation
- Allow user to skip steps
- Allow user to cancel stack

## Stack Definition Format

Stacks are defined in this file with:
- Stack name
- Command sequence
- Purpose
- When to use
- Auto-proceed default
- Error handling strategy

## Usage in Commands

Commands can:
- Invoke stacks at the end (suggest next steps)
- Invoke stacks at the beginning (pre-workflow)
- Invoke stacks conditionally (based on detection results)
- Allow user to choose stack or single command

