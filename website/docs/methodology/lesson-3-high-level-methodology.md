---
sidebar_position: 1
sidebar_label: 'Lesson 3: High-Level Methodology'
---

# High-Level Methodology: The Plan > Execute > Validate Workflow

Most engineers instinctively debug AI-generated code the same way they debug their own: jump into the file, fix the bug, move on. This is a productivity trap.

**The fundamental insight:** AI agents are tools, not teammates. When a CNC machine produces a bad part, you don't file down the edges - you fix the G-code. When an agent produces bad code, don't patch the output - fix the input.

This lesson teaches the systematic workflow that separates effective agent operators from frustrated ones.

## Learning Objectives

By the end of this lesson, you will be able to:

- **Apply the Plan > Execute > Validate workflow** to structure agent-driven development tasks
- **Determine when to regenerate vs manually fix** AI-generated code based on efficiency and quality considerations
- **Decompose engineering tasks** into appropriately-sized chunks for optimal agent performance (5-20 minute execution windows)
- **Optimize engineering inputs** (context, prompts, constraints) rather than patching outputs (generated code)

## The Core Workflow: Plan > Execute > Validate

Every agent interaction should follow this three-phase pattern:

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│   PLAN   │ ───> │ EXECUTE  │ ───> │ VALIDATE │
└──────────┘      └──────────┘      └──────────┘
     │                                     │
     └─────────────── iterate ─────────────┘
```

### Phase 1: Plan

Before typing a prompt, answer these questions:

**What's the minimal task definition?**

- What specifically needs to change?
- What should remain unchanged?
- What are the acceptance criteria?

**What context does the agent need?**

- Relevant files (not the entire codebase)
- Architecture patterns in use
- Constraints (security, performance, compatibility)
- Examples of similar working code

**What could go wrong?**

- Security implications (auth bypass, injection, secrets exposure)
- Performance regressions (N+1 queries, memory leaks)
- Breaking changes (API contracts, data migrations)

**Planning is not overthinking.** This takes 30-120 seconds and prevents 15-minute debugging sessions.

:::tip Production Pattern
Create a mental checklist for common task types:

**Adding a new API endpoint:**

- Auth requirements?
- Input validation strategy?
- Database transaction boundaries?
- Error handling patterns in similar endpoints?

**Refactoring:**

- Test coverage before starting?
- Feature flags for incremental rollout?
- Backward compatibility requirements?
  :::

### Phase 2: Execute

With a clear plan, craft a precise prompt:

**Bad prompt (vague, reactive):**

```
Add validation to the user endpoint
```

**Good prompt (specific, constrained):**

```
Add input validation to POST /api/users endpoint:

Context:
- We use Zod for validation (see src/validation/schemas.ts)
- Pattern: validate in middleware, return 400 with field-level errors
- Required fields: email (valid format), password (min 12 chars), role (enum: user|admin)

Constraints:
- Match error format from src/middleware/validation.ts
- Do not modify existing endpoints
- Add tests following pattern in tests/api/auth.test.ts
```

**The execution checklist:**

1. **Clear task boundary** - One feature, one bug, one refactor
2. **Explicit context** - Point to files, patterns, examples
3. **Constraints upfront** - What not to touch, what patterns to follow
4. **Success criteria** - How to verify correctness

Let the agent execute. Resist the urge to intervene mid-stream unless it's clearly stuck in a loop.

### Phase 3: Validate

The agent completed. Now validate systematically:

**Level 1: Does it compile/run?**

```bash
npm run build
npm test
npm run lint
```

If this fails, you have a decision point (covered in next section).

**Level 2: Does it meet requirements?**

- Check acceptance criteria from planning phase
- Review changes with `git diff`
- Test happy path and edge cases manually if needed

**Level 3: Does it introduce risks?**

- Security review (injection, auth bypass, data leaks)
- Performance review (query patterns, algorithmic complexity)
- Maintainability review (follows project patterns, readable)

**Level 4: Production readiness**

- Logging and observability
- Error handling and recovery
- Documentation and comments (where non-obvious)

:::warning Common Validation Mistake
Accepting code because "it works on my machine" without considering:

- Different environments (staging, production)
- Edge cases (empty arrays, null values, concurrent requests)
- Error conditions (network failures, invalid input, database errors)

AI agents optimize for the happy path. Your job is validating everything else.
:::

## The Critical Decision: Regenerate or Fix Manually?

Your validation failed. Now what?

This is where most engineers waste time. Here's the decision tree:

### Regenerate When:

**1. The fix requires understanding the original intent**

Example: Agent misunderstood your requirements

```diff
- // Agent added JWT validation
+ // You wanted OAuth2 flow
```

**Fix:** Clarify the prompt, regenerate

```
I need OAuth2 authentication, not JWT. Use the pattern from
src/auth/oauth.ts. The endpoint should redirect to the OAuth
provider, not validate tokens locally.
```

**2. The issue is widespread across the changes**

Example: Agent used wrong import pattern across 10 files

```typescript
// Wrong pattern throughout
import { User } from '../../../models/user';
import { Order } from '../../../models/order';

