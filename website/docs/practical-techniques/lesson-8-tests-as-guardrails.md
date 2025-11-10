---
sidebar_position: 3
sidebar_label: 'Lesson 8: Tests as Guardrails'
title: 'Lesson 8: Tests as Guardrails'
---

import ThreeContextWorkflow from '@site/src/components/VisualElements/ThreeContextWorkflow';

AI agents can refactor half your codebase in minutes. They'll rename functions, restructure modules, and update dozens of files—all while you grab coffee. This velocity is powerful, but dangerous. Small logic errors compound fast when changes happen at scale.

Tests are your constraint system. They define operational boundaries agents cannot cross. More importantly, they're living documentation that agents read to understand intent, edge cases, and the gotchas that tribal knowledge usually covers.

## Tests as Documentation: What Agents Actually Read

Before agents write code, they research—searching for relevant files and reading implementations. Both source code and tests load into the context window during this research phase. Tests aren't documentation agents "learn" from; they're concrete constraints that ground subsequent implementation steps in your actual codebase rather than statistical patterns from training data.

Good tests provide grounding. They show OAuth users skip email verification, dates handle timezone offsets, negative quantities are rejected. When these tests exist in context, implementation decisions are constrained by concrete examples from your codebase. Bad tests pollute context. Tests named `test('works')` with unclear assertions, or tests that mock away actual behavior, fill the context window with noise. When 50 tests load into context before an auth refactor, their quality determines whether the agent's implementation is grounded in your constraints or completes patterns from training.

### Research First: Discover Edge Cases Through Questions

Before writing tests, use the planning techniques from [Lesson 7](./lesson-7-planning-execution.md) to discover what needs testing. Questions load implementation details and existing edge cases into context.

**Prompt pattern for edge case discovery:**

```
How does validateUser() work? What edge cases exist in the current implementation?
What special handling exists for different auth providers?
Search for related tests and analyze what they cover.
```

The agent searches for the function, reads implementation, finds existing tests, and synthesizes findings. This loads concrete constraints into context: OAuth users skip email verification, admin users bypass rate limits, deleted users are rejected.

**Follow up to identify gaps:**

```
Based on the implementation you found, what edge cases are NOT covered by tests?
What happens with:
- Null or undefined inputs
- Users mid-registration (incomplete profile)
- Concurrent validation requests
```

The agent analyzes the implementation against your questions and identifies untested paths. You now have a grounded list of edge cases derived from actual code, not generic testing advice.

### Closed Loop: Evolve Code Alongside Tests

