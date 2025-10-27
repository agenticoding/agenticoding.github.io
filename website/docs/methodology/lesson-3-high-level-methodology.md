---
sidebar_position: 1
sidebar_label: 'Lesson 3: Four-Phase Workflow'
---

import WorkflowCircle from '@site/src/components/VisualElements/WorkflowCircle';

# Four-Phase Workflow

The hardest part of working with AI agents isn't learning new tools or writing better prompts. It's letting go.

For your entire career, your value has been in the details. You've built your reputation on writing clean code, spotting subtle bugs, understanding every line you ship. You've internalized that good engineers understand their code deeply, own their implementations, and take pride in craftsmanship.

AI agents force you to operate differently. You can't understand every line at the scale agents produce code. You can't read, verify, and mentally own 2,000 lines of generated implementation the way you owned 200 lines you wrote yourself. If you try, you'll burn out or become the bottleneck that negates every productivity gain the agent provides.

The shift required is psychological as much as methodological. You're moving from **craftsman to operator**, from **implementer to orchestrator**, from **writing code to directing systems**. Your value moves up the stack—from syntax to structure, from loops to logic, from implementation details to architectural decisions.

This doesn't mean you stop caring about quality. It means you ensure quality differently. You stop validating correctness by reading every line and start validating correctness by thinking systematically: Does this fit the architecture? Does it follow our patterns? Does it handle the risks I identified? Does the behavior match my mental model of how this system should work?

Your focus shifts from the code itself to two higher-level concerns: **the context you provide** (what patterns, constraints, and examples guide the agent) and **the prompts you craft** (what architectural requirements and integration points you specify). Get these right, and you can confidently ship thousands of lines of generated code. Get them wrong, and you'll waste time fixing, refactoring, and second-guessing.

This lesson teaches the systematic workflow that makes this mindset shift practical: Research > Plan > Execute > Validate. It's how you maintain architectural control while delegating implementation, how you ensure quality without reading every character, and how you scale your impact beyond what you could personally type.

## The Operator Mindset

Before diving into the workflow, let's be explicit about the role shift. When working with AI agents at scale, you're not doing the same job faster—you're doing a different job.

**Traditional developer workflow:**

- Write code
- Test code
- Review code
- Debug code
- Refactor code

**Operator workflow:**

- Understand the system (mental model)
- Research context and patterns
- Plan the change architecturally
- Direct the agent with precise context
- Validate outcomes against requirements

Notice what's missing from the second list: writing implementation code, reading every line, debugging syntax errors. The agent handles those. Your cognitive load shifts entirely to architectural thinking—understanding how pieces fit together, what patterns to follow, what constraints matter, and what risks exist.

This doesn't mean you never read code. It means you read _selectively_. When an agent generates 50 files, you don't review them line by line. You review the architecture: Does it follow our patterns? Does it handle the security boundaries? Does it integrate correctly? You spot-check where your mental model says "this is risky" or "this is too complex."

Here's the counterintuitive reality: **properly prompted AI-generated code is often easier to read than hand-written code**. LLMs follow patterns with mechanical precision across thousands of lines. When you provide quality patterns and clear constraints, they replicate them perfectly. You're not sacrificing quality by delegating to agents—you're achieving structural consistency at a scale individual craftsmanship can't match. Your job shifts from ensuring every implementation detail is correct to ensuring the patterns themselves are correct.

Your mental model is your blueprint. The workflow below is your process for ensuring quality without drowning in detail.

**One thing doesn't change: you own the results.** Machines can't be held accountable—they execute instructions. Every line of agent-generated code ships under your name. This is the engineer's responsibility, and it remains yours regardless of which tool writes the implementation.

## The Four-Phase Workflow

Every significant agent interaction should follow this pattern:

<WorkflowCircle />

Each phase has a distinct purpose, and skipping any one of them dramatically increases your failure rate. Let's walk through each phase in detail.

## Phase 1: Research (Grounding)

You wouldn't start coding in a new codebase without first learning the architecture, patterns, and conventions. And you probably keep Google and Stack Overflow open while you work. Your agent needs the same context.

