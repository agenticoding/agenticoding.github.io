---
sidebar_position: 2
sidebar_label: 'Lesson 7: Planning & Execution'
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

## Autonomous Execution: Parallel Workflows and Tool Setup

Once the plan is reviewed and grounding is solid, you can let the agent execute autonomously. For complex features, parallel execution across multiple agent instances dramatically accelerates development.

### Git Worktree: Enable True Parallelization

Git worktrees allow multiple working directories from a single repository, each with a different branch checked out. This enables running multiple agent instances on different tasks simultaneously without conflicts.

**How it works:**

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

### Terminal Customization for Multi-Agent Workflows

**Invest in customizing and tailoring your terminal environment just like you would with your IDE.** Multi-agent workflows mean managing multiple concurrent sessions, context-switching between agent instances, and monitoring long-running processes. Your terminal becomes mission-critical infrastructure, not just a command prompt. Modern terminals offer IDE-level features—GPU acceleration, programmable layouts, rich scripting, notification systems, and extensive customization. Taking time to configure your terminal pays dividends across every development session.

Modern terminal options worth exploring: [**Ghostty**](https://ghostty.org) (fast, GPU-accelerated, native), [**Kitty**](https://sw.kovidgoyal.net/kitty/) (GPU-based, extensive graphics support), [**WezTerm**](https://wezterm.org) (Lua-configured, cross-platform), and [**Alacritty**](https://alacritty.org) (minimalist, OpenGL-accelerated). Each offers different customization approaches—compare based on your workflow needs.

**Use ArguSeek to learn terminal customization.** Research best practices for your chosen terminal, especially around session management, keybindings for rapid context switching, notification configuration, and visual indicators for different agent contexts. Example prompt:

```markdown
Use ArguSeek to research Kitty terminal customization for managing multiple
development sessions with different contexts and long-running processes.
```

### Modern CLI Tools for Efficient Workflows

Complement agent workflows with modern CLI tools that improve navigation, editing, and git operations:

- **[`micro`](https://micro-editor.github.io/)** - Terminal text editor with intuitive keybindings (Ctrl+S to save, Ctrl+Q to quit), ideal for quick edits without switching to your IDE.
- **[`eza`](https://eza.rocks/)** - Modern `ls` replacement with better formatting, file type colors, and git integration—easier to scan directories across multiple worktrees.
- **[`fzf`](https://junegunn.github.io/fzf/)** - Fuzzy finder for files, command history, and git branches; quickly locate files in large codebases or recall commands from previous sessions.
- **[`lazygit`](https://github.com/jesseduffield/lazygit)** - Terminal UI for git with visual branch management, interactive staging, and commit navigation—especially useful when managing multiple worktrees.

These tools reduce friction when working across multiple worktrees and agent sessions. Install and configure them once, benefit throughout your workflow.

### Ask Your Agent to Help with CLI Execution

Agents can assist with CLI operations, especially when you're unfamiliar with a tool or workflow. Ground with ArguSeek first for external tools, then ask the agent to generate commands or explain usage.

**Example:**

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

The agent will research worktree workflows, propose a clean directory layout, and generate the exact `git worktree add` commands. This is faster than reading documentation manually and ensures commands match your specific context.

### Mix CLI and UI Tools: Use What Works

Don't be dogmatic about terminal-only or GUI-only workflows. IDEs remain the best tools for code navigation, symbol search, and viewing large files. CLI excels at quick edits, git operations, and managing parallel sessions.

**Use the best tool for each task:**

- **Code navigation and exploration:** IDE (VS Code, IntelliJ, etc.) - superior symbol search, go-to-definition, call hierarchies
- **Quick edits in agent context:** CLI ([`micro`](https://micro-editor.github.io/), [`vim`](https://www.vim.org/)) - faster than switching to IDE for one-line changes
- **Git operations across worktrees:** CLI ([`lazygit`](https://github.com/jesseduffield/lazygit), raw git commands) - better visibility into multiple branches
- **Reading large files or complex logic:** IDE - better syntax highlighting, folding, and navigation

Pragmatism beats purism. These are all just tools—choose based on efficiency, not ideology.

## Key Takeaways

- **Questions load context, they don't verify knowledge** - "How does X work?" triggers search/read sequences that populate the context window with relevant information for subsequent execution steps. Questions are a context engineering tool.

- **Require evidence to force grounding** - Explicitly requiring evidence (file paths, line numbers, actual values) forces agents to retrieve information rather than guess. The agent cannot provide evidence without reading your actual code, converting hallucinated responses into grounded ones. Works independently or combined with Chain-of-Thought for complex tasks.

- **LLMs complete patterns, not logic** - Your engineering judgment validates architectural fit and catches logic errors. Agents handle syntax and boilerplate; you handle reasoning and correctness.

- **Review the plan's strategy and reasoning, not just the output** - Before autonomous execution, check: How was this plan derived? Was grounding thorough? Did it miss security, performance, or architectural considerations?

- **Watch for invention over reuse during plan review** - Agents default to generating plausible code from training patterns instead of discovering existing code. Red flags: "create new utility," "implement helper." Intervention: Force discovery first with evidence requirements before allowing implementation.

- **Git worktrees enable true parallel agent workflows** - Multiple working directories, separate branches, isolated agent contexts. Run 3 agent instances on different features simultaneously with zero interference.

- **Mix CLI and UI tools pragmatically** - IDEs for navigation, viewing and quick edits, CLI for refactors and parallel session management. Use the best tool for each task, not ideology.

---

**Next:** [Lesson 8: Tests as Guardrails](./lesson-8-tests-as-guardrails.md)

[^1]: GitClear (2025) - Analysis of 211 million lines of code (2020-2024) showing 8-fold increase in duplicated code blocks (5+ duplicated lines) in AI-generated code. Source: [LeadDev: How AI-generated code accelerates technical debt](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt)
