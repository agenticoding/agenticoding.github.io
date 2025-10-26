---
sidebar_position: 1
sidebar_label: 'Lesson 6: Project Onboarding'
---

# Lesson 6: Project Onboarding

When you join a new project, the first week is brutal. You're swimming in unfamiliar architecture, tech stack decisions, tribal knowledge buried in Slack threads, and that one critical bash script everyone runs but nobody documented.

AI agents face the same problem - except they don't have the luxury of osmosis. They see exactly what's in their context window (~200K tokens) and nothing more. No memory of yesterday's conversation. No understanding of "how we do things around here."

**The solution: Codify your project context in machine-readable files.**

This lesson covers context files (CLAUDE.md, AGENTS.md, .cursorrules, etc.) - the onboarding docs that transform your AI agent from a generic code generator into a project-aware operator.

## Learning Objectives

By the end of this lesson, you'll be able to:

- **Design context files** that encode project-specific knowledge for AI agents
- **Structure documentation** across hierarchy levels (global, repo, directory-specific)
- **Automate context creation** using agents to bootstrap their own configuration
- **Evaluate trade-offs** between comprehensive docs and minimal AI-specific configs

## The Context Problem

Consider what a senior engineer needs when joining a codebase:

**Architecture Understanding:**

- What's the system topology? (Microservices? Monolith? Event-driven?)
- Which services own which domains?
- How do components communicate?

**Tech Stack Context:**

- Languages, frameworks, major dependencies
- Build system, package manager, deployment tools
- Testing infrastructure (unit, integration, e2e)

**Development Workflow:**

- How to run the app locally
- How to run tests (and which ones to run when)
- Branch naming, commit conventions, PR process
- CI/CD pipeline behavior

**Tribal Knowledge:**

- "Always run migrations before tests in local dev"
- "The staging DB is flaky, retry failed connections"
- "Use ES modules, not CommonJS"
- "Never commit .env files (yes, even .env.example)"

**An AI agent needs the exact same context.** But unlike humans who can ask clarifying questions, scroll through Slack history, or read between the lines, agents need **explicit, structured documentation**.

## Context File Ecosystem

Different AI tools use different file conventions. Here's the landscape:

### Claude Code: CLAUDE.md

Claude Code reads `CLAUDE.md` files in a hierarchical system:

1. **Global**: `~/.claude/CLAUDE.md` - Personal preferences across all projects
2. **Repository root**: `/path/to/project/CLAUDE.md` - Project-wide context
3. **Subdirectories**: `/path/to/project/backend/CLAUDE.md` - Component-specific rules

**Precedence:** More specific files override general ones. Subdirectory rules augment (not replace) repository rules.

**Example hierarchy:**

```
~/.claude/CLAUDE.md              # "I prefer minimalist code, run tests after changes"
/work/ecommerce/CLAUDE.md        # "This is a TypeScript monorepo using pnpm"
/work/ecommerce/api/CLAUDE.md    # "API uses Fastify, not Express - match patterns"
```

When working in `/work/ecommerce/api`, Claude Code merges all three contexts.

### Cursor: .cursorrules and .mdc Files

Cursor uses `.cursorrules` (legacy) and `.mdc` files with frontmatter:

```markdown
---
description: 'Rules for React components'
globs: ['src/components/**/*.tsx', 'src/components/**/*.jsx']
alwaysApply: false
---

# React Component Rules

- Use functional components with hooks
- Prefer composition over inheritance
- Extract custom hooks when logic is reused 3+ times
```

**Rule application logic:**

- `alwaysApply: true` - Always injected into context
- `alwaysApply: false` - Added if file matches glob OR agent chooses based on description

Cursor also has `.cursor/rules/` directory for monorepo organization.

### Proposed Standard: AGENTS.md

Some engineers advocate for vendor-neutral `AGENTS.md` as a unified standard across tools (Copilot, Claude, Cursor, Continue, etc.).

**Philosophy:** Keep AI-specific configs minimal. Put 90% of context in your README and project docs. Use AGENTS.md only for operational details:

- CI/CD tool integration (environment variables, test commands)
- Non-interactive execution warnings ("tests require Docker daemon")
- MCP (Model Context Protocol) server configurations
- Tool-specific overrides

