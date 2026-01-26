---
helper_id: github-workflows
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
---

# GitHub Actions Workflow Generation

This helper provides logic for dynamically generating GitHub Actions workflows based on project complexity (hybrid: size + type).

## Purpose

Generate appropriate CI/CD workflows for projects based on:
- **Project size:** small, medium, large, enterprise
- **Project type:** web-app, api-service, cli-tool, library, mobile-app, monorepo
- **Hybrid logic:** Both size and type determine workflow complexity

## Workflow Generation Logic

### Decision Matrix

**No workflows:**
- Small + basic website (web-app with minimal complexity)
- Small + static site
- Small + simple landing page

**Basic workflows (ci.yml):**
- Medium+ web-app (with tests, linting)
- Medium+ api-service (with tests, linting)
- Small web-app with complex features (if explicitly needed)

**Advanced workflows (ci.yml + pr-checks.yml):**
- Large web-app/api-service
- Medium+ with complex testing requirements
- Projects with multiple environments

**Full workflows (ci.yml + deploy.yml + pr-checks.yml):**
- Enterprise projects
- Large projects with deployment requirements
- Projects with multiple deployment environments

## Workflow Types

### 1. CI Workflow (`ci.yml`)

**Basic CI (medium+):**
- Run tests
- Run linting
- Type checking (if TypeScript)
- Build verification

**Advanced CI (large/enterprise):**
- All basic CI steps
- Code coverage reports
- Security scanning
- Performance testing (if applicable)

### 2. PR Checks Workflow (`pr-checks.yml`)

**For medium+ projects:**
- PR-specific checks
- Branch protection rules
- Required status checks
- Code review reminders

### 3. Deploy Workflow (`deploy.yml`)

**For large/enterprise with deployment:**
- Deployment to staging
- Deployment to production
- Environment-specific configurations
- Rollback capabilities

## Framework Detection

**Detect framework from:**
1. Tech stack in `spec/08-infrastructure.md` or `spec/02-architecture.md`
2. `package.json` dependencies
3. Config files (next.config.js, vite.config.js, etc.)

**Framework-specific adaptations:**
- **Next.js:** Use Next.js build commands, handle App Router vs Pages Router
- **Vite:** Use Vite build commands
- **Python:** Use pytest, black, mypy
- **Node.js:** Use npm/pnpm/yarn commands
- **Rust:** Use cargo commands
- **Go:** Use go test, go build

## Workflow Generation Process

### Step 1: Read Project Complexity

1. **Run detection:**
   - Use detection system (see `_shared/detection.md`)
   - Read project type, size, phase, technologies
   - Read from `.sdd/detection-cache.json` if valid

2. **Read deployment requirements:**
   - Check `spec/08-infrastructure.md` for deployment configuration
   - Check if deployment is defined (Railway, Vercel, AWS, etc.)

### Step 2: Determine Workflow Needs

**Decision logic:**
1. **Small + basic website:** Skip workflow generation
2. **Medium+ web-app/api:** Generate `ci.yml`
3. **Large/Enterprise:** Generate `ci.yml` + `pr-checks.yml`
4. **Large/Enterprise + deployment:** Generate all workflows including `deploy.yml`

### Step 3: Generate Workflow Files

**Template selection:**
- Use framework-agnostic templates
- Adapt commands based on detected framework
- Use package manager from detection (npm, pnpm, yarn)

**File structure:**
```
.github/
  workflows/
    ci.yml
    pr-checks.yml (if needed)
    deploy.yml (if needed)
```

## Workflow Templates

### CI Basic Template

```yaml
name: CI

on:
  push:
    # Replace with your repository's base branches (do not assume `main`).
    # Prefer the resolved default branch (see: /sdd-git-default-branch or branch-detection.md).
    branches: [<default-branch>]
  pull_request:
    branches: [<default-branch>]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm' # or 'pnpm' or 'yarn'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

**Test Execution (Framework-Agnostic):**
- Detect test framework from package.json or config files
- Run appropriate test command:
  - Jest: `npm test` or `jest`
  - Vitest: `npm test` or `vitest run`
  - Playwright: `npx playwright test`
  - Cypress: `npx cypress run`
  - pytest: `pytest` (Python)
  - Other: Use project's test script
- Collect test coverage (if framework supports)
- Report test results
- Fail workflow if tests fail (configurable)
```

### CI Advanced Template

```yaml
name: CI

on:
  push:
    branches: [<default-branch>]
  pull_request:
    branches: [<default-branch>]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run type-check
      - run: npm run build
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

**Test Execution with Coverage:**
- Detect test framework automatically
- Run tests with coverage flag:
  - Jest: `npm test -- --coverage`
  - Vitest: `npm test -- --coverage`
  - pytest: `pytest --cov` (Python)
- Upload coverage to codecov or similar service
- Report coverage in PR comments (if configured)
```

### PR Checks Template

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check PR description
        run: |
          if [ -z "${{ github.event.pull_request.body }}" ]; then
            echo "PR description is empty"
            exit 1
          fi
      - name: Check for breaking changes
        run: |
          # Add custom checks here
```

### Deploy Template (Framework-Agnostic)

```yaml
name: Deploy

on:
  push:
    branches: [<default-branch>]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          # Framework-specific deployment commands
          # Adapt based on detected framework
```

## Framework-Specific Adaptations

### Next.js

```yaml
- run: npm run build
  env:
    NEXT_PUBLIC_ENV: production
```

### Vite

```yaml
- run: npm run build
```

### Python

```yaml
- uses: actions/setup-python@v4
  with:
    python-version: '3.11'
- run: pip install -r requirements.txt
- run: pytest
- run: black --check .
- run: mypy .
```

### Node.js (Generic)

```yaml
- run: npm ci
- run: npm run lint
- run: npm run test
- run: npm run build
```

## Integration Points

### In `/spec/plan`:

**After milestones created:**
1. Check if workflows needed (based on complexity)
2. If needed → generate workflows via this helper
3. Ask user for confirmation before generating
4. Create `.github/workflows/` directory if needed
5. Generate workflow files

**User confirmation prompt:**
"GitHub Actions workflows are recommended for this project. Generate workflows? (y/n)"

### In `/spec/refine`:

**If project complexity changes:**
1. Check if workflows need updating
2. If complexity increased → suggest adding workflows
3. If complexity decreased → suggest removing workflows (optional)
4. Ask user for confirmation

## Error Handling

- **Detection fails:** Use conservative defaults (medium complexity)
- **Framework not detected:** Use generic Node.js/Python templates
- **Workflow generation fails:** Report to user, continue without blocking
- **User declines:** Skip workflow generation, continue workflow

## Best Practices

1. **Framework-agnostic:** Use generic templates, adapt commands
2. **Progressive enhancement:** Start with basic, add advanced as needed
3. **User confirmation:** Always ask before generating workflows
4. **Don't block workflow:** If generation fails, continue without workflows
5. **Documentation:** Reference workflow files in `spec/08-infrastructure.md`

## Examples

### Small Basic Website
- **Result:** No workflows generated
- **Reason:** Small + basic website = minimal CI needs

### Medium Next.js Web App
- **Result:** `ci.yml` with Next.js-specific commands
- **Includes:** Tests, linting, type checking, build

### Large Enterprise API Service
- **Result:** `ci.yml` + `pr-checks.yml` + `deploy.yml`
- **Includes:** Full CI/CD pipeline with deployment

