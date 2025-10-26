---
sidebar_position: 2
sidebar_label: 'Lesson 7: Planning & Execution'
---

# Planning & Execution

Feature development with AI agents shifts your role from line-by-line implementation to task orchestration. This lesson covers the **planning phase** that precedes autonomous execution - how to ground the agent with research, when to ask clarifying questions, and how to decompose complex features into parallel workstreams.

## Learning Objectives

- **Apply grounding techniques** to research codebases, documentation, and architecture before execution
- **Evaluate when to ask clarifying questions** versus making informed assumptions based on evidence
- **Decompose complex features** into independent, parallelizable tasks using systematic breakdown methods
- **Orchestrate autonomous execution** by managing multiple concurrent workstreams effectively

## The Planning Phase: Ground Before You Execute

Junior developers jump straight into implementation. Senior engineers spend time understanding the problem space first. AI agents amplify this pattern - investing 10 minutes in grounding prevents hours of rework.

**Grounding** means loading the agent's context with everything it needs to make good decisions:

1. **Codebase context** - Existing patterns, architectural boundaries, naming conventions
2. **Technical context** - Library docs, API references, framework idioms
3. **Business context** - Requirements, constraints, edge cases

### Why Grounding Matters

Without proper grounding, agents make probabilistic guesses based on training data:

- **With grounding:** "I see you use Zod for validation in `src/validation/`, follow the pattern in `userSchema.ts`"
- **Without grounding:** "Here's a generic validation approach using a library you don't have installed"

The agent has zero memory of your last conversation. Every task starts from a blank context window. **Grounding is not optional.**

### Practical Grounding Workflow

**Before asking the agent to implement a feature:**

```markdown
1. Research the codebase architecture
   - Where does this feature fit?
   - What existing modules handle similar concerns?
   - What patterns should I follow?

2. Research external dependencies
   - What libraries/APIs will I use?
   - What are the recommended patterns?
   - Are there known gotchas?

3. Identify constraints
   - Performance requirements?
   - Security considerations?
   - Backwards compatibility?
```

**Example grounding prompt for adding rate limiting:**

```
I need to add rate limiting to our Express API. Before we start:

1. Search the codebase for existing middleware patterns (especially auth)
2. Research our Redis setup - how are we currently using it?
3. Fetch the express-rate-limit documentation
4. Check if we have any existing rate limiting anywhere

Once you've gathered this context, propose an approach that matches
our existing patterns and uses our current infrastructure.
```

**The agent will:**

- Grep for middleware files
- Read Redis config
- Fetch external docs
- Propose an implementation that fits your architecture

**Without grounding, the agent will:**

- Generate generic middleware that doesn't match your style
- Assume Redis config that doesn't exist
- Miss security requirements
- Ignore your existing error handling patterns

## Questions vs Assumptions: When to Clarify

Every task has ambiguity. The art is knowing when to resolve it **before** execution versus during.

### The Clarifying Questions Heuristic

**Ask when:**

- **Business logic is ambiguous** - "Should expired premium users retain read access?"
- **Security/compliance implications** - "Can we log PII for debugging?"
- **Multiple valid approaches with different trade-offs** - "Optimize for write throughput or read latency?"
- **Breaking changes to public APIs** - "This will break existing clients - intentional?"

**Don't ask when:**

- **Technical patterns are established** - Follow existing conventions
- **Standard engineering practices apply** - Use proper error handling, logging, validation
- **Documentation exists** - Check CLAUDE.md, README, or linked resources
- **You can verify cheaply** - Run tests, check logs, experiment locally

### The Evidence-Based Decision Framework

Before asking, gather evidence:

**Scenario:** You need to add pagination to an API endpoint.

**Bad approach:**

```
"How should I implement pagination? Offset-based or cursor-based?"
```

**Good approach:**

```
1. Grep for existing pagination in the codebase
2. Check API documentation for established patterns
3. Read CLAUDE.md for architectural decisions
4. If still ambiguous, ask with context:
   "I see we use offset pagination in /users but this endpoint
   could have 100K+ records. Cursor-based would be more efficient
   but breaks consistency. Which do you prefer?"
```

**The principle:** Make informed recommendations backed by evidence, not open-ended questions.

### Inferring Requirements from Context

