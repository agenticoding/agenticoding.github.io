---
slug: faq
title: 'Frequently Asked Questions'
description: 'Common questions about agentic coding methodology, agentic development workflows, and directing AI coding agents for production software engineering.'
keywords: [agentic coding, agentic development, AI coding agents, vibe coding, vibe engineering, Claude Code, Copilot, prompt engineering, LLM programming]
---

import SchemaMarkup from '@site/src/components/SchemaMarkup';

export const faqData = {
  questions: [
    { question: "What is agentic coding?", answer: "Agentic coding is software development using AI agents that can perceive your codebase, reason about tasks, take actions (write code, run tests, execute commands), and iterate based on feedback. Unlike traditional chat interfaces, agents operate autonomously within guardrails you define. This course teaches a structured methodology—research, plan, execute, validate—that makes agentic coding reliable for production systems." },
    { question: "What is agentic development?", answer: "Agentic development extends agentic coding across the full software development lifecycle—from requirements gathering through deployment and maintenance. While agentic coding focuses on the act of writing and testing code with AI agents, agentic development encompasses the broader pipeline: spec-driven planning, automated testing, CI/CD integration, and production monitoring. While these terms overlap conceptually, industry literature typically maintains a scope distinction." },
    { question: "Who is this course for?", answer: "Senior software engineers with 3+ years of production experience who tried AI coding assistants and hit frustration points. You need strong fundamentals in architecture, design patterns, and system design because agentic coding moves your work up the stack—you make decisions and validate results, not write every line." },
    { question: "How do I get started with agentic coding?", answer: "Start with the fundamentals: understand how LLMs work (statistical pattern matching that enables reasoning), learn the agent loop (perceive-reason-act-observe-verify), then practice the four-phase workflow on a real task. Begin with supervised mode until you trust your grounding and validation process." },
    { question: "What is vibe coding?", answer: "Vibe coding, coined by Andrej Karpathy (February 2025), describes AI-assisted development where you 'fully give in to the vibes' and accept generated code without review. You describe what you want, paste error messages when things break, and iterate until it works—without understanding the code. It's effective for throwaway prototypes but produces unmaintainable, potentially insecure code unsuitable for production." },
    { question: "How is agentic coding different from vibe coding?", answer: "The difference is accountability. Vibe coding means accepting AI output without understanding it—you're a passenger. Agentic coding means directing AI agents through a structured workflow while owning every decision. You validate outputs, understand what ships, and maintain the codebase. Both use AI to generate code, but agentic coding treats the human as the accountable engineer, not a passenger." },
    { question: "What is vibe engineering?", answer: "Vibe engineering, coined by Simon Willison (October 2025), describes AI-assisted coding where you thoroughly review and understand generated code before shipping. It's a disciplined approach that amplifies established software engineering practices: automated testing, documentation, code review, and validation. Agentic coding shares this accountability principle but adds explicit structure: the four-phase workflow (research, plan, execute, validate) that makes AI-assisted development predictable and repeatable." },
    { question: "Which AI coding tools support agentic coding?", answer: "This course recommends CLI coding agents—Claude Code, Aider, or Codex CLI—because terminal-based tools enable parallelism: run multiple agent instances across different terminal tabs or git worktrees simultaneously. IDE agents (Cursor, Copilot) work but are coupled to single windows, limiting concurrent workflows. The methodology applies broadly, but CLI agents unlock the parallel execution model this course teaches." },
    { question: "Is agentic coding better than prompt engineering?", answer: "Prompt engineering optimizes individual prompts. Agentic coding is a complete methodology: research, plan, execute, validate. You still write prompts, but within a structured workflow that includes grounding agents in your codebase, reviewing plans before execution, and validating output against your mental model." },
    { question: "Why power tool instead of junior developer?", answer: "A power tool doesn't 'understand' what you're building—it executes based on how you operate it. You don't get frustrated when a circular saw cuts the wrong angle; you adjust your setup and technique. Same with AI agents. You own the results, validate through testing, and debug your input when output fails." },
    { question: "What is the agentic coding workflow?", answer: "Four phases: Research (ground agents in your codebase patterns and external domain knowledge), Plan (choose exploration or exact planning strategy, make architectural decisions), Execute (delegate to agents in supervised or autonomous mode), Validate (decide iterate or regenerate based on alignment with your mental model and automated checks). Skipping any phase dramatically increases failure rate." },
    { question: "Why do some developers report being slower with AI tools?", answer: "Studies show experienced developers are often slower on individual tasks with AI—despite believing they're faster. Speed per task is the wrong metric. This methodology teaches that the real productivity gain comes from parallelism: running multiple agents on different tasks while you attend meetings, review PRs, or handle other work. A senior engineer with three parallel agents ships more than one babysitting a single conversation." },
    { question: "Why does my AI agent hallucinate incorrect code?", answer: "Agents don't know your codebase exists. Without grounding, they generate from training data patterns frozen at their knowledge cutoff. The fix: inject your real code patterns, architectural constraints, and current documentation into context before asking for generation. Grounding significantly reduces hallucination by anchoring generation in your actual codebase." },
    { question: "Why does my AI agent forget context mid-task?", answer: "LLMs are stateless—they only know what's in the current context window. As conversations grow, older context scrolls out. The fix: deliberately load context before each task phase. Ask exploratory questions ('How does X work?') to trigger file reads that populate the window. Use hierarchical instruction files (CLAUDE.md) to persist architectural constraints. Grounding isn't a one-time step—it's continuous context engineering." },
    { question: "How do I stop AI agents from duplicating code?", answer: "Agents amplify existing patterns—they don't invent duplication. If your codebase has inconsistent patterns, agents replicate them. Before requesting new implementations, show existing ones. Force the agent to search for existing patterns first. Grounding in your actual code prevents reinvention." },
    { question: "Can AI agents review their own generated code?", answer: "Not in the same context. Agents reviewing their own work defend prior decisions—confirmation bias. They defend issues rather than identify them. For objective analysis, review in a fresh context (different conversation) where the agent has no memory of implementation decisions." },
    { question: "How do I validate AI-generated code efficiently?", answer: "Use the three-context workflow: generate code in Context A, write tests in a fresh Context B (the agent can't defend its implementation), and triage failures in Context C (objective analysis). Use sociable tests that exercise real code—mock only external systems. Tests define the operational boundaries agents cannot cross." },
    { question: "How do AI coding agents handle large codebases?", answer: "They don't load everything—they delegate research to sub-agents. A sub-agent explores your codebase in its own context, then returns a concise synthesis. Code research tools like ChunkHound scale to monorepo size by generating architectural reports that map components and relationships across millions of lines." },
    { question: "How do AI agents handle obscure bugs and latest package versions?", answer: "LLMs have knowledge cutoffs—they don't know about recent CVEs, breaking changes, or deprecated APIs. The fix: ground agents with real-time web research before generation. Tools like ArguSeek rapidly synthesize many sources so agents work with current facts rather than hallucinating from outdated patterns." }
  ]
};

