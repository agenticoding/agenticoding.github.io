---
sidebar_position: 2
sidebar_label: 'Planning & Execution'
sidebar_custom_props:
  sectionNumber: 7
title: 'Planning & Execution'
---

[Lesson 5: Grounding](../methodology/lesson-5-grounding.md) covered how RAG and semantic search enable agents to retrieve context from your codebase and the web. This lesson focuses on what happens during planning and execution—how to actively ground the agent as you work, how to review its planning before autonomous execution, and how to set up workflows that support parallel development across multiple agent instances.

The shift from gathering context to using context is critical. Grounding isn't a one-time upfront activity—it's continuous. You load context, review the agent's plan, let it execute, then validate. When something doesn't fit your mental model, you stop and clarify. When the agent proposes duplication, you enforce DRY. This lesson covers the tactical techniques that turn agents from code generators into reliable code producing machines.

## Grounding Tips: Active Context Engineering

Effective execution requires deliberate context management. These techniques keep the agent grounded in your actual codebase, not statistical patterns from training data.

### Always Ground in Code

Show agents actual patterns from your codebase, not generic documentation. Abstract descriptions lead to generic solutions that don't fit your specific codebase.

**Example:** You need to add rate limiting to your API. Don't prompt "Add rate limiting middleware." Instead: "Search for existing middleware patterns, especially authentication. Check our Redis configuration. Then propose rate limiting that follows the same error handling, export structure, and Redis client usage you found."

The agent will grep for middleware files, read your Redis config, analyze your patterns, and propose an implementation that matches your established conventions. Concrete beats abstract.

### Prompt to Explain: Loading Context Into the Window

When you ask "How does X work?", you're not testing the agent's knowledge—you're triggering a sequence that loads context into the window for subsequent steps.

**The mechanism:** "Explain how our authentication middleware works" causes the agent to:

1. Search the codebase for auth-related files
2. Read middleware implementations
3. Analyze patterns and structure
4. Synthesize findings

That synthesis now lives in the context window. When you follow up with "Add rate limiting following the same pattern," the agent already has middleware structure, error handling conventions, export patterns, and dependency usage loaded in context. It doesn't need to search again—the relevant knowledge is already present.

**Questions are a context engineering tool.** You're deliberately priming the agent's working memory before asking for implementation. This is more efficient than packing everything into one massive prompt and more reliable than hoping the agent will search for the right things autonomously.

:::tip Safe Autonomous Execution
Questions are safe to execute autonomously—they're read-only operations with minimal risk. Set your agent to required approval mode to enforce this (it will ask before making any changes). If the agent's explanation is wrong or incomplete, simply ignore it, refine your prompt, and try again. A well-crafted sequence of exploratory questions makes subsequent autonomous coding tasks much more reliable because the context window is already loaded with grounded information about your actual codebase.
:::

### Require Evidence to Force Grounding

Explicitly requiring evidence forces agents to read your actual code instead of generating plausible-sounding guesses based on training data patterns.

**The mechanism:** When you require "evidence (file paths, line numbers, actual values)" in your prompt, the agent cannot provide that evidence without retrieving it. This converts what might be a hallucinated response into a grounded one anchored in your codebase.

**Without evidence requirement:**

```
Debug the login endpoint - it's returning 500 errors
```

Agent might respond: "Probably a database timeout or null pointer exception in the authentication logic."

This is pattern completion from training data, not analysis of your actual code.

**With evidence requirement:**

```
Debug the login endpoint - it's returning 500 errors.
Explain the root cause with evidence: file paths, line numbers, actual error messages.
```

Now the agent must read the endpoint implementation, trace execution, and cite specifics:

"The error occurs in `src/api/auth.ts:67` where `user.profile.email` is accessed. The `profile` object is null for OAuth users (see `src/services/oauth.ts:134` - profile creation is skipped for federated auth). Stack trace shows: `TypeError: Cannot read property 'email' of null`."

**What constitutes good evidence:**

- **File paths with line numbers** - `src/auth/jwt.ts:45-67` (not "the auth file")
- **Actual values from configs/logs** - `port: 8080` (not "a port number")
- **Specific identifiers** - `validateJWT()` function (not "the validation function")
- **Exact error messages** - Full stack traces or log entries (not "an error occurred")

**Combining with Chain-of-Thought:**