Senior engineers make reasonable assumptions based on:

- **Existing patterns** - "Auth middleware uses JWTs, so this new protected route should too"
- **Industry standards** - "APIs should return 400 for validation errors, 500 for server errors"
- **Common sense** - "Don't store passwords in plaintext, even if requirements don't explicitly forbid it"

**Your agent should operate the same way** - if you've grounded it with codebase context, it will make reasonable inferences.

**Example of good inference:**

```
Task: "Add email validation to the signup endpoint"

Agent's approach (properly grounded):
- Finds existing Zod schemas in src/validation/
- Follows the pattern in userSchema.ts
- Uses the same email regex pattern
- Returns errors in the established format
- Adds tests matching the existing test structure

No questions needed - the codebase provides the answers.
```

## Feature Decomposition: Breaking Down Complex Work

Complex features require systematic breakdown. The goal is to identify **independent, parallelizable units of work** that can be executed concurrently.

### The SPIDR Method

**SPIDR** is a proven technique for splitting features into smaller deliverable increments:

**S - Spike (Research):** Separate exploration from implementation

- "Evaluate Stripe vs. Braintree for payment processing" → One task
- "Implement the chosen payment provider" → Separate task after spike

**P - Path (User Workflows):** Different ways to achieve the same goal

- "Login with email/password" → One story
- "Login with OAuth (Google, GitHub)" → Separate story
- "Login with magic link" → Separate story

**I - Interfaces (UI/Platform Variations):** Deliver per platform or UI complexity

- "Support Chrome and Firefox" → Initial story
- "Add Safari support" → Follow-up story
- "Basic share button (URL only)" → Initial story
- "Rich share modal (social preview cards)" → Enhancement story

**D - Data (Supported Data Types):** Start simple, add complexity iteratively

- "Upload MP4 videos" → Initial story
- "Support WebM, AVI formats" → Follow-up story
- "Handle employees with one manager" → Initial story
- "Support matrix reporting (multiple managers)" → Enhancement

**R - Rules (Business Logic):** Deliver core functionality, add rules incrementally

- "Upload videos (basic validation only)" → Initial story
- "Enforce copyright detection" → Follow-up story
- "Block offensive content in comments" → Follow-up story

### Decomposition in Practice

**Example: Adding Multi-Factor Authentication (MFA)**

**Without decomposition:**

```
"Add MFA to the application"
(Too large, many dependencies, unclear scope)
```

**With SPIDR decomposition:**

```markdown
## Spike

1. Research TOTP libraries (otplib vs speakeasy)
2. Review existing auth flow architecture
3. Fetch best practices for MFA UX

## Phase 1: Core TOTP Infrastructure (Path: TOTP)

4. Add MFA schema to user model (DB migration)
5. Implement TOTP secret generation and storage
6. Create verification endpoint (/auth/mfa/verify)
7. Add tests for TOTP generation/verification

## Phase 2: Enrollment Flow (Path: Enrollment)

8. Build enrollment API endpoints
9. Add QR code generation for secret sharing
10. Create backup codes functionality
11. Add tests for enrollment edge cases

## Phase 3: Login Flow Integration (Interface: Web)

12. Update login endpoint to check MFA status
13. Add MFA challenge step to login flow
14. Handle "remember this device" functionality
15. Add comprehensive E2E tests

## Phase 4: Recovery & Admin (Rules: Edge Cases)

16. Implement backup code redemption
17. Add admin MFA reset capability
18. Handle account lockout after failed attempts
19. Add security event logging
```

**Benefits of this breakdown:**

- Tasks 4-7 can be implemented and tested independently
- Task 8-11 can start once task 4 (schema) is complete
- Tasks 12-15 depend on 4-7 but can be developed by a different agent instance
- Tasks 16-19 are enhancements that don't block core functionality

### Identifying Dependencies

**Critical skill:** Recognizing true dependencies versus perceived ones.

**True dependency:**

```
Task A: Add `mfaEnabled` column to users table
Task B: Query users.mfaEnabled in login endpoint
→ B depends on A (database schema must exist)
```

**False dependency (can parallelize):**

```
Task A: Implement TOTP verification logic
Task B: Build QR code generation for enrollment
→ No dependency (both use the same secret, but can develop independently)
```