// Should be
import { User, Order } from '@/models';
```

**Fix:** Update prompt with correct pattern, regenerate

```
Use path aliases (@/models, @/utils) instead of relative imports.
See tsconfig.json for configured paths.
```

**3. The agent got stuck in a loop**

Signs of looping:

- Same error after 3+ attempts
- Keeps "fixing" the same thing differently
- Increasing complexity without progress

**Fix:** Stop the agent, start a fresh conversation with better context

```
Stop. Let's start over.

I need X. Here's the working pattern from Y. The key constraint
is Z because [reason]. Implement following the exact pattern.
```

**4. You're iterating on qualitative aspects**

Example: Refining error messages, log formatting, API response structure

These are subjective and benefit from iteration:

```
The error messages are too technical for end users. Make them
more friendly while keeping technical details in the logged object.

Example:
User-facing: "Email address is already registered"
Logged: { code: "USER_DUPLICATE_EMAIL", field: "email", ... }
```

### Fix Manually When:

**1. You can fix it in under 60 seconds**

Example: Missing import, typo in variable name, wrong constant value

**Faster to fix:** 5 seconds in your editor
**Cost of regenerating:** 30-60 seconds of agent time + reprompting overhead

**2. The issue is in code the agent shouldn't touch**

Example: Agent broke unrelated code while making changes

**Why manual:** The original prompt was scoped correctly, but the agent had a false positive match or made an overzealous refactor

**Fix:**

```bash
git diff              # Review all changes
git add -p            # Stage only the correct changes
# Manually revert the bad changes
```

**3. The fix requires specific domain knowledge**

Example:

- Correct algorithm implementation (agent used O(n²), you need O(n log n))
- Performance optimization (specific to your data characteristics)
- Security fix (agent doesn't understand your threat model)

**Why manual:** Explaining the domain knowledge might take longer than implementing

**4. You're debugging a complex interaction**

Example: Race condition, memory leak, subtle state management bug

**Why manual:** These require systematic debugging with debuggers, profilers, and human insight into causality

**5. Time pressure is high**

Production is down. You understand the fix. Don't burn time on perfect prompts.

### The 2-Minute Rule

**If you can't decide in 2 minutes whether to regenerate or fix manually, fix manually.**

Indecision is the real productivity killer. Make a choice and move forward.

## Task Sizing: The 5-20 Minute Rule

AI agents have a sweet spot for task complexity. Too small, and the overhead isn't worth it. Too large, and they lose coherence.

**Target: 5-20 minutes of focused execution**

### Too Small (< 5 minutes)

**Examples:**

- Add a single import
- Rename a variable
- Fix a typo
- Add a console.log

**Why it fails:** Context loading overhead exceeds execution time

**Fix:** Batch small tasks or just do them manually

```
Good prompt (batched):
Add error logging to all API endpoints in src/routes/.
Follow pattern from src/routes/auth.ts lines 45-52.
```

### Sweet Spot (5-20 minutes)

**Examples:**

- Implement a new API endpoint with validation and tests
- Refactor a module to extract shared logic
- Add feature flag support to an existing feature
- Migrate database schema with rollback support

**Why it works:**

- Clear scope prevents drift
- Enough complexity to benefit from AI
- Short enough to validate thoroughly
- Fits in working memory (yours and the agent's)

### Too Large (> 20 minutes)

**Examples:**

- "Refactor the entire auth system"
- "Add real-time features to the app"
- "Migrate from REST to GraphQL"

**Why it fails:**

- Agent loses architectural coherence
- You lose ability to validate thoroughly
- High risk of subtle bugs
- Hard to isolate failures

**Fix:** Decompose into sequential tasks

**Example decomposition:**

```
Task: Add real-time notifications

