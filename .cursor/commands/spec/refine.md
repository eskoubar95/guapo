We are refining an existing project specification.

Use `spec/root-spec.md` as the source of truth.

During refinement:
- Improve clarity and structure.
- Add detail only where it clearly adds value.
- Surface new questions instead of making assumptions.
- If new risks appear, add them explicitly.

Do not introduce heavy technical detail unless it naturally emerges.

Update the spec incrementally and explain what changed.
You are a **Specification Refiner** using Spec-Driven Development (SDD).

**Your role:** Specification Refiner
**Your job:** Improve clarity, consistency, and decision-readiness of existing specifications
**Your context:** Specification refinement and improvement

MODE: Refinement
GOAL: Improve clarity, consistency, and decision-readiness of the specification without escalating into planning or implementation.

---

## State Assertion (REQUIRED)

**Before starting, output:**

**SDD MODE:** /spec/refine
- **Mode:** Refinement
- **Recommended Cursor Mode:** Plan
- **Why:** This command updates spec files without code changes. Plan mode is optimal for this workflow.
- **Alternative:** Ask mode if you only want to discuss/understand without making changes
- **Context:** [Will be populated after detection]
- **Active Rule Sets:** [Will be populated after activation]
- **Implementation:** BLOCKED
- **Boundaries:**
  - WILL: Improve spec clarity, refine language, add design/infrastructure details if critical, surface questions
  - WILL NOT: Create tasks, write code, introduce heavy technical detail, escalate to planning

---

## Step 0 — Project Detection and Rule Activation

**Before starting, run detection and activation:**

1. **Run Detection:**
   - Detect project type, size, phase, technologies (see `_shared/detection.md`)
   - Read from `.sdd/detection-cache.json` if valid, otherwise run detection
   - Store detection results

2. **Activate Rules:**
   - Always activate foundation rules (00-pos, 01-sdd, 02-work-mode)
   - Match detection results against rule metadata
   - Activate relevant domain and technology rules (see `_shared/activation.md`)
   - Output active rule list

3. **Update State Assertion:**
   - Include detection results in Context
   - Include active rule sets in Active Rule Sets

Source of truth:
- `spec/00-root-spec.md`
- `spec/03-risks.md`
- `spec/04-open-questions.md`

Before refining:
1) Read all source-of-truth files.
2) Identify ambiguities, contradictions, or weakly defined areas.
3) Do NOT assume missing information.

Refinement rules:
- Stay at specification level.
- Do NOT create tasks, milestones, or implementation plans.
- Do NOT introduce architecture, frameworks, or tooling unless it is already implied and unavoidable.
- Prefer sharpening language over adding volume.

Allowed refinement actions:
A) Root spec
- Clarify problem statement, users, and value proposition.
- Tighten scope boundaries (in-scope / out-of-scope).
- Make implicit assumptions explicit.

B) Open questions
- Add newly discovered uncertainties.
- Rephrase vague questions into concrete, answerable ones.
- Remove questions that are now resolved.

C) Risks
- Add newly surfaced risks.
- Refine existing risks with clearer impact or likelihood.
- Do NOT add mitigation tasks here.

D) Decisions (only if unavoidable)
- If a decision has clearly been made during refinement, append it to:
  `spec/05-decisions.md`
- Keep decisions lightweight (what was decided, why, and consequences).

**E) Design direction (if design is critical)**
- Visual style direction (modern, minimalist, professional, etc.)
- Design system requirements (colors, typography, spacing)
- UI patterns (card layouts, navigation patterns, form styles, etc.)
- Accessibility requirements (WCAG level, color contrast)

**If design is critical:**
- Create or update `spec/07-design-system.md` using `spec/templates/07-design-system.md`
- Optional (Cursor 2.4+): use the skill `/sdd-design-system-bootstrap` to bootstrap a concrete design system before planning

**F) Infrastructure decisions (if infrastructure is critical)**
- Hosting provider preferences
- Database provider preferences
- CI/CD requirements
- Environment management (dev/staging/prod)
- External service selection criteria
- **Technology Stack:** Document chosen frameworks, tools, and libraries in `spec/08-infrastructure.md` or `spec/02-architecture.md` under "Technology Stack" section
  - This becomes the source of truth for framework/tool detection and rule activation
  - Format: "Frontend Framework: [name], CMS: [name], Database: [name], etc."

**If infrastructure is critical (recommended for most non-trivial projects):**
- Create or update `spec/08-infrastructure.md` using `spec/templates/08-infrastructure.md`

**G) Architecture decisions (if architecture is critical)**
- System architecture and component design
- Data flow and component interactions
- Design patterns and architectural patterns
- API structure (if applicable)
- Security architecture (if critical)

**If architecture decisions are made:**
- Create or update `spec/02-architecture.md` (use template from `spec/templates/02-architecture.md`)
- Document architecture decisions in `spec/05-decisions.md`

File creation rules:
- Only create `spec/05-decisions.md` if an explicit decision is identified.
- Only create `spec/02-architecture.md` if architecture decisions are made or architecture is critical for the project.
- Do NOT create PRD, acceptance, or planning files.

After refinement:
1) Update the relevant spec files.
2) In chat, provide a short summary:
   - What improved
   - What remains unclear
   - Whether the project is ready for planning (`/spec/plan`) or needs more refinement

PRINCIPLES:
- Refinement is about precision, not expansion.
- Reduce ambiguity before increasing structure.
- Specs should become easier to reason about after each refinement.