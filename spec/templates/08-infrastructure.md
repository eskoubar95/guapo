# Infrastructure

## Technology Stack

Document the technologies, frameworks, and tools used in this project. This is the source of truth for framework/tool detection and rule activation.

**Format:**
- Frontend Framework: [Framework name, e.g., Next.js, Vite, React]
- Backend Framework: [Framework name, e.g., Express, FastAPI, Flask]
- CMS: [CMS name, e.g., Payload CMS, Strapi]
- Database: [Database name, e.g., PostgreSQL, MongoDB]
- Build Tool: [Build tool name, e.g., Vite, Webpack]
- Language: [Language name, e.g., TypeScript, Python]
- Other: [List other tools/libraries]

**Example:**
- Frontend Framework: Next.js
- CMS: Payload CMS
- Database: PostgreSQL
- Build Tool: Vite (for admin)
- Language: TypeScript

## Monorepo / Workspaces (if applicable)

If this repository is a **monorepo**, document the workspace boundaries explicitly so tasks, validation, and rules can be scoped correctly.

**Workspace map (recommended):**

- Workspace: [path, e.g., `apps/storefront`]
  - Frontend Framework: [e.g., Next.js]
  - Language: [e.g., TypeScript]
  - Build Tool: [e.g., pnpm / npm / yarn]
  - Notes: [scripts, deployment target, env vars]

- Workspace: [path, e.g., `apps/backend`]
  - Backend Framework: [e.g., Medusa / FastAPI]
  - Language: [e.g., TypeScript / Python]
  - Notes: [DB, services, migrations]

## Hosting
- Provider: [Provider name]
- Region: [Region]
- Pricing: [Free tier/Paid/etc.]
- URL: [production URL]

## Database
- Provider: [Provider name]
- Type: [PostgreSQL/MySQL/MongoDB/etc.]
- Connection: [Managed/Self-hosted/etc.]
- Pricing: [Free tier/Paid/etc.]

## External Services
- Newsletter: [Platform name, API quality, pricing, webhook support]
- Analytics: [Platform name]
- Payment: [Platform name]
- Other: [list]

## CI/CD
- Provider: [Provider name, e.g., GitHub Actions, CircleCI, GitLab CI]
- Deployment strategy: [Automatic/Manual/etc.]
- Branch strategy: [main only/main + staging/etc.]

## GitHub Actions (if using GitHub)
- Workflows: [List workflow files, e.g., ci.yml, deploy.yml, pr-checks.yml]
- CI checks: [List checks, e.g., tests, linting, type checking, build]
- Deployment: [Describe deployment workflow if applicable]
- PR requirements: [List required PR checks, e.g., tests passing, code review]

## Environment Variables
- Required: [list of required env vars]
- Secrets: [list of secret env vars]
- Optional: [list of optional env vars]

## Known Issues
- [List any known infrastructure issues or limitations]