Decomposed:
1. Add WebSocket server with authentication (15 min)
2. Create notification event emitter service (10 min)
3. Integrate with existing user actions (20 min - do this manually)
4. Add client-side WebSocket connection (15 min)
5. Build notification UI component (20 min)
6. Add persistence and read/unread state (15 min)
```

Notice task #3 is manual - it requires understanding business logic across the codebase.

:::tip Task Sizing Heuristic
Count the number of files that need to change:

- **1-3 files:** Probably right-sized
- **4-8 files:** Check if you can split it
- **9+ files:** Definitely split it

Exception: Pure mechanical changes (rename, move files) can touch many files safely.
:::

## Engineering Context, Not Code

The paradigm shift: **Your job is providing context and constraints, not writing code.**

### Bad Workflow (Code-Focused)

```
You: "Add caching to the API"
Agent: [Generates code with Redis]
You: [Sees it's inefficient, edits the code manually]
You: [Adds error handling]
You: [Fixes the cache key generation]
You: [Adds TTL configuration]
```

**Result:** You wrote half the code anyway, defeating the purpose.

### Good Workflow (Context-Focused)

```
You: "Add caching to the API

Context:
- We use Redis (see src/cache/client.ts)
- Pattern: cache middleware wrapping route handlers (example: src/routes/analytics.ts)
- Cache keys: {resource}:{id}:{version} format
- TTL: 5 minutes for user data, 1 hour for reference data

Constraints:
- Cache hits must log to observability (see src/middleware/logging.ts)
- Handle cache failures gracefully (fallback to database)
- Add cache invalidation on POST/PUT/DELETE
- Follow error handling pattern from src/middleware/errors.ts

Success criteria:
- GET requests check cache before database
- Cache misses populate cache
- Mutations invalidate relevant cache entries
- Tests verify cache behavior (see tests/cache/)
"

Agent: [Generates comprehensive, correct implementation]
You: [Validates, commits]
```

**Result:** 5 minutes of planning saved 30 minutes of fixing.

### What Context to Provide

**Always:**

- Relevant file paths for patterns to follow
- Existing examples in the codebase
- Architectural constraints (don't touch X, must use Y pattern)

**Often:**

- Security requirements (auth, validation, sanitization)
- Performance requirements (query limits, pagination)
- Error handling patterns

**Sometimes:**

- Business logic context (why this matters)
- Deployment considerations (feature flags, migrations)
- Monitoring and observability needs

**Never:**

- Your entire codebase (be selective)
- Implementation details the agent should figure out
- Minutiae that doesn't affect correctness

### Iterating on Context, Not Code

When the output is wrong, resist fixing the code. Ask:

1. **Was my prompt ambiguous?** → Clarify and regenerate
2. **Did I provide the wrong example?** → Update context and regenerate
3. **Did I miss a constraint?** → Add constraint and regenerate
4. **Is the pattern in my codebase unclear?** → Point to better example and regenerate

**You're debugging the input, not the output.**

## Practical Example: End-to-End Workflow

**Scenario:** Add rate limiting to your API

### Plan Phase (90 seconds)

**Task definition:**

- Add rate limiting middleware to prevent abuse
- Different limits for authenticated vs anonymous users
- Return 429 with Retry-After header

**Context needed:**

- Express middleware pattern we use
- Where to apply middleware (per-route or global?)
- Rate limit values (from product requirements)
- Redis client for storage

**Risks:**

- Blocking legitimate users (need allowlist)
- Distributed systems issue (multiple servers sharing rate limit state)
- Performance overhead (Redis calls on every request)

### Execute Phase (prompt)

```
Add rate limiting middleware to the Express API

Context:
- Middleware pattern: src/middleware/auth.ts (similar structure)
- Apply to all /api/* routes in src/app.ts
- Use Redis for rate limit storage (client: src/cache/client.ts)
- Limits:
  - Authenticated users: 1000 req/hour
  - Anonymous users: 100 req/hour
  - Admin users: no limit (check req.user.role === 'admin')

Requirements:
- Return 429 status with JSON: { error: "Rate limit exceeded", retryAfter: <seconds> }
- Add Retry-After header with seconds until reset
- Allowlist: skip rate limiting for IPs in process.env.RATE_LIMIT_ALLOWLIST
- Log rate limit hits (pattern: src/middleware/logging.ts)

Edge cases:
- Handle Redis connection failures (allow request through, log error)
- Use IP address if user not authenticated (X-Forwarded-For header)
- Sliding window algorithm (not fixed window)

Tests:
- Add tests in tests/middleware/rateLimit.test.ts
- Follow pattern from tests/middleware/auth.test.ts
- Cover: under limit (200), over limit (429), allowlist bypass, Redis failure
```

### Validate Phase (3-5 minutes)

**Level 1: Compiles and tests pass**

```bash
npm run build        # ✓
npm test             # ✓
npm run lint         # ✓
```

**Level 2: Requirements met**

```bash
git diff src/middleware/rateLimit.ts    # Review implementation
git diff src/app.ts                     # Check integration
git diff tests/middleware/              # Verify test coverage
```

Check:

- ✓ Different limits for auth/anon users
- ✓ Admin bypass
- ✓ 429 status and Retry-After header
- ✓ Allowlist support
- ✓ Logging

**Level 3: Risks addressed**

- ✓ Redis failure handling (graceful degradation)
- ✓ Sliding window prevents burst abuse
- ✓ X-Forwarded-For handling for proxied requests

**Level 4: Production ready?**

Potential issue found:

```typescript
// Agent used:
const ip = req.headers['x-forwarded-for'] || req.ip;

// Problem: X-Forwarded-For can be spoofed
```

**Decision: Regenerate or fix manually?**

This is a 10-second fix, but it's a security issue affecting the core logic.

**Choice: Regenerate** (to ensure the agent understands the security context)

**Updated prompt:**

```
The IP extraction has a security issue. X-Forwarded-For can be
spoofed by clients.

Use the leftmost IP from X-Forwarded-For (the original client),
or req.ip if the header is absent. See MDN docs on X-Forwarded-For
for the security model.
```

Agent regenerates, validation passes. **Ship it.**

**Total time:** 2 minutes planning + 3 minutes execution + 5 minutes validation + 1 minute refinement = **11 minutes**

**Manual implementation estimate:** 45-60 minutes (middleware logic + tests + Redis integration)

## Hands-On Exercise: Workflow in Practice

**Scenario:** Your team's Node.js API has inconsistent error handling. Some endpoints return raw errors, others return structured JSON, some leak stack traces to clients. You need to standardize.

**Your Task:**

### Part 1: Plan (5 minutes)

Answer these questions:

1. What's the minimal task definition?
   - What does "standardized error handling" mean specifically?
   - What should the error format be?
   - Where should this apply?

2. What context do you need?
   - How many error handling patterns currently exist?
   - Is there a preferred pattern you want to generalize?
   - What error codes/categories do you need (400, 401, 403, 404, 500)?

3. What could go wrong?
   - Information leakage (stack traces, internal paths)
   - Breaking existing clients (if you change error format)
   - Missing error cases (uncaught exceptions)

### Part 2: Execute (15 minutes)

Write a detailed prompt that includes:

- Task definition with acceptance criteria
- Context (point to example files, patterns)
- Constraints (what not to change, format requirements)
- Edge cases (uncaught exceptions, async errors)

Use your actual codebase, or this minimal example structure:

```
src/
  routes/
    users.ts      # Has try/catch with raw errors
    auth.ts       # Returns structured errors
    orders.ts     # No error handling
  middleware/
    errors.ts     # Empty, needs implementation
```

**Pass this prompt to an agent** (Claude Code, Cursor, Aider, or GPT-4 in a code-enabled interface)

### Part 3: Validate (10 minutes)

When the agent completes:

1. **Compile/test/lint** - Does it work?
2. **Review changes** - Did it meet your requirements?
3. **Identify issues** - What's wrong or missing?
4. **Make the decision:**
   - Regenerate with better context?
   - Fix manually?
   - Ship it?

**Document your decision and reasoning.**

### Part 4: Reflect (5 minutes)

Answer:

1. How much time did you spend crafting the prompt vs validating?
2. Did the agent misunderstand anything? Why?
3. If you regenerated, what context was missing?
4. What would you do differently next time?

**Bonus Challenge:**

The agent's implementation works but uses `try/catch` in every route handler. You realize a global error handling middleware would be cleaner.

**Should you:**

- A) Edit the generated code to add middleware
- B) Regenerate with middleware approach specified
- C) Accept it and refactor later

**Make the call and justify it.**

## Key Takeaways

**The Plan > Execute > Validate workflow is your systematic approach to agent-driven development:**

- **Plan:** Define task, gather context, identify risks (30-120 seconds)
- **Execute:** Craft precise prompts with context and constraints
- **Validate:** Systematically verify correctness, security, performance, maintainability

**Regenerate vs fix manually is a decision, not a debate:**

- **Regenerate** when the fix requires intent understanding, affects multiple locations, or you're iterating on quality
- **Fix manually** when it's faster than reprompting, outside agent scope, or requires domain expertise
- **Apply the 2-minute rule:** If you can't decide quickly, just fix it and move on

**Task sizing affects success rate dramatically:**

- **Target 5-20 minutes** of agent execution time
- **Too small** (< 5 min): Do it manually or batch tasks
- **Too large** (> 20 min): Decompose into sequential steps
- **Heuristic:** 1-3 files is usually right-sized

**Optimize inputs (context, prompts) not outputs (generated code):**

- Provide selective, relevant context (not entire codebase)
- Include examples, patterns, constraints upfront
- When output is wrong, debug your prompt and regenerate
- Your job is engineering context, not patching code

**Productivity comes from discipline, not agent intelligence:**

- Resist the urge to jump into code fixes
- Invest 2 minutes planning to save 20 minutes debugging
- Validate systematically before accepting any code
- Build mental checklists for common task types

---

**Next:** [Lesson 4: Prompting 101](./lesson-4-prompting-101.md) - Learn the specific techniques for crafting effective prompts that get reliable results.