**Why minimal?** Security. The more comprehensive your AI config, the larger the attack surface for "Rules File Backdoor" attacks (malicious instructions injected into context files).

## Anatomy of a Good CLAUDE.md

Let's dissect a production-quality context file for a fictional e-commerce backend.

### Example: E-Commerce API CLAUDE.md

````markdown
# E-Commerce API - Project Context

## Project Overview

**Purpose:** RESTful API for e-commerce platform with 500K daily active users

**Architecture:** Microservices (API Gateway → 6 backend services)

- User Service (auth, profiles)
- Product Catalog (search, inventory)
- Cart Service (session management)
- Order Service (checkout, fulfillment)
- Payment Service (Stripe integration)
- Notification Service (email, SMS via SNS)

**Tech Stack:**

- Runtime: Node.js 20 LTS
- Framework: Fastify 4.x (NOT Express)
- Database: PostgreSQL 15 (primary), Redis (caching/sessions)
- Message Queue: AWS SQS for async workflows
- Testing: Vitest (unit), Playwright (e2e)
- Deployment: ECS Fargate, deployed via CDK

## Development Commands

```bash
# Setup
pnpm install                     # Install dependencies (NOT npm)
pnpm run db:migrate              # Run Postgres migrations
pnpm run db:seed                 # Seed test data

# Development
pnpm dev                         # Start all services (uses Docker Compose)
pnpm dev --service=user          # Start single service

# Testing
pnpm test                        # Unit tests (Vitest)
pnpm test:e2e                    # E2E tests (requires Docker)
pnpm test:coverage               # Generate coverage report (must be >80%)

# Code Quality
pnpm lint                        # ESLint + Prettier
pnpm typecheck                   # TypeScript validation
```
````

## Coding Conventions

**Module System:** ES Modules only

```typescript
// YES
import { getUserById } from './users.js';

// NO
const { getUserById } = require('./users');
```

**Error Handling:** Always use structured error classes

```typescript
// YES
throw new BadRequestError('Invalid email format', { field: 'email' });

// NO
throw new Error('Invalid email');
```

**Async Patterns:** async/await, never raw Promises

```typescript
// YES
const user = await db.users.findById(id)

// NO
db.users.findById(id).then(user => ...)
```

**Testing Philosophy:**

- Unit tests: Mock external dependencies (DB, APIs)
- Integration tests: Use testcontainers for real Postgres/Redis
- E2E tests: Full Docker Compose environment

## Common Pitfalls

**Database Connections:**

- Always use connection pooling (configured in `db/pool.ts`)
- Never create ad-hoc connections with raw `pg.Client`
- Transactions MUST be wrapped in try/catch with explicit rollback

**Stripe Integration:**

- Use idempotency keys for all payment operations
- Webhook signatures MUST be verified (see `payment-service/webhooks.ts`)
- Test with Stripe CLI, not production API

**Redis Sessions:**

- TTL is 24 hours - refresh on activity
- Session keys follow pattern: `session:{userId}:{deviceId}`

## Repository Structure

```
/
├── services/                    # Microservices
│   ├── user-service/
│   ├── product-catalog/
│   ├── cart-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── packages/                    # Shared libraries
│   ├── core/                    # Common utilities
│   ├── db/                      # Database client
│   └── types/                   # Shared TypeScript types
├── infrastructure/              # CDK stacks
└── tests/                       # E2E tests
```

## Critical Constraints

- NEVER commit API keys or secrets (use AWS Secrets Manager)
- NEVER deploy to production without passing E2E tests
- NEVER modify database schema without a migration file
- ALWAYS run `pnpm typecheck` before committing
- ALWAYS use feature branches (naming: `feature/description` or `fix/description`)

## Deployment

- **Staging:** Auto-deploy on merge to `develop`
- **Production:** Manual approval required after staging validation
- **Rollback:** `pnpm run deploy:rollback` (reverts to previous ECS task definition)

## Key Files

- `packages/core/errors.ts` - Structured error classes
- `packages/db/pool.ts` - Database connection pooling
- `services/*/routes.ts` - API route definitions
- `infrastructure/lib/*-stack.ts` - CDK infrastructure as code