<SchemaMarkup type="faq" data={faqData} />

## Getting Started

### What is agentic coding?

Agentic coding is software development using AI agents that can perceive your codebase, reason about tasks, take actions (write code, run tests, execute commands), and iterate based on feedback. Unlike traditional chat interfaces, agents operate autonomously within guardrails you define.

This course teaches a structured methodology—research, plan, execute, validate—that makes agentic coding reliable for production systems.

*Learn more in [Lesson 2: How Agents Work](/fundamentals/lesson-2-how-agents-work).*

### What is agentic development?

Agentic development extends agentic coding across the full software development lifecycle—from requirements gathering through deployment and maintenance. While agentic coding focuses on the act of writing and testing code with AI agents, agentic development encompasses the broader pipeline: spec-driven planning, automated testing, CI/CD integration, and production monitoring.

While these terms overlap conceptually, industry literature typically maintains a scope distinction.

*Learn more in [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology).*

### Who is this course for?

Senior software engineers with 3+ years of production experience who tried AI coding assistants and hit frustration points. You need strong fundamentals in architecture, design patterns, and system design because agentic coding moves your work up the stack—you make decisions and validate results, not write every line.

*Learn more in the [Course Introduction](/).*

### How do I get started with agentic coding?

Start with the fundamentals: understand how LLMs work (statistical pattern matching that enables reasoning), learn the agent loop (perceive-reason-act-observe-verify), then practice the four-phase workflow on a real task. Begin with supervised mode until you trust your grounding and validation process.

*Start with [Lesson 1: How LLMs Work](/fundamentals/lesson-1-how-llms-work).*

---

## Vibe Coding vs Agentic Coding

### What is vibe coding?