When code and tests are generated within the same context—the same conversation, shared reasoning state—they inherit the same assumptions and blind spots, creating a ["cycle of self-deception"](https://arxiv.org/html/2506.18315v1). For instance, an agent might implement an API endpoint that accepts zero or negative product quantities, then generate tests in the same session verifying that adding zero items succeeds. Both artifacts stem from the same flawed reasoning: neither questioned whether quantities must be positive. The test passes, the bug remains undetected. At scale, this compounds: agents engage in "specification gaming," weakening assertions or finding shortcuts to achieve green checkmarks. Research shows this [occurs in approximately 1% of test-code generation cycles](https://arxiv.org/html/2510.23761v1), but compounds across large codebases.

:::warning Goodhart's Law in Action

When tests become the optimization target, agents optimize for passing tests rather than correctness. Without safeguards, you get weaker assertions, buggy implementations, and green CI pipelines validating the wrong behavior. This is Goodhart's Law: "When a measure becomes a target, it ceases to be a good measure." The solution requires a circuit breaker that prevents convergence on mutually-compatible-but-incorrect artifacts.

:::

Apply the same planning and execution methodology from [Lesson 7](./lesson-7-planning-execution.md) to each step—writing code, writing tests, and triaging failures. Each follows the same pattern: research requirements, plan approach, execute, verify. The critical difference: use **fresh contexts** for each step. This leverages the stateless nature from [Lessons 1](../understanding-the-tools/lesson-1-intro.md) and [2](../understanding-the-tools/lesson-2-understanding-agents.md)—the agent doesn't carry assumptions or defend prior decisions between contexts.

## The three-context workflow:

<ThreeContextWorkflow />

1. **Write code** in Context A—research existing patterns using [grounding from Lesson 5](../methodology/lesson-5-grounding.md), plan implementation, execute, verify correctness
2. **Write tests** in fresh Context B—research requirements and edge cases, plan test coverage, execute (agent doesn't remember writing implementation, so tests derive independently from requirements), verify tests fail initially
3. **Triage failures** in fresh Context C—research the failure output, analyze test intent versus implementation behavior, determine root cause with evidence (file paths, line numbers, semantic analysis), propose fixes (agent doesn't know who wrote code or tests, providing objective analysis)

Enterprise systems validate this approach: Salesforce [reduced debugging time 30%](https://engineering.salesforce.com/how-ai-test-automation-cut-developer-productivity-bottlenecks-by-30-at-scale) using automated root cause analysis for millions of daily test runs. The detailed diagnostic workflow is covered in the [Test Failure Diagnosis](#test-failure-diagnosis-agent-driven-debug-cycle) section below.

## Tests as Guardrails: Preventing Regressions at Scale

### Why Tests Matter at Scale

Agents operate at velocity humans can't match. They rarely get it right the first time.

When an agent refactors 30 files in one session, unintended changes hide in massive diffs that are "mostly correct." You review a 2,000-line diff, develop pattern blindness, and skim past 28 correct files while missing 2 with subtle logic errors.

**Tests cement which behaviors are intentional and must not change.** Without tests, bugs compound at scale. Manual review fails when an agent might "simplify" away critical rounding logic buried in a 50-line file change. The test fails immediately—the agent can't silently remove logic that breaks production.

### Sociable Tests vs Heavy Mocking

Tests with heavy mocking give false confidence. They verify implementation details (function calls) rather than behavior (actual functionality).

**[Sociable unit tests](https://chroniclesofapragmaticprogrammer.substack.com/p/keeping-tests-valuable-social-testing) and [narrow integration tests](https://emmanuelvalverderamos.substack.com/p/explaining-unit-tests-solitarysociable) use real implementations for internal code.** Mock only external systems (APIs, third-party services).

**Example: Authentication testing**

- **Heavily mocked test**: Stubs `findByEmail()`, `verify()`, and `create()`. Passes even when an agent breaks all three implementations.
- **Sociable test**: Uses real database queries, real password hashing, and real session tokens. Exercises actual code paths—if the agent breaks any part of the flow, the test fails.

**When to mock:**

- Mock Stripe → costs money and requires API keys
- Use real test database → fast and verifies actual behavior

[Testing Without Mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks) advocates for "Nullables"—production code with an off switch—for in-memory infrastructure testing without complex mock setups.

### Fast Feedback with Smoke Tests

Build a **sub-30-second smoke test suite** covering critical junctions only—core user journey, authentication boundaries, and database connectivity—not exhaustive coverage. A 10-minute comprehensive suite is useless for iterative agent development; you'll skip running it until the end when debugging becomes expensive. Run smoke tests after each task to catch failures immediately while context is fresh, rather than making 20 changes before discovering which one broke the system. As [Jeremy Miller notes](https://jeremydmiller.com/2024/09/29/my-recommendations-for-a-test-automation-strategy), use "the finest grained mechanism that tells you something important." Reserve edge cases, detailed validation, and UI rendering details for the full test suite—smoke tests exist solely to prevent compounding errors during rapid iteration. Codify this practice in your project's `AGENTS.md` or `CLAUDE.md` file ([Lesson 6](./lesson-6-project-onboarding.md)) so agents automatically run smoke tests after completing each task without requiring explicit reminders.

---

## Autonomous Agent Testing: Finding Edge Cases You Missed

Deterministic tests verify known requirements. Agent simulation discovers unknown edge cases. **Both are essential—incorporate both in your testing pipeline.**

### Agents as User Simulators

AI agents can simulate actual user behavior by giving them a task and the tools needed to interact with your product—browser automation (MCP servers), CLI access, API clients. Like a human tester exploring your application, the agent navigates, clicks, fills forms, and observes results. The critical difference: agents explore state spaces non-deterministically.

**Non-deterministic behavior:** Run the same test script twice, and the agent explores different paths each time. This isn't a bug—it's the feature. LLM-based agents make probabilistic decisions, choosing different navigation sequences, input variations, and interaction patterns across runs. One iteration might test the happy path, another might accidentally discover a race condition by clicking rapidly, a third might stumble onto an edge case with unicode characters you never considered.

**This randomness is unreliable for regression testing.** You can't guarantee the agent will exercise the same code paths in CI/CD. But it's excellent for discovery—finding edge cases, state machine bugs, and input validation gaps that deterministic tests miss because you didn't think to write them.

### Complementary Testing Strategies

**Deterministic tests (unit, integration, E2E):**

- Verify known requirements and business logic
- Run reliably in CI/CD pipelines
- Catch regressions when code changes
- Provide fast feedback loops
- Document expected behavior

**Agent simulation (non-deterministic exploration):**

- Discover unknown edge cases
- Explore unexpected user journeys
- Find race conditions and timing bugs
- Uncover input validation gaps
- Simulate creative/adversarial users

**The workflow:** Use agents for discovery, then solidify findings into deterministic tests. Agents explore the unknown; deterministic tests prevent backsliding on the known.

When prompting agents for simulation testing, apply the techniques from [Lesson 4](../methodology/lesson-4-prompting-101.md)—clear instructions, specific constraints, expected outputs—to craft effective exploration prompts that guide agents toward high-value edge case discovery.

:::tip Connecting Agents to Your Product

Enable agents to interact with your application across browsers, mobile, and desktop using Model Context Protocol (MCP) servers:

**Browser Automation**

**Chrome DevTools MCP** ([Official by Google](https://github.com/ChromeDevTools/chrome-devtools-mcp))

- Full Chrome DevTools Protocol (CDP) access for browser automation
- Performance profiling, network inspection, DOM manipulation, real-time console logs
- Setup: `npx chrome-devtools-mcp@latest`
- [Documentation](https://developer.chrome.com/blog/chrome-devtools-mcp)

**Playwright MCP** ([Microsoft](https://github.com/microsoft/playwright-mcp))

- Cross-browser testing (Chromium, WebKit, Firefox)
- Accessibility tree-based interactions for reliable element selection
- Natural language element references ("click the submit button")
- Setup: `npx @playwright/mcp@latest`

**Mobile Automation**

**mobile-mcp** ([Mobile Next](https://github.com/mobile-next/mobile-mcp))

- iOS/Android simulator, emulator, and real device automation
- Accessibility-driven interactions for native app testing
- Structured UI snapshots for reliable element detection
- Supports multi-step user journeys and data extraction

**Desktop Automation (Emerging)**

**Computer Use MCP Servers**

- Control desktop applications through screen capture, mouse/keyboard input, and window management
- Uses accessibility APIs and coordinate-based interactions for UI automation
- Early-stage technology with growing enterprise adoption (Microsoft, Cloudflare, IBM integrating MCP across platforms)

These MCP servers give agents "eyes and hands" across platforms, enabling autonomous testing, bug reproduction, and product exploration. Configure in your AI assistant's MCP settings to connect agents directly to your product environment.

:::

## Test Failure Diagnosis: Agent-Driven Debug Cycle

When tests fail, apply the same four-phase workflow from [Lesson 3](../methodology/lesson-3-high-level-methodology.md): Research > Plan > Execute > Validate. This is the same systematic approach you use for all agent interactions, now specialized for debugging test failures.

### The Diagnostic Prompt Pattern

This diagnostic prompt applies techniques from [Lesson 4](../methodology/lesson-4-prompting-101.md): [Chain-of-Thought](../methodology/lesson-4-prompting-101.md#chain-of-thought-paving-a-clear-path) sequential steps, [constraints](../methodology/lesson-4-prompting-101.md#constraints-as-guardrails) requiring evidence, and [structured format](../methodology/lesson-4-prompting-101.md#applying-structure-to-prompts). Understanding why each element exists lets you adapt this pattern for other diagnostic tasks.

````markdown title="Diagnostic Prompt for Test Failures"
```
$FAILURE_DESCRIPTION
```

Use the code research to analyze the test failure above.

DIAGNOSE:

1. Examine the test code and its assertions.
2. Understand and clearly explain the intention and reasoning of the test - what is it testing?
3. Compare against the implementation code being tested
4. Identify the root cause of failure

DETERMINE:
Is this a test that needs updating or a real bug in the implementation?

Provide your conclusion with evidence.
````

**Why this works:**

- **Fenced code block** (``````) preserves error formatting and prevents the LLM from interpreting failure messages as instructions ([structured format](../methodology/lesson-4-prompting-101.md#applying-structure-to-prompts))
- **"Use the code research"** is an explicit grounding directive—forces codebase search instead of hallucination from training patterns ([constraints](../methodology/lesson-4-prompting-101.md#constraints-as-guardrails))
- **DIAGNOSE numbered steps** implement [Chain-of-Thought](../methodology/lesson-4-prompting-101.md#chain-of-thought-paving-a-clear-path), forcing sequential analysis (can't jump to "root cause" without examining test intent first)
- **"Understand the intention"** (step 2) ensures the agent articulates WHY the test exists, not just WHAT it does—critical for [CoT reasoning](../methodology/lesson-4-prompting-101.md#chain-of-thought-paving-a-clear-path)
- **DETERMINE binary decision** [constrains output](../methodology/lesson-4-prompting-101.md#constraints-as-guardrails) to "bug vs outdated test" instead of open-ended conclusions
- **"Provide evidence"** requires file paths and line numbers—concrete proof via [require evidence](./lesson-7-planning-execution.md#require-evidence-to-force-grounding), not vague assertions

You can adapt this for performance issues, security vulnerabilities, or deployment failures by changing the diagnostic steps while preserving the structure: sequential CoT → constrained decision → evidence requirement.

## Key Takeaways

- **Tests are documentation agents actually read** - They learn intent, edge cases, and constraints from test names, assertions, and comments. Write tests that explain the "why," not just verify the "what."

- **Use separate contexts for code, tests, and debugging** - When code and tests are generated in the same conversation, they inherit the same flawed assumptions ("cycle of self-deception"). Write code in Context A, write tests in fresh Context B, triage failures in fresh Context C. This prevents specification gaming and provides objective analysis.

- **Write sociable tests, not heavily mocked tests** - Mock only external systems (APIs, third-party services). Use real implementations for internal code to catch actual breakage. Build a sub-30-second smoke test suite for fast iteration feedback.

- **Green tests ≠ working software** - Tests verify logic, not UX or real-world usability. Run the actual product yourself—tests catch 80%, human verification catches the remaining 20%.

- **Autonomous testing discovers edge cases** - Agent-driven randomized testing explores state spaces humans don't think to test. Codify discovered edge cases as fixed regression tests.

- **Systematic diagnosis solves most test failures** - Use the structured diagnostic prompt (Examine → Understand → Compare → Identify → Determine) to analyze failures. Agents can fix most issues autonomously with this workflow.

---

**Next:** [Lesson 9: Reviewing Code](./lesson-9-reviewing-code.md)