**Dependency analysis checklist:**

- Does Task B read data written by Task A?
- Does Task B call functions defined in Task A?
- Does Task B import modules created in Task A?
- Does Task B require Task A's tests to pass first?

If all answers are "no," the tasks are parallelizable.

## Autonomous Execution: Orchestrating Multiple Workstreams

Once you've decomposed a feature, you can execute tasks autonomously - either sequentially by one agent or in parallel across multiple agent instances.

### Sequential Execution Pattern

**Best for:**

- Tasks with tight dependencies
- Single-agent workflows
- Learning new codebases (observe before parallelizing)

**Example workflow:**

```bash
# Agent conversation 1: Schema changes
"Implement task 4: Add MFA schema to user model"
[Agent reads migrations/, creates new migration, runs tests]

# Agent conversation 2: Core logic (depends on schema)
"Implement tasks 5-7: TOTP generation, storage, verification"
[Agent builds on completed schema, adds business logic]

# Agent conversation 3: API endpoints (depends on core logic)
"Implement tasks 8-11: Enrollment API and backup codes"
[Agent uses completed TOTP functions, adds HTTP layer]
```

### Parallel Execution Pattern

**Best for:**

- Independent workstreams
- Time-sensitive deadlines
- Well-understood architectures

**Example workflow (3 parallel agent instances):**

```bash
# Terminal 1: Database layer
claude start
> "Implement task 4: Add MFA schema and migration.
   Run all existing tests to ensure no regressions."

# Terminal 2: TOTP core (can start immediately)
claude start
> "Implement tasks 5-7: TOTP secret generation, storage, verification.
   Mock the database for now, we'll integrate the schema later.
   Include comprehensive unit tests."

# Terminal 3: QR code generation (independent)
claude start
> "Implement task 10: QR code generation for TOTP secrets.
   Use the qrcode library, follow patterns in src/utils/.
   Write tests with sample secrets."
```

**After all complete, integrate:**

```bash
# Terminal 4: Integration
claude start
> "The following tasks are complete:
   - Task 4: MFA schema (branch: feat/mfa-schema)
   - Tasks 5-7: TOTP core logic (branch: feat/mfa-totp)
   - Task 10: QR generation (branch: feat/mfa-qr)

   Merge these branches and resolve any conflicts.
   Run the full test suite and fix any integration issues."
```

### Managing Parallel Work: The Integration Tax

Parallelization adds integration overhead. Budget for it.

**Integration challenges:**

- **Merge conflicts** - Multiple branches touch the same files
- **API mismatches** - Agent A expects interface X, Agent B built interface Y
- **Test interactions** - Unit tests pass independently, integration tests fail
- **Timing dependencies** - Async operations with different completion times

**Mitigation strategies:**

1. **Clear interface contracts** - Define APIs before parallel implementation

   ```typescript
   // Define this first, share with all agents:
   interface MFAService {
     generateSecret(): Promise<string>;
     verifyToken(secret: string, token: string): Promise<boolean>;
     generateQRCode(secret: string, accountName: string): Promise<string>;
   }
   ```

2. **Isolated feature branches** - Each workstream in its own branch

   ```bash
   git checkout -b feat/mfa-schema
   git checkout -b feat/mfa-totp
   git checkout -b feat/mfa-qr
   ```

3. **Explicit integration task** - Don't assume parallel work will merge cleanly

   ```markdown
   Task N: Integration & Testing

   - Merge all feature branches
   - Resolve conflicts (prioritize schema over mocks)
   - Run full test suite
   - Fix any integration failures
   - Update documentation
   ```

4. **Communication boundaries** - Share completed interfaces, not work-in-progress

   ```markdown
   # Don't:

   "Agent 1 is working on X, Agent 2 will use it when ready"

   # Do:

   "Task 4 (schema) must complete first. Once merged to main,
   Tasks 5-7 and 8-11 can proceed in parallel."
   ```

### When to Parallelize vs Stay Sequential

**Parallelize when:**

- Tasks are clearly independent (no shared files)
- You have well-defined interface contracts
- Integration cost is low (< 30% of parallel time savings)
- You've validated the approach with a spike first

**Stay sequential when:**