This is **grounding**—the bridge between the general-purpose knowledge and patterns embedded in the model and the actual real-world context it needs to operate in. Without grounding, agents hallucinate patterns, invent inconsistent APIs, and miss your existing implementations.

### Code Research: [ChunkHound](https://chunkhound.github.io/)

For code context, you need semantic code search. [ChunkHound](https://chunkhound.github.io/) performs **code deep research**—answering architectural questions like "How is authentication handled?" or "What's the error handling pattern?" instead of just keyword matching. It retrieves the relevant patterns and implementations from your codebase.

### Domain Research: ArguSeek

For domain knowledge, ArguSeek pulls information from Google directly and efficiently into your context. Need the latest API docs? Best practices from a specific framework? An algorithm buried in a 50-page research paper PDF? A solution from a GitHub issue? ArguSeek retrieves it and makes it available to your agent—no manual tab-switching, copy-pasting, or context reconstruction.

**We'll cover both tools in detail in Lesson 5.** For now, understand the principle: ground your agent in both your codebase and domain knowledge before planning changes.

## Phase 2: Plan (Strategic Decision)

With research complete, you now plan the change. Planning isn't a single approach—it's a strategic choice based on whether you know the solution or need to discover it.

**Exploration Planning:** Use this when the solution space is unclear or you need to discover the best approach. Rather than dictating a solution, frame the problem space and steer the agent to research your codebase patterns (via ChunkHound) and domain knowledge (via ArguSeek), explore alternatives, and iterate with you through reasoning-action cycles. You're discovering the approach together.

This approach has higher cost and time investment, but it discovers better solutions, catches architectural issues early, and helps you build a clearer mental model before committing to implementation.

```markdown
Our Express API has inconsistent error handling—some endpoints return raw errors,
others JSON, and stack traces leak to production. Use ChunkHound to search for
"error handling patterns" and "error response format" in our codebase.
Use ArguSeek to research Express error handling best practices and RFC 7807.
Analyze what you find, propose 2-3 standardization approaches with trade-offs,
and recommend one.
```

**Exact Planning:** Use this when you know the solution and can articulate it precisely. Be directive. Define the task with specificity, specify integration points and patterns to follow, provide explicit constraints and requirements, list edge cases you've identified, and define clear acceptance criteria. The agent executes along a predetermined path.

This approach is faster and more cost-effective, but requires upfront clarity and architectural certainty—if your plan is wrong or incomplete, the generated code will be wrong. Use exact planning when you've already done the architectural thinking and just need reliable, consistent implementation.

```markdown
Add rate limiting middleware to /api/\* using Redis.
Follow the pattern in src/middleware/auth.ts.
Authenticated users: 1000 req/hour, anonymous: 100 req/hour, admins unlimited.
Return 429 with Retry-After header.
Fail open if Redis is down - log warning but allow request through.
```

### Building Your Mental Model

As you plan, you're refining your mental model of the system. You're not memorizing code—you're understanding relationships:

- How authentication flows through middleware
- Where data validation happens vs. business logic
- How errors propagate to the client
- Where performance bottlenecks might appear
- What security boundaries exist

This mental model is what allows you to validate generated code quickly. When the agent completes, you don't read every line. You check: "Does this fit my mental model of how this system works?" If yes, it's probably correct. If no, either your model is wrong (update it) or the code is wrong (regenerate).

## Phase 3: Execute (Precise Prompting)

With your plan complete, you craft a prompt. The quality of this prompt determines whether the agent generates correct code on the first try or requires multiple iterations.

### Anatomy of a High-Quality Prompt

A good prompt has four components:

**1. Task Definition** - What specifically needs to be done

```
Add rate limiting middleware to the Express API for /api/* routes
```

**2. Context** - Relevant patterns, files, and examples

```
Context:
- Middleware pattern: src/middleware/auth.ts (structure to follow)
- Redis client: src/cache/client.ts (connection already configured)
- Apply in: src/app.ts (before route handlers)
```

**3. Constraints** - Requirements, patterns, and boundaries

```
Requirements:
- Authenticated users: 1000 req/hour
- Anonymous users: 100 req/hour
- Admin role: no limit
- Return 429 with { error, retryAfter } and Retry-After header
- Log rate limit hits (pattern: src/middleware/logging.ts)
- Allowlist from process.env.RATE_LIMIT_ALLOWLIST
```

**4. Edge Cases** - Security, errors, and failure modes

```
Edge cases:
- Redis connection failure: allow request through, log error
- X-Forwarded-For: use leftmost IP (original client, not proxy)
- Sliding window algorithm (not fixed window)
```

### The Execute Checklist

Before you submit the prompt, verify:

- [ ] Task is clearly scoped (one feature, one change)
- [ ] You've provided relevant file paths and patterns
- [ ] Constraints are explicit (what to do, what not to touch)
- [ ] Edge cases and security considerations are included
- [ ] Success criteria are clear

Then let the agent work. Don't interrupt mid-stream unless it's clearly stuck in a loop. Trust the process.

**Time investment:** 2-5 minutes to craft the prompt.

**Payoff:** Agent completes correctly in 5-15 minutes instead of generating broken code that takes 30 minutes to fix manually.

## Phase 4: Validate (Architectural Verification)

The agent completed. Now you validate—but not by reading every line. You validate against your plan, your mental model, and your acceptance criteria.

### Level 1: Does It Compile and Pass Tests?

This is automated verification:

```bash
npm run build   # Compile check
npm test        # Unit and integration tests
npm run lint    # Code style and standards
```

If this fails, you have a decision point (covered in "Regenerate or Fix Manually" section).

If it passes, move to architectural validation.

### Level 2: Does It Meet the Plan?

Check your acceptance criteria from the planning phase:

- [ ] Task scope respected (right files changed, nothing else touched)
- [ ] Integration points correct (middleware applied in right place)
- [ ] Patterns followed (error format, logging, Redis usage)
- [ ] Edge cases handled (Redis failure, IP extraction, admin bypass)

Use `git diff` to review changed files, but focus on structure and integration, not implementation details. Ask: "Does this match my mental model of how this should work?"

### Level 3: Architectural Risks Addressed?

Revisit the risks you identified in planning:

- **Security:** Are there any injection points? Auth bypasses? Data leaks?
- **Performance:** Any obvious N+1 queries? Unnecessary loops? Blocking operations?
- **Reliability:** What happens on errors? Timeouts? Network failures?
- **Maintainability:** Does it follow project conventions? Is it reasonably clear?

You're not doing a line-by-line code review. You're spot-checking critical paths and risk areas. If your mental model says "this is a security boundary," you look at that code carefully. If it's standard CRUD boilerplate, you trust the tests and move on.

### Level 4: Production Readiness?

Final checks before accepting:

- Logging and observability (can you debug this in production?)
- Error messages (helpful for users and developers?)
- Documentation (are non-obvious decisions explained?)

:::warning The Validation Mistake
Accepting code because "it works on my machine" without considering:

- Different environments (staging, production)
- Edge cases (empty arrays, null values, concurrent requests)
- Error conditions (network failures, invalid input, database errors)

AI agents optimize for the happy path. Your job is validating everything else.
:::

**Time investment:** 3-7 minutes for standard tasks, 10-15 minutes for complex features.

**Payoff:** You catch architectural issues and integration problems without drowning in implementation details. You ship confidently.

## The Critical Decision: Regenerate or Fix Manually?

Validation failed. Now what? This decision determines whether you maintain the productivity gains of AI or fall back into manual coding.

### Regenerate When:

**1. The issue is architectural or conceptual**

The agent misunderstood your requirements or made a wrong design choice.

Example: Agent used JWT when you needed OAuth2.

**Fix:** Clarify the prompt, provide better context, regenerate. This is a 3-minute fix that yields correct code.

**2. The pattern is wrong across multiple files**

Example: Agent used relative imports instead of path aliases across 10 files.

**Fix:** Update the prompt with the correct pattern, regenerate. Fixing 10 files manually takes longer and is error-prone.

**3. The agent is stuck in a loop**

Signs: Same error after 3+ attempts, keeps "fixing" the same thing differently, increasing complexity without progress.

**Fix:** Stop the agent. Start fresh with better context. Often this means your initial context was incomplete.

**4. It's a qualitative refinement**

Example: Error messages are too technical, log formats aren't quite right, response structure could be clearer.

**Fix:** Iterate with the agent. These subjective improvements benefit from conversation and refinement.

### Fix Manually When:

**1. You can fix it in under 60 seconds**

Example: Missing import, typo, wrong constant value.

**Cost of regenerating:** 30-60 seconds of agent time + reprompting overhead.
**Cost of fixing:** 5 seconds in your editor.

Just fix it and move on.

**2. The fix requires specific domain knowledge**

Example: A specific algorithm implementation, a performance optimization based on your data characteristics, a security fix based on your threat model.

**Why:** Explaining the domain knowledge might take longer than implementing. Use your expertise.

**3. You're debugging a complex interaction**

Example: Race condition, memory leak, subtle state management bug.

**Why:** These require systematic debugging with tools, profilers, and human insight into causality. Agents aren't good at this yet.

**4. Time pressure is high**

Production is down. You know the fix. Don't waste time crafting perfect prompts—just fix it.

### The 2-Minute Rule

**If you can't decide in 2 minutes whether to regenerate or fix manually, fix manually.**

Indecision kills productivity. Make a choice and move forward. You'll learn over time when regeneration pays off vs. when manual fixes are faster.

## Task Sizing: The LLM Calibration Principle

Here's an insight that dramatically improves your success rate: **LLMs are calibrated to do roughly a fixed amount of work per request**. This isn't a rigid rule, but it's a useful mental model.

When you give an LLM a task, it has an internal expectation of how much work is appropriate. If the task is too small (add a one-line import), the LLM might overthink it, add unnecessary complexity, or struggle to justify its existence. If the task is too large (refactor the entire auth system), the LLM loses architectural coherence, misses edge cases, and produces inconsistent code.

The sweet spot: **5-20 minutes of focused execution time** for the agent.

### Task Too Small (< 5 minutes)

When the task is trivial—like adding an import, renaming a variable, fixing a typo—don't bother with an agent. Either do it manually (it's faster) or batch it with related tasks.