Evidence requirements work independently or combined with step-by-step instructions. For complex debugging, use both—[Chain-of-Thought](../methodology/lesson-4-prompting-101.md#chain-of-thought-paving-a-clear-path) controls the execution path while evidence requirements ensure each step is grounded:

```
Debug the failing test in UserService.test.ts:

1. Read the test file, identify which test is failing
2. Analyze test assertion: expected vs actual values
3. Trace code path through UserService to find the bug
4. Explain root cause with evidence (file paths, line numbers)
5. Propose a fix

Provide evidence for each step.
```

This gives you execution control (CoT) while forcing grounding (evidence) at every stage.

### Ask Clarifying Questions to Challenge Logic

LLMs are bad at logic—they complete patterns based on statistical likelihood, not sound reasoning. Your engineering skills are still required to catch inconsistencies.

When something doesn't fit your mental model, point it out: "If X is true, how can Y happen?"

**Example:** Agent says "The config uses port 3000" but your logs show connections on 8080. Challenge it: "You said port 3000, but logs show 8080. Explain this discrepancy with evidence from the config files and environment setup."

This forces the agent to re-examine its assumptions, search more carefully, and ground its response in actual data rather than pattern completion. Use your mental model to validate the agent's reasoning. When logic doesn't hold, make the agent justify with evidence.

## Detailed Planning: Review Before Execution

Before letting the agent execute autonomously, review its plan. This is where you catch architectural mismatches, missing considerations, and logic errors—before they become code.

### Pay Attention to Strategy and Reasoning

**Key questions:**

- How did the agent derive this plan?
- Was grounding thorough? (Did it read relevant files, check documentation, understand constraints?)
- Did it miss important considerations? (Security, performance, backwards compatibility, edge cases?)

Review the "why" behind the plan, not just the "what." If the agent says "Implement feature X using approach Y," ask yourself: Did it ground this decision in your codebase? Did it consider alternatives? Does the reasoning hold up?

**Example:** Agent proposes caching user sessions in Redis with 24-hour TTL. Good plan—but did it check your existing session implementation? Did it consider GDPR compliance for session data? Did it account for cache invalidation when users change passwords?

If grounding was shallow, stop and add context before execution:

```markdown
Before implementing, research our existing session management,
check for compliance requirements in COMPLIANCE.md, and propose cache
invalidation strategy for security-critical events.
Use ArguSeek, validate the approach against current security best practices.
```

### Glance Over Suggested Changes

Before autonomous execution, review the plan to catch architectural mismatches and scope issues. This applies [Lesson 4's constraint principles](../methodology/lesson-4-prompting-101.md#constraints-as-guardrails) during plan review—you're validating that the agent's proposed approach is sufficiently constrained and grounded before it executes.

**What you're checking:**

This is high-level architectural fit, not line-by-line code review (validation comes later). You're ensuring the agent is grounded in your actual architecture:

- **Pattern adherence** - Does this fit our established patterns? (If not, the agent wasn't grounded in existing code)
- **Module boundaries** - Are changes in the right modules? (If not, the agent didn't understand architecture)
- **Appropriate scope** - Is the agent trying to refactor half the codebase when you asked for a targeted fix?

**Example:** Agent plans to add email validation by creating a new validation library in `src/lib/validators/`. But you already have Zod schemas in `src/validation/`. This is a grounding failure—the agent generated a plausible solution from training patterns instead of discovering your existing validation approach.

Stop and correct:

```markdown
We use Zod for validation—check `src/validation/userSchema.ts` and follow that
pattern instead of creating a new library.
```

**Why this matters:** Catching grounding failures at the planning stage is faster than rewriting generated code. If the plan reveals shallow grounding, add constraints and force deeper research before execution.

### Watch For: Agents Invent Instead of Reusing

**The Problem:** When agents plan implementations, they default to generating plausible code from training patterns rather than discovering what already exists in your codebase. This is pattern completion, not codebase discovery—the agent synthesizes something that "looks right" based on millions of training examples instead of searching for your existing utilities, helpers, and abstractions.

Research confirms this bias: AI-generated code contains **8x more duplicated blocks** than human-written code, with declining code consolidation metrics across the industry[^1]. Agents reinvent the wheel because invention is statistically easier than discovery.

**Red Flags in Plans:**

Watch for these phrases during plan review—they signal the agent is inventing rather than discovering:

- "Create a new utility function for..." (Did it search for existing utilities?)
- "Implement a helper to handle..." (Does this helper already exist?)
- "Build error handling logic..." (What about existing error patterns?)
- "Add validation for..." (Check for existing validation schemas first)

## Checkpointing: Your Safety Net

Agents make mistakes frequently—especially while you're learning effective grounding and prompting patterns. The good news: as your skills improve, the need for rollbacks decreases dramatically. You'll naturally write better prompts, catch issues during plan review, and guide agents more effectively. But even experienced practitioners value checkpointing as a safety net. The difference between a frustrating session and a productive one comes down to how quickly you can roll back when things go wrong. Agentic coding is probabilistic—you need the ability to revert both conversation context and code changes when execution diverges from your intent.

Establish a checkpoint rhythm: create a restore point before risky operations, let the agent execute, validate results, then keep or revert. Modern AI coding tools (Claude Code, Cursor, VS Code Copilot, etc) include built-in checkpointing features that make rollback seamless—this lets you experiment aggressively without gambling on irreversible changes. If your tool lacks checkpointing, commit far more frequently than traditional development: after each successful increment, before risky operations, when changing direction, after manual corrections. This creates a safety net of verified checkpoints where each commit represents a known-good state you can return to instantly. The validation phase (covered in [Lesson 9](./lesson-9-reviewing-code.md)) determines whether you keep or discard changes—checkpointing makes that decision reversible.

:::tip Claude Code Checkpoints
Press ESC twice to create a checkpoint in Claude Code. This saves both conversation context and code state, letting you experiment aggressively and revert instantly if needed.
:::

## Autonomous Execution: Parallel Workflows and Tool Setup

Once the plan is reviewed and grounding is solid, you can let the agent execute autonomously. For complex features, parallel execution across multiple agent instances dramatically accelerates development.

### Git Worktrees: Enabling True Parallelization

Git worktrees allow multiple working directories from a single repository, each with a different branch checked out. This enables running multiple agent instances on different tasks simultaneously without conflicts.

**Basic setup:**

```bash
# Main repo in ~/project (on main branch)
git worktree add ../project-feature-auth feature/auth
git worktree add ../project-feature-api feature/api
git worktree add ../project-bugfix bugfix/login-error

# Now you have 4 separate directories:
# ~/project (main)
# ~/project-feature-auth (feature/auth branch)
# ~/project-feature-api (feature/api branch)
# ~/project-bugfix (bugfix/login-error branch)
```

**Agent-assisted setup:**

Agents can help generate worktree commands, especially when setting up multiple parallel environments. Ground with ArguSeek first for best practices, then ask the agent to generate commands.

```
Use ArguSeek to research git worktree best practices for parallel development.

Create 3 worktrees with the following specifications:
1. Authentication refactor (branch: feat/auth-refactor)
2. New analytics API (branch: feat/analytics-api)
3. Dashboard performance improvements (branch: perf/dashboard)

Output:
- Exact `git worktree add` commands for each worktree
- Recommended directory structure following best practices
```

The agent will research worktree workflows, propose a clean directory layout, and generate the exact commands. This is faster than reading documentation manually and ensures commands match your specific context.

:::tip Workflow Tooling for Parallel Development
Managing multiple worktrees and agent sessions requires efficient tooling. See **[Developer Tools](/developer-tools/terminals)** for terminal recommendations (Ghostty, Kitty, WezTerm) and **[CLI Tools](/developer-tools/cli-tools)** for modern git/file navigation tools (lazygit, eza, fzf). Mix CLI and IDE tools pragmatically—use what's most efficient for each task.
:::

## Key Takeaways

- **Questions load context, they don't verify knowledge** - "How does X work?" triggers search/read sequences that populate the context window with relevant information for subsequent execution steps. Questions are a context engineering tool.

- **Require evidence to force grounding** - Explicitly requiring evidence (file paths, line numbers, actual values) forces agents to retrieve information rather than guess. The agent cannot provide evidence without reading your actual code, converting hallucinated responses into grounded ones. Works independently or combined with Chain-of-Thought for complex tasks.

- **LLMs complete patterns, not logic** - Your engineering judgment validates architectural fit and catches logic errors. Agents handle syntax and boilerplate; you handle reasoning and correctness.

- **Review the plan's strategy and reasoning, not just the output** - Before autonomous execution, check: How was this plan derived? Was grounding thorough? Did it miss security, performance, or architectural considerations?

- **Watch for invention over reuse during plan review** - Agents default to generating plausible code from training patterns instead of discovering existing code. Red flags: "create new utility," "implement helper." Intervention: Force discovery first with evidence requirements before allowing implementation.

- **Checkpoint before execution, commit after validation** - Use built-in checkpointing features when available (Claude Code, Copilot, Cursor). Without them, commit far more frequently than traditional development—after each successful increment, before risky operations. Agents make frequent mistakes; checkpointing makes iteration fast and reversible.

- **Git worktrees enable true parallelization** - Multiple working directories from a single repository let you run concurrent agent instances on different branches without conflicts. Use agents to generate worktree setup commands grounded in best practices.

---

**Next:** [Lesson 8: Tests as Guardrails](./lesson-8-tests-as-guardrails.md)

[^1]: GitClear (2025) - Analysis of 211 million lines of code (2020-2024) showing 8-fold increase in duplicated code blocks (5+ duplicated lines) in AI-generated code. Source: [LeadDev: How AI-generated code accelerates technical debt](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt)