- You're learning an unfamiliar codebase
- Tasks touch core infrastructure
- Integration cost is high (lots of shared state)
- Debugging parallel failures would be complex

**Rule of thumb:** If you can't clearly explain how two tasks will integrate, don't parallelize yet.

## Planning Artifacts: Making the Invisible Visible

Effective planning produces artifacts that guide execution and enable verification.

### Task Lists

**Good task lists are:**

- **Specific** - "Add email validation to signup endpoint" (not "improve validation")
- **Testable** - Clear completion criteria
- **Ordered** - Dependencies explicit
- **Scoped** - Achievable in 30-90 minutes

**Example for "Add user profile photos":**

```markdown
## Phase 1: Storage Infrastructure

- [ ] Research image storage options (S3 vs Cloudinary)
- [ ] Set up S3 bucket with proper CORS config
- [ ] Create upload helper function with size/type validation
- [ ] Add tests for upload edge cases (too large, wrong format)

## Phase 2: Database Schema

- [ ] Add profilePhotoUrl column to users table
- [ ] Create migration (up and down)
- [ ] Update User model with new field
- [ ] Run migration in dev environment

## Phase 3: API Endpoints

- [ ] POST /users/:id/photo (upload)
- [ ] DELETE /users/:id/photo (remove)
- [ ] Update GET /users/:id to include photoUrl
- [ ] Add integration tests for all endpoints

## Phase 4: Frontend Integration

- [ ] Add photo upload component to settings page
- [ ] Handle upload progress and errors
- [ ] Add photo to user profile display
- [ ] Write E2E tests for upload flow
```

**Use the task list to:**

- Track progress during execution
- Identify blockers early
- Communicate status to stakeholders
- Resume work after context switches

### Architecture Decision Records (ADRs)

For non-trivial technical decisions, document the reasoning:

```markdown
## ADR: Image Storage for Profile Photos

**Context:** Users need profile photos. Options: S3, Cloudinary, local filesystem.

**Decision:** Use AWS S3 with CloudFront CDN.

**Rationale:**

- Already using AWS (lower operational complexity)
- S3 pricing competitive with Cloudinary for our scale
- CloudFront provides global edge caching
- Ownership of data and control over access policies

**Consequences:**

- Need to manage image resizing ourselves (or add Lambda)
- CORS configuration required for direct browser uploads
- S3 lifecycle policies for orphaned images

**Alternatives considered:**

- Cloudinary: Higher cost, but includes transformations
- Local filesystem: Doesn't scale, complicates deployment
```

**When to write an ADR:**

- Choosing between libraries/frameworks
- Significant architectural changes
- Security or compliance decisions
- Anything future-you will question

### Interface Contracts

For parallel work, define contracts before implementation:

```typescript
/**
 * MFA Service - Interface contract for parallel development
 *
 * Implementation: Task 5-7 (Agent 1)
 * Consumers: Task 8-11 (Agent 2), Task 12-15 (Agent 3)
 */

interface MFAService {
  /**
   * Generate a new TOTP secret for a user
   * @returns Base32-encoded secret (32 chars)
   * @throws Error if user already has MFA enabled
   */
  generateSecret(userId: string): Promise<string>;

  /**
   * Verify a TOTP token against a secret
   * @param token 6-digit code from authenticator app
   * @param window Time window for verification (default: ±1 period)
   * @returns true if valid, false otherwise
   */
  verifyToken(secret: string, token: string, window?: number): Promise<boolean>;

  /**
   * Generate QR code for secret enrollment
   * @returns Data URL for QR code image
   */
  generateQRCode(secret: string, accountName: string): Promise<string>;

  /**
   * Generate backup codes for account recovery
   * @returns Array of 10 one-time-use codes
   */
  generateBackupCodes(userId: string): Promise<string[]>;
}
```

**Benefits:**

- Agent 2 and 3 can build against this interface immediately
- Agent 1 must implement exactly this contract
- Integration is type-safe (TypeScript enforces the contract)
- Tests can mock the interface for isolation

## Hands-On Exercise: Plan and Execute a Complex Feature

**Scenario:** You're adding **audit logging** to a SaaS application. Every sensitive operation (login, data export, permission change) must be logged for compliance. Logs must include: timestamp, user ID, IP address, action type, and affected resource.