**But what if you need the agent for some reason?** (Maybe you're scripting, or you want to stay in the agent workflow.) Here's the trick: **give the LLM enough work to satisfy its calibration by adding valuable context work**.

**Example: Adding a single import**

Instead of:

```
Add an import for the User type in src/routes/orders.ts
```

Try:

```
I need to add User type to src/routes/orders.ts for the new endpoint.

First, research how User is imported in other route files to ensure consistency. Check src/routes/users.ts and src/routes/auth.ts.

Then add the appropriate import to src/routes/orders.ts following the same pattern.

Explain which pattern you found and why you chose it.
```

Now the LLM has meaningful work: research the pattern, make a decision, implement consistently, and explain the reasoning. This satisfies its calibration and produces better results than asking for a one-line change.

### Task Right-Sized (5-20 minutes)

This is the sweet spot:

- Implement a new API endpoint with validation and tests
- Refactor a module to extract shared logic
- Add a feature flag to an existing feature
- Migrate a database schema with rollback support

**Why it works:**

- Clear scope prevents drift
- Enough complexity to benefit from AI
- Short enough to validate thoroughly
- Fits in working memory (yours and the agent's)

### Task Too Large (> 20 minutes)

Large tasks like "refactor the entire auth system" or "add real-time features" don't work well. The agent loses coherence, you lose the ability to validate, and subtle bugs creep in.

**Fix: Decompose into sequential tasks with planning phases**

**Example: Adding real-time notifications**

Don't do this:

```
Add real-time notifications to the app
```

Instead, decompose:

```
1. [Research] Review WebSocket libraries and current architecture (5 min)
2. [Plan] Design notification event flow and data model (agent plans, you approve)
3. [Execute] Add WebSocket server with authentication (15 min)
4. [Execute] Create notification event emitter service (10 min)
5. [Manual] Integrate with existing user actions (you do this - requires business logic understanding)
6. [Execute] Add client-side WebSocket connection (15 min)
7. [Execute] Build notification UI component (20 min)
8. [Execute] Add persistence and read/unread state (15 min)
```

Notice:

- Each task is right-sized
- You do the complex business logic integration manually
- Each task has its own research/plan/execute/validate cycle
- Total time is the same, but quality and coherence are dramatically higher

:::tip Task Sizing Heuristic
Count the number of files that need to change:

- **1-3 files:** Probably right-sized
- **4-8 files:** Check if you can split it
- **9+ files:** Definitely split it

Exception: Pure mechanical changes (rename, move files) can touch many files safely.
:::

## Engineering Context, Not Code

Let's make this explicit: **Your job is providing context and constraints, not writing code.**

The productivity trap is thinking of agents as junior developers who need hand-holding. When the output is wrong, your instinct is to fix the code. Resist that instinct. The code is the output. You don't debug the output—you debug the input.

### What Great Context Looks Like

**Always include:**

- Relevant file paths showing patterns to follow
- Existing examples in the codebase
- Architectural constraints (don't touch X, must use Y)

**Often include:**

- Security requirements (auth, validation, sanitization)
- Performance requirements (query limits, pagination, caching)
- Error handling patterns

**Sometimes include:**

- Business logic context (why this matters)
- Deployment considerations (feature flags, migrations)
- Monitoring and observability needs

**Never include:**

- Your entire codebase (be selective—remember the 30% rule)
- Implementation details the agent should figure out
- Minutiae that doesn't affect correctness

### Iterating on Context, Not Code

When the output is wrong, ask:

1. **Was my prompt ambiguous?** → Clarify and regenerate
2. **Did I provide the wrong example?** → Update context and regenerate
3. **Did I miss a constraint?** → Add constraint and regenerate
4. **Is the pattern in my codebase unclear?** → Point to better example and regenerate

You're debugging your prompt, not the agent's code. Each iteration improves your understanding of what context the agent needs. You're learning to be a better operator.

## Practical Example: End-to-End Workflow

Let's walk through adding rate limiting to an API, demonstrating all four phases and the principles we've covered.

### Phase 0: Research (3 minutes)

**Code research (ChunkHound):**

```
"How is middleware structured in our Express app?"
"What's the pattern for Redis operations?"
"How are errors formatted and returned?"
```

**Findings:**

- Middleware follows pattern in `src/middleware/auth.ts`
- Redis client configured in `src/cache/client.ts`
- Error format defined in `src/middleware/errors.ts`
- Logging pattern in `src/middleware/logging.ts`

**Domain research (ArguSeek):**

```
"Rate limiting algorithms: fixed window vs sliding window"
"Express rate limiting with Redis best practices"
"X-Forwarded-For header security considerations"
```

**Findings:**

- Sliding window is more accurate, prevents burst abuse
- Use leftmost IP in X-Forwarded-For (original client, not proxy)
- Common pattern: separate limits by user role/auth status

**Context optimization:** I have ~200k tokens available. These findings total ~15k tokens (~7.5%). I'll aim for ~60k tokens total (30%), leaving room for the agent's response and avoiding the U-curve attention drop.

### Phase 1: Plan (4 minutes)

**Minimal change:**

- Add rate limiting middleware
- Apply to all `/api/*` routes
- Different limits for authenticated vs. anonymous users

**Integration strategy:**

- Follow middleware pattern from `auth.ts`
- Use existing Redis client from `cache/client.ts`
- Apply in `app.ts` before route handlers

**Architectural risks:**

- Security: X-Forwarded-For can be spoofed (use leftmost IP only)
- Performance: Redis call on every request (acceptable, but monitor)
- Reliability: Redis failure could block all traffic (fail open with logging)

**Constraints:**

- Must use existing Redis client
- Must follow error format from `errors.ts`
- Must log rate limit events
- Must support allowlist for internal services

**Validation criteria:**

- Tests pass (build, lint, unit tests)
- Under-limit requests succeed
- Over-limit requests get 429 with Retry-After
- Redis failure allows requests through
- Allowlist works

**Mental model update:** Middleware chains in `app.ts` → auth checks role → rate limiter checks Redis → route handler executes. On rate limit hit, return early with 429. On Redis error, log and continue (fail open).

### Phase 2: Execute (3 minutes to write prompt)

```
Add rate limiting middleware to the Express API

Context:
- Middleware pattern: src/middleware/auth.ts (structure to follow)
- Apply in: src/app.ts to all /api/* routes before route handlers
- Redis client: src/cache/client.ts (use existing client)
- Error format: src/middleware/errors.ts (return format)
- Logging pattern: src/middleware/logging.ts

Requirements:
- Authenticated users: 1000 requests/hour
- Anonymous users: 100 requests/hour
- Admin users (req.user.role === 'admin'): no limit
- Return 429 status with { error: "Rate limit exceeded", retryAfter: <seconds> }
- Add Retry-After header with seconds until reset
- Log rate limit hits using our logging pattern

Edge cases:
- Handle Redis connection failures: allow request through, log error as warning
- Extract client IP from X-Forwarded-For (use leftmost IP, the original client)
- Use sliding window algorithm (not fixed window)
- Support allowlist: skip rate limiting for IPs in process.env.RATE_LIMIT_ALLOWLIST (comma-separated)

Tests:
- Add tests in tests/middleware/rateLimit.test.ts
- Follow pattern from tests/middleware/auth.test.ts
- Cover: under limit (200), over limit (429), allowlist bypass, Redis failure, admin bypass
```

### Phase 3: Validate (5 minutes)

**Level 1: Build and test**

```bash
npm run build   # ✓ passes
npm test        # ✓ passes
npm run lint    # ✓ passes
```

**Level 2: Architectural check**

```bash
git diff src/middleware/rateLimit.ts   # Review structure
git diff src/app.ts                     # Check integration point
git diff tests/middleware/             # Verify test coverage
```

Checking against mental model:

- ✓ Middleware structured like auth.ts
- ✓ Applied in app.ts before route handlers
- ✓ Uses existing Redis client
- ✓ Follows error format
- ✓ Logging pattern correct

**Level 3: Risk review**

Spot-checking critical sections:

```typescript
// IP extraction - check X-Forwarded-For handling
const forwarded = req.headers['x-forwarded-for'];
const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
```

✓ Uses leftmost IP correctly

```typescript
// Redis failure handling
try {
  const current = await redis.incr(key);
  // ... rate limit logic
} catch (err) {
  logger.warn('Rate limit Redis failure', { error: err });
  return next(); // Fail open
}
```

✓ Gracefully handles Redis errors

**Level 4: Production readiness**

- ✓ Logs rate limit hits with relevant metadata
- ✓ Error messages are clear
- ✓ Tests cover edge cases

**Decision:** Ship it.

**Total time:** 3 min research + 4 min planning + 3 min prompt + 12 min agent execution + 5 min validation = **27 minutes**

**Manual implementation estimate:** 60-90 minutes (middleware logic + Redis integration + tests + edge cases)

**Productivity gain:** 2-3x faster, with equivalent or better quality because we validated systematically against architectural requirements rather than hoping we didn't miss anything in manual implementation.

## Hands-On Exercise: Workflow in Practice

**Scenario:** Your team's Node.js API has inconsistent error handling. Some endpoints return raw errors, others return structured JSON, and some leak stack traces to clients in production. You need to standardize.

**Your Task:**

### Part 1: Research (10 minutes)

Use your codebase (or imagine you have one) and answer:

1. **Code research:**
   - How many different error handling patterns currently exist?
   - Is there a preferred pattern you should generalize?
   - What error codes/categories do you need (400, 401, 403, 404, 500)?
   - Where are errors currently caught (route handlers, middleware, global handler)?

2. **Domain research:**
   - What's the Express error handling best practice?
   - How should stack traces be handled in production vs. development?
   - What information should error responses include?

3. **Context optimization:**
   - Select the top 2-3 code examples showing current patterns
   - Note the key constraints (security, existing API contracts)
   - Target ~30% of context (don't include every route file)

### Part 2: Plan (10 minutes)

Answer these questions:

1. **Minimal change:**
   - What specifically are you standardizing?
   - What's the target error format?
   - Where does the change apply?

2. **Integration strategy:**
   - Global error handler? Middleware? Both?
   - How do existing endpoints adopt the new pattern?
   - Backward compatibility requirements?

3. **Architectural risks:**
   - Information leakage (stack traces, internal paths)
   - Breaking existing clients (if you change error format)
   - Missing error cases (uncaught exceptions, async errors)

4. **Constraints:**
   - What format is required? (HTTP status, JSON structure)
   - What can't change? (existing endpoints, deployed clients)
   - What patterns must be followed?

5. **Validation criteria:**
   - How will you verify it works?
   - What tests are needed?

**Update your mental model:** Where do errors originate? How do they propagate? Where are they caught? Where are they formatted? Where are they logged?

### Part 3: Execute (15 minutes)

Write a detailed prompt that includes:

- Task definition with acceptance criteria
- Context (point to example files, current patterns)
- Constraints (format requirements, what not to change)
- Edge cases (uncaught exceptions, async errors, malformed input)

**Pass this prompt to an agent** (Claude Code, Cursor, Aider, or similar)

### Part 4: Validate (10 minutes)

When the agent completes:

1. **Level 1:** Does it compile and pass tests?
2. **Level 2:** Review `git diff` - Does it meet your plan?
3. **Level 3:** Spot-check critical paths - Security issues? Information leaks?
4. **Level 4:** Production ready? Logging? Error messages? Documentation?

**Make the decision:**

- Regenerate with better context?
- Fix manually?
- Ship it?

**Document your decision and reasoning.**

### Part 5: Reflect (5 minutes)

Answer:

1. How much time did you spend researching vs. executing vs. validating?
2. Did the agent misunderstand anything? Why? What context was missing?
3. Did you maintain a clear mental model of the error handling flow?
4. What would you do differently next time?

**Bonus Challenge:**

The agent's implementation works but uses try/catch in every route handler. You realize a global error handling middleware would be cleaner and more maintainable.

**Should you:**

- A) Edit the generated code to add middleware
- B) Regenerate with middleware approach specified in the prompt
- C) Accept it and refactor later

**Make the call. Justify your decision based on the principles in this lesson.**

## Key Takeaways

**At agent scale, you can't manually review all generated code. Shift from implementer to operator.**

Your job is maintaining mental models of the system—how components integrate, where risks lie, what patterns to follow. The agent's job is implementation details. Spend your time thinking, not reading generated code line-by-line.

**Research > Plan > Execute > Validate is your systematic workflow for maintaining quality at scale.**

- **Research:** Ground yourself in code patterns (ChunkHound) and domain knowledge (ArguSeek). Target ~30% of context window to avoid U-shaped attention curve.
- **Plan:** Think architecturally—define scope, integration strategy, risks, constraints. Update your mental model.
- **Execute:** Craft precise prompts with task, context, constraints, and edge cases.
- **Validate:** Check against plan and mental model, not by reading every line. Spot-check critical paths.

**LLMs are calibrated for ~5-20 minutes of work per task.**

- Too small? Do it manually or add valuable context work (research, planning, explanation).
- Too large? Decompose into sequential sub-tasks with their own research/plan cycles.
- Right-sized tasks get coherent, high-quality results.

**Optimize inputs (context, prompts) not outputs (generated code).**

When output is wrong, debug your prompt. Was it ambiguous? Wrong example? Missing constraint? Unclear pattern? Regenerate with better context instead of patching code.

**Regenerate vs. fix manually is a strategic decision.**

- **Regenerate:** Architectural misunderstanding, widespread pattern issues, agent stuck in loop, qualitative refinement.
- **Fix manually:** < 60 second fix, requires domain expertise, complex debugging, time pressure.
- **2-minute rule:** Can't decide quickly? Fix manually and move on.

**Context quality beats context quantity.**

Be selective. Use the 30% rule. Provide only the most relevant patterns, the most applicable examples, the most critical constraints. Selectivity improves accuracy and reduces attention degradation.

---

**Next:** [Lesson 4: Prompting 101](./lesson-4-prompting-101.md) - Learn the specific techniques for crafting effective prompts that get reliable results.