```

### What Makes This Good?

**Specificity:**
- Mentions Fastify explicitly (NOT Express) - prevents agent from using Express patterns
- Shows exact import style (ES Modules with `.js` extension)
- Lists actual commands engineers run

**Project Context:**
- Architecture overview (microservices, which services exist)
- Tech stack with versions
- Purpose and scale (500K DAU - implies performance matters)

**Actionable Information:**
- Common commands with explanations
- Code patterns with YES/NO examples
- Critical constraints in imperative form ("NEVER commit...")

**Key Files Reference:**
- Points to canonical implementations
- Helps agent find relevant code when making changes

## Hierarchical Organization

For monorepos or large projects, use directory-specific context files:

```

/ecommerce
├── CLAUDE.md # Project-wide: tech stack, architecture
├── services/
│ ├── CLAUDE.md # Services-specific: testing, deployment
│ ├── user-service/
│ │ └── CLAUDE.md # User service: auth patterns, DB schema
│ └── payment-service/
│ └── CLAUDE.md # Payment service: Stripe, PCI compliance
└── infrastructure/
└── CLAUDE.md # CDK patterns, AWS resource conventions

````

**When to split:**
- Different components use different languages/frameworks
- Subdirectories have unique conventions (e.g., strict PCI compliance in payment service)
- Team boundaries (different teams own different services)

**When to keep unified:**
- Consistent tech stack across codebase
- Shared conventions (everyone uses same testing patterns)
- Small projects (<10k LOC)

## Template: Minimal CLAUDE.md

For smaller projects, start minimal and expand as needed:

```markdown
# [Project Name] - Context

## Overview
[2-3 sentence description: purpose, architecture type, scale]

## Tech Stack
- Runtime/Language: [e.g., Python 3.11, Node.js 20]
- Framework: [e.g., FastAPI, React, Django]
- Database: [e.g., PostgreSQL, MongoDB]
- Key Libraries: [List 3-5 critical dependencies]

## Development Commands
```bash
# Setup
[install command]

# Run
[dev server command]

# Test
[test command]
````

## Coding Conventions

- [Convention 1]
- [Convention 2]
- [Convention 3]

## Key Files

- `[file path]` - [description]
- `[file path]` - [description]

```

**Expand with:**
- Common pitfalls (after onboarding 2-3 engineers)
- Architecture diagrams (as project grows)
- Deployment procedures (once CI/CD is set up)

## Automating Context File Creation

Here's the meta-move: **Use AI agents to bootstrap their own context files.**

### Workflow: Agent-Generated CLAUDE.md

**Step 1: Gather Information**

Prompt:
```

Analyze this codebase and extract key information for a CLAUDE.md context file:

1. Read package.json (or equivalent) to identify tech stack
2. Scan README.md for project overview and setup instructions
3. Search for test commands (package.json scripts, Makefile, justfile)
4. Identify code conventions (ES modules vs CommonJS, async patterns)
5. Locate key configuration files

Provide a structured summary.

```

**Step 2: Draft CLAUDE.md**

Prompt:
```

Using the analysis above, generate a CLAUDE.md file following this structure:

- Project Overview (2-3 sentences)
- Tech Stack (runtime, framework, database)
- Development Commands (setup, run, test)
- Key Files (3-5 most important files with descriptions)

Use concise, imperative language. Focus on what an engineer needs to be productive in the first hour.

```

**Step 3: Human Review and Augmentation**

The agent can extract objective facts (dependencies, commands, file structure). You add:
- **Tribal knowledge** ("The staging DB is flaky")
- **Critical constraints** ("NEVER commit .env files")
- **Common pitfalls** ("Always run migrations before tests")

**Step 4: Iterate**

Update CLAUDE.md after:
- Onboarding a new engineer (capture questions they asked)
- Architectural changes (new services, major refactors)
- Agent makes repeated mistakes (encode the correction in context)

### Example Agent Prompt for Bootstrapping

```

Create a CLAUDE.md file for this project by:

1. Reading package.json, README.md, and top-level config files
2. Identifying the tech stack, development commands, and testing setup
3. Analyzing code patterns in src/ (or equivalent) to detect conventions
4. Locating critical files (entry points, configuration, shared utilities)

Generate a CLAUDE.md following the template in /docs/templates/CLAUDE.md.template.

Focus on objective facts. I'll add tribal knowledge afterward.

````

