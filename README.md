# Project Name

This project uses Spec-Driven Development (SDD) with the Project Operating System (POS).

## Getting Started

1. Open this project in Cursor
2. Run `/spec/init` to begin defining your project specification
3. Follow the SDD workflow: spec → plan → task → validate

## Workflow

```txt
/spec/init
/spec/refine   (optional, repeatable)
/spec/plan
/task/start
[work]
/task/validate
```

## Project Structure

- `spec/` - Source of truth (specifications)
- `work/` - Execution artifacts (milestones, tasks)
- `.cursor/` - POS rules and commands

For more information, see the POS documentation in `.cursor/rules/`.