**Your Task:**

### Step 1: Grounding (15 minutes)

Before asking the agent to implement anything:

1. **Research the codebase:**
   - Where are sensitive operations currently handled?
   - Is there any existing logging infrastructure?
   - What database are you using? (Postgres, MongoDB, etc.)
   - What's the established error handling pattern?

2. **Research external requirements:**
   - Look up compliance logging best practices (GDPR, SOC2)
   - Research structured logging libraries for your stack
   - Understand log retention requirements

3. **Identify constraints:**
   - Performance impact (logging is synchronous or async?)
   - Storage costs (where do logs go? How long to retain?)
   - Privacy concerns (what can/can't be logged?)

### Step 2: Decompose the Feature (15 minutes)

Using SPIDR or another method, break down audit logging into tasks:

```markdown
Example starting point (you refine this):

## Spike

- [ ] Research structured logging libraries (Winston, Pino, Bunyan)
- [ ] Review compliance requirements for our industry
- [ ] Estimate storage costs for 100K logs/day

## Phase 1: Infrastructure

- [ ] Design audit log schema
- [ ] Create audit_logs table with indexes
- [ ] Set up log rotation/retention policy

## Phase 2: Core Logging

- [ ] ...
```

**Your decomposition should:**

- Identify at least 10 specific tasks
- Highlight dependencies (which tasks block others?)
- Mark which tasks can be parallelized
- Include testing tasks

### Step 3: Define Interfaces (10 minutes)

Write the contract for the audit logging service:

```typescript
interface AuditLogger {
  log(event: AuditEvent): Promise<void>;
  query(filters: AuditFilters): Promise<AuditEvent[]>;
  // ... what else?
}

type AuditEvent = {
  // Define the shape
};
```

### Step 4: Execute (Autonomous)

Pick one task from your decomposition and prompt an agent to implement it:

```markdown
Example prompt:

"Implement Phase 1, Task 2: Create audit_logs table with indexes.

Context:

- We use PostgreSQL 14
- Our migrations are in db/migrations/ using node-pg-migrate
- Follow the pattern in 1648392847123_create-users-table.js

Requirements:

- Columns: id, userId, action, resourceType, resourceId, ipAddress, timestamp, metadata (JSONB)
- Indexes: userId, action, timestamp (for common queries)
- Set up automatic partitioning by month (for performance)

Run the migration in dev and verify it works."
```

**Observe how the agent:**

- Uses grounding (reads existing migrations)
- Follows established patterns
- Adds tests automatically (if your project has test conventions)
- Verifies the work (runs migration, checks schema)

### Step 5: Integration Planning (10 minutes)

If you parallelized tasks, document your integration strategy:

```markdown
## Integration Plan

### Merge order:

1. Merge feat/audit-schema (database)
2. Merge feat/audit-service (core logic) - depends on schema
3. Merge feat/audit-middleware (HTTP layer) - depends on service
4. Merge feat/audit-ui (admin dashboard) - depends on middleware

### Conflict resolution:

- If both branches modify src/types.ts, prioritize the schema branch

### Integration tests:

- E2E test: User login → audit log created → visible in admin UI
- Performance test: 1000 concurrent logs → all persisted correctly
```

## Key Takeaways

**Planning accelerates execution** - 10 minutes of grounding prevents hours of rework. Load the agent's context with codebase patterns, documentation, and constraints before asking it to implement features.

**Ask with evidence, not guesses** - Clarifying questions should include context from your research. "I see pattern X in the codebase, but this scenario seems different because Y - which approach do you prefer?" beats "How should I do this?"

**Decompose for parallelization** - Use SPIDR or similar methods to break features into independent tasks. Identify true dependencies (data/control flow) versus false ones (perceived coupling). Parallelize aggressively when tasks are truly independent.

**Integration is a first-class task** - Budget 20-30% of parallel execution time for merging, conflict resolution, and integration testing. Define interface contracts upfront to minimize integration pain.

**Artifacts make plans verifiable** - Task lists, ADRs, and interface contracts turn invisible planning into tangible deliverables. They enable progress tracking, stakeholder communication, and context recovery after interruptions.

---

**Next:** [Lesson 8: Tests as Guardrails](./lesson-8-tests-as-guardrails.md)