This prompt works because it:
- Gives explicit search instructions (package.json, README, src/)
- References a template (ensures consistent structure)
- Sets expectations (objective facts only, human will augment)

## CLAUDE.md vs README: Division of Labor

**README.md** (for humans and AI):
- Project purpose and goals
- Architecture overview
- Setup instructions
- Contribution guidelines
- Links to documentation

**CLAUDE.md** (AI-specific operational details):
- Explicit code conventions with examples
- Common commands with explanations
- Critical constraints in imperative form
- Key files with descriptions
- Warnings about non-obvious behavior

**Overlap is fine.** If your README already covers dev commands, reference it:

```markdown
## Development Commands

See [README.md](./README.md#development) for setup and dev commands.

**AI-specific notes:**
- When running tests, add `--no-interactive` flag (CI environment)
- Database seeds expect Docker daemon running
- E2E tests take ~5 minutes, run only after significant changes
````

## Security Considerations

Context files are code. Treat them with the same rigor:

**Never include secrets:**

```markdown
# BAD

AWS_SECRET_ACCESS_KEY=abc123...

# GOOD

Use AWS SSO for authentication (see wiki/aws-setup.md)
```

**Avoid oversharing:**

- Don't document internal IPs or infrastructure details
- Don't list all environment variables (just critical ones)
- Don't include customer data or PII in examples

**Version control:**

- Commit CLAUDE.md to the repository
- Include in code review (changes to context are changes to project knowledge)
- Use `.gitignore` for personal global configs (`~/.claude/CLAUDE.md`)

**Attack surface:**

- More comprehensive configs = more injection attack risk
- Keep AI-specific files minimal
- Primary documentation lives in README/docs/, not CLAUDE.md

## Hands-On Exercise: Create CLAUDE.md for Your Project

**Scenario:** You're adding AI agent support to an existing codebase your team maintains.

**Your Task:**

1. **Inventory the project:**
   - What's the tech stack? (Language, framework, database)
   - What commands do you run daily? (setup, dev server, tests)
   - What conventions does your team follow? (code style, branching, testing)
   - What mistakes have new hires made? (missed migrations, wrong module system, etc.)

2. **Bootstrap with an agent:**

   ```
   Analyze this codebase and draft a CLAUDE.md file including:
   - Project overview and architecture
   - Tech stack and key dependencies
   - Development commands (setup, run, test)
   - Code conventions (module system, async patterns, error handling)
   - Key files and their purposes

   Use the template from this lesson as reference.
   ```

3. **Augment with tribal knowledge:**
   - Add critical constraints ("NEVER commit .env")
   - Document common pitfalls ("Redis sessions expire after 24h")
   - Include non-obvious dependencies ("E2E tests require Docker daemon")

4. **Test with the agent:**
   - Start a new chat (fresh context)
   - Give the agent a typical task: "Add input validation to the login endpoint"
   - Observe: Does it use the right patterns? Right module system? Run the right tests?

5. **Iterate:**
   - Note what the agent got wrong
   - Update CLAUDE.md to encode the correction
   - Re-test with the same task

**Expected Outcome:** A production-ready CLAUDE.md that reduces onboarding time for both human engineers and AI agents.

**Bonus Challenge:** Create a hierarchy:

- Repository-root CLAUDE.md (project-wide context)
- Subdirectory CLAUDE.md for a specific module (component-specific rules)

Test that the subdirectory rules correctly augment the root context.

## Key Takeaways

- **Context files are onboarding docs for AI agents** - They encode project-specific knowledge that doesn't fit in a 200K token context window
- **Hierarchical organization scales** - Global → Repository → Directory-specific rules allow granular control for monorepos
- **Automate the tedious parts** - Use agents to bootstrap CLAUDE.md from existing docs, then augment with tribal knowledge
- **Minimal is better** - Keep AI-specific configs lean. Put comprehensive documentation in README and project docs
- **Treat context files as code** - Version control, code review, security scanning apply

**The Meta-Pattern:**
You're teaching the agent how to operate in your environment. Good context files are the difference between a generic code generator and a project-aware operator that follows your team's conventions, avoids known pitfalls, and produces production-ready code on the first attempt.

---

**Next:** [Lesson 7: Planning Lesson 8: Planning & Execution Execution](./lesson-7-planning-execution.md)