Vibe coding, [coined by Andrej Karpathy](https://x.com/karpathy/status/1886192184808149383) (February 2025), describes AI-assisted development where you "fully give in to the vibes" and accept generated code without review. You describe what you want, paste error messages when things break, and iterate until it works—without understanding the code.

It's effective for throwaway prototypes and personal scripts, but produces unmaintainable, potentially insecure code unsuitable for production systems.

*See [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology) for why this matters.*

### How is agentic coding different from vibe coding?

The difference is accountability. Vibe coding means accepting AI output without understanding it—you're a passenger. Agentic coding means directing AI agents through a structured workflow while owning every decision. You validate outputs, understand what ships, and maintain the codebase.

Both use AI to generate code, but agentic coding treats the human as the accountable engineer, not a passenger.

| | Vibe Coding | Agentic Coding |
|---|---|---|
| **Human role** | Passenger | Operator/Supervisor |
| **Code review** | None | Every output validated |
| **Architecture** | AI decides | Engineer decides |
| **Accountability** | None | Full ownership |
| **Use case** | Prototypes | Production systems |

*Learn more in [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology).*

### What is vibe engineering?

Vibe engineering, [coined by Simon Willison](https://simonwillison.net/2025/Oct/7/vibe-engineering) (October 2025), describes AI-assisted coding where you thoroughly review and understand generated code before shipping. It's a disciplined approach that amplifies established software engineering practices: automated testing, documentation, code review, and validation.

Agentic coding shares this accountability principle but adds explicit structure: the four-phase workflow (research, plan, execute, validate) that makes AI-assisted development predictable and repeatable.

*Learn more in [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology).*

---

## Terminology Quick Reference

| Term | Origin | Scope | Human Role |
|------|--------|-------|------------|
| **Vibe Coding** | Karpathy, Feb 2025 | Task-level | Passenger (no review) |
| **Vibe Engineering** | Willison, Oct 2025 | Task-level | Accountable reviewer |
| **Agentic Coding** | Industry, 2024-2025 | Task-level | Operator directing agents |
| **Agentic Development** | Industry, 2024-2025 | Full SDLC | Architect across pipeline |

**Two axes:**
- **Accountability:** Vibe coding (none) → Vibe engineering / Agentic coding (full)
- **Scope:** Agentic coding (the act) → Agentic development (the lifecycle)

While "agentic coding" and "agentic development" overlap conceptually, industry literature typically maintains this scope distinction.

---

## Tools & Methodology

### Which AI coding tools support agentic coding?

This course recommends **CLI coding agents**—Claude Code, Aider, or Codex CLI—because terminal-based tools enable parallelism: run multiple agent instances across different terminal tabs or git worktrees simultaneously.

IDE agents (Cursor, Copilot) work but are coupled to single windows, limiting concurrent workflows. Chat interfaces (ChatGPT, Copilot Chat) reset context between conversations—they're useful for brainstorming, not autonomous execution.

The methodology applies to any agent, but CLI agents unlock the parallel execution model this course teaches.

*Learn more in [Lesson 2: Agents Demystified](/fundamentals/lesson-2-how-agents-work) and [Lesson 7: Planning & Execution](/practical-techniques/lesson-7-planning-execution).*

### Is agentic coding better than prompt engineering?

Prompt engineering optimizes individual prompts. Agentic coding is a complete methodology: research, plan, execute, validate. You still write prompts, but within a structured workflow that includes grounding agents in your codebase, reviewing plans before execution, and validating output against your mental model.

*Learn more in [Lesson 4: Prompting 101](/methodology/lesson-4-prompting-101).*

### Why "power tool" instead of "junior developer"?

A power tool doesn't 'understand' what you're building—it executes based on how you operate it. You don't get frustrated when a circular saw cuts the wrong angle; you adjust your setup and technique. Same with AI agents. You own the results, validate through testing, and debug your input when output fails.

*Learn more in [Lesson 1: How LLMs Work](/fundamentals/lesson-1-how-llms-work).*

### What is the agentic coding workflow?

Four phases: Research (ground agents in your codebase patterns and external domain knowledge), Plan (choose exploration or exact planning strategy, make architectural decisions), Execute (delegate to agents in supervised or autonomous mode), Validate (decide iterate or regenerate based on alignment with your mental model and automated checks). Skipping any phase dramatically increases failure rate.

*Learn more in [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology).*

### Why do some developers report being slower with AI tools?

[Studies show](https://arxiv.org/abs/2507.09089) experienced developers are often slower on individual tasks with AI—despite believing they're faster. Speed per task is the wrong metric. This methodology teaches that the real productivity gain comes from parallelism: running multiple agents on different tasks while you attend meetings, review PRs, or handle other work. A senior engineer with three parallel agents ships more than one babysitting a single conversation.

*Learn more in [Lesson 3: The Four-Phase Workflow](/methodology/lesson-3-high-level-methodology).*

---

## Common Problems

### Why does my AI agent hallucinate incorrect code?

Agents don't know your codebase exists. Without grounding, they generate from training data patterns frozen at their knowledge cutoff. The fix: inject your real code patterns, architectural constraints, and current documentation into context before asking for generation. Grounding significantly reduces hallucination by anchoring generation in your actual codebase.

*Learn more in [Lesson 5: Grounding](/methodology/lesson-5-grounding).*

### Why does my AI agent forget context mid-task?

LLMs are stateless—they only know what's in the current context window. As conversations grow, older context scrolls out. This isn't a bug; it's fundamental to how transformer models work.

The fix: **deliberately load context** before each task phase. Ask exploratory questions ("How does our auth middleware work?") to trigger file reads that populate the window with relevant code. The agent's explanation now exists in context for subsequent implementation steps.

Use hierarchical instruction files (CLAUDE.md at repo and directory levels) to persist architectural constraints and patterns that should always be available. Grounding isn't a one-time upfront step—it's continuous context engineering throughout the session.

*Learn more in [Lesson 5: Grounding](/methodology/lesson-5-grounding) and [Lesson 7: Planning & Execution](/practical-techniques/lesson-7-planning-execution#prompt-to-explain-loading-context-into-the-window).*

### How do I stop AI agents from duplicating code?

Agents amplify existing patterns—they don't invent duplication. If your codebase has inconsistent patterns, agents replicate them. Before requesting new implementations, show existing ones. Force the agent to search for existing patterns first. Grounding in your actual code prevents reinvention.

*Learn more in [Lesson 11: Writing Agent-Friendly Code](/practical-techniques/lesson-11-agent-friendly-code).*

### Can AI agents review their own generated code?

Not in the same context. Agents reviewing their own work defend prior decisions—confirmation bias. They defend issues rather than identify them. For objective analysis, review in a fresh context (different conversation) where the agent has no memory of implementation decisions.

*Learn more in [Lesson 9: Reviewing Code](/practical-techniques/lesson-9-reviewing-code).*

### How do I validate AI-generated code efficiently?

Use the three-context workflow: generate code in Context A, write tests in a fresh Context B (the agent can't defend its implementation), and triage failures in Context C (objective analysis). Use sociable tests that exercise real code—mock only external systems. Tests define the operational boundaries agents cannot cross.

*Learn more in [Lesson 8: Tests as Guardrails](/practical-techniques/lesson-8-tests-as-guardrails).*

### How do AI coding agents handle large codebases?

They don't load everything—they delegate research to sub-agents. Even 1 million token context windows can't hold enterprise monorepos, and filling context degrades quality (U-shaped attention means the middle gets ignored).

The solution scales with codebase size: Under 10K lines, agentic search (Grep, Read, Glob) works fine. At 10-100K lines, add semantic search or sub-agents. Over 100K lines, you need code research—tools like [ChunkHound](https://chunkhound.github.io/code-research/) generate architectural reports that map components, relationships, and patterns across millions of lines.

*Learn more in [Lesson 5: Grounding](/methodology/lesson-5-grounding).*

### How do AI agents handle obscure bugs and latest package versions?

LLMs have knowledge cutoffs—they're trained on static datasets frozen at a point in time. They don't know about recent CVEs, breaking changes in newer package versions, deprecated APIs, or current best practices.

The fix: ground agents with real-time web research before generation. Instead of guessing from stale training data, agents query current documentation, changelogs, and community discussions.

[ArguSeek](https://github.com/ArguSeek/arguseek) is an MCP server for wide research—rapidly synthesizing many sources so agents work with current facts rather than hallucinating from outdated patterns. Combined with codebase grounding, this anchors generation in both your existing patterns and current reality.

*Learn more in [Lesson 5: Grounding](/methodology/lesson-5-grounding).*

---

**Ready to start?** Begin with [Lesson 1: How LLMs Work](/fundamentals/lesson-1-how-llms-work) or explore the [Prompt Library](/prompts).
