---
helper_id: state-assertions
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
---

# State Assertions

State assertions provide explicit mode, boundaries, and context before each command executes.

## Purpose

State assertions ensure:
- **Explicit Mode**: Clear understanding of current mode
- **Clear Boundaries**: What will and won't be done
- **Context Awareness**: Detection results and active rules
- **Implementation Status**: Whether code changes are allowed

## State Assertion Template

**Before starting any command, output:**

```markdown
## State Assertion (REQUIRED)

**SDD MODE:** [Command Name]
- **Mode:** [Research/Ideation | Refinement | Planning | Execution | Validation]
- **Recommended Cursor Mode:** [Plan | Ask | Agent | Debug]
- **Why:** [Explanation of why this mode fits this command]
- **Alternative:** [Alternative modes if applicable]
- **Context:** [Detected context from activation system]
- **Active Rule Sets:** 
  - Foundation: [List foundation rules]
  - Domain: [List domain rules]
  - Technology: [List technology rules]
- **Implementation:** [BLOCKED | AUTHORIZED]
- **Boundaries:**
  - WILL: [What will be done]
  - WILL NOT: [What will not be done]
```

## Mode Definitions

**Research/Ideation:**
- Understanding and exploration
- No code changes
- No spec changes (except initial creation)
- Focus on questions and clarification

**Refinement:**
- Improving existing specifications
- No code changes
- Spec updates only
- Focus on clarity and precision

**Planning:**
- Creating execution plans
- No code changes
- Creating tasks and milestones
- Focus on structure and traceability

**Execution:**
- Implementing code
- Code changes allowed
- Following spec and plan
- Focus on correctness and scope

**Validation:**
- Verifying completion
- No new code changes (only fixes)
- Testing and evidence gathering
- Focus on quality and completeness

## Context from Detection

Include detection results in state assertion:
- Project type (web-app, cli-tool, etc.)
- Project size (small, medium, large, enterprise)
- Project phase (initialization, expansion, etc.)
- Technologies (nextjs, postgres, etc.)

## Active Rule Sets

List all active rules organized by category:
- **Foundation:** Always active rules
- **Domain:** Context-based rules (engineering, design, business)
- **Technology:** Auto-activated rules (nextjs, api-design, database, etc.)

## Implementation Status

**BLOCKED:**
- No code changes allowed
- Spec/planning mode
- Research/ideation mode

**AUTHORIZED:**
- Code changes allowed
- Execution mode
- After explicit confirmation

## Boundaries

**WILL:**
- List what the command will do
- Be specific and concrete
- Include detection-based adaptations

**WILL NOT:**
- List what the command will not do
- Explicitly exclude out-of-scope actions
- Prevent scope creep

## Cursor Mode Recommendations

**Recommended Cursor Modes by Command Type:**

- **Spec commands** (init, refine, plan, evolve, sync): **Plan mode** - Creates/updates spec files without code changes
- **Spec audit:** **Debug mode** - For runtime evidence and debugging, **Plan mode** as alternative for static analysis
- **Task start:** **Agent mode** - For code changes and implementation, **Plan mode** as alternative for planning only
- **Task validate:** **Debug mode** - For debugging issues, **Plan mode** as alternative for validation only

**Why Cursor Mode Matters:**
- **Plan mode:** Optimal for spec/planning work, no code changes
- **Ask mode:** Read-only exploration and understanding
- **Agent mode:** Full code changes and implementation
- **Debug mode:** Runtime analysis, debugging, and evidence gathering

## Self-Correction Protocol

**Common Mistakes to Detect:**

1. **Mode Mixing:**
   - DETECT: Suggesting code during spec mode, or introducing spec concerns during task mode
   - CORRECT: "I apologize - I was [mixing modes]. Let me return to [correct mode]."
   - EXAMPLE: During /spec/init, if suggesting implementation → "I apologize - I was introducing execution concerns. Let me return to specification mode."

2. **Scope Creep:**
   - DETECT: Adding features not in spec, expanding beyond defined boundaries
   - CORRECT: "I apologize - I was expanding scope. Let me return to the defined scope."
   - EXAMPLE: During /task/start, if adding features not in task → "I apologize - I was expanding scope beyond the task definition. Let me return to the defined task scope."

3. **Assumption Making:**
   - DETECT: Guessing instead of asking, making assumptions not in spec
   - CORRECT: "I apologize - I was making assumptions. Let me ask for clarification."
   - EXAMPLE: During /spec/init, if guessing user preferences → "I apologize - I was making assumptions about [assumption]. Let me ask for clarification."

4. **Skipping Validation:**
   - DETECT: Skipping validation steps, proceeding without acceptance criteria
   - CORRECT: "I apologize - I was skipping validation. Let me return to validation steps."
   - EXAMPLE: During /task/validate, if skipping checks → "I apologize - I was skipping validation steps. Let me return to the validation checklist."

**Protocol:**
1. **DETECT:** Recognize the mistake immediately
2. **STOP:** Immediately halt execution
3. **CORRECT:** Acknowledge mistake explicitly with specific correction
4. **RESUME:** Continue correctly from point of error

## Usage in Commands

All commands must:
1. Output state assertion before starting
2. Include detection results
3. Include active rule sets
4. Explicitly state boundaries
5. Follow self-correction protocol if violated

