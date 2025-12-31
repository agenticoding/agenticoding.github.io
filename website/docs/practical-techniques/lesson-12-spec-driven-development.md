---
sidebar_position: 7
sidebar_label: 'Lesson 12: Spec Driven Development'
title: 'Lesson 12: Spec Driven Development'
---

import KnowledgeExpansionDiamond from '@site/src/components/VisualElements/KnowledgeExpansionDiamond';

**DRY. Single Source of Truth.** These aren't methodology buzzwords—they're sanity-preserving engineering practices. When the same information exists in multiple places, it drifts. One source says X, another says Y. Bugs follow.

Your codebase is a knowledge base. Every function, test, and constraint encodes knowledge about requirements, business rules, and implementation decisions. The same rules apply: don't duplicate knowledge, maintain one authoritative source.

Spec Driven Development (SDD) is a technique for adding or modifying knowledge in your codebase while respecting these principles.

## The SDLC Knowledge Expansion

Traditional software development follows a pattern of knowledge expansion:

<KnowledgeExpansionDiamond />

Each step adds new knowledge. The high-level spec captures the "what" and "why." The detailed design explores the "how"—edge cases, constraints, error handling, data flows. The code encodes implementation details, performance optimizations, and the full refined understanding of the problem.

This mirrors traditional waterfall, but with AI agents, it happens in hours rather than weeks. The key insight: **each layer is a knowledge expansion of the layer above**.

## The Duplicate Knowledge Problem

Once implementation is complete and the code passes tests ([Lesson 8](/docs/practical-techniques/lesson-8-tests-as-guardrails)) and review ([Lesson 9](/docs/practical-techniques/lesson-9-reviewing-code)), you have a problem: the same knowledge exists in three places—the spec, the design, and the code.

Which is correct?

The spec says "users can have at most 5 active sessions." The code implements a limit of 10. The design document mentions "configurable session limits." Three sources, three different truths.

This is exactly the [Knowledge Cache Anti-Pattern](/docs/practical-techniques/lesson-11-agent-friendly-code#the-knowledge-cache-anti-pattern) from Lesson 11. Saved specifications become stale the moment code changes. Future agents researching your codebase find both the outdated spec and the current code, leading to confusion and conflicting implementations.

Here's the key insight from [Lesson 5](/docs/methodology/lesson-5-grounding): **grounding tools already perform knowledge extraction.** When ChunkHound's [code research](https://chunkhound.github.io/code-research) processes 50,000 tokens of raw code and returns a 3,000-token synthesis, that synthesis IS a spec—extracted on-demand from the source of truth. You don't need to maintain spec files because you can regenerate them from code whenever needed.

**The solution: DELETE spec files after implementation.** The code is now the single source of truth. Specs are temporary scaffolding, not permanent artifacts.

## Mainstream SDD vs This Approach

Tools like [GitHub Spec Kit](https://github.com/github/spec-kit), [Amazon Kiro](https://kiro.dev/), and [Tessl](https://tessl.io/) get this backwards. They treat specifications as "permanent living artifacts" that evolve alongside code—the spec is the source of truth, code is the generated artifact.

**This violates [single source of truth](https://en.wikipedia.org/wiki/Single_source_of_truth).** The moment you have two representations of the same knowledge—a spec AND the code—you have a consistency problem. This isn't a new insight. It's why we eliminated header files where possible, why we generate API docs from code, why we generate OpenAPI specs from code annotations.

The "living spec" model assumes perfect bidirectional sync: code changes update specs, spec changes update code. In practice, developers modify code directly. The spec-code relationship isn't "drifting"—it's fundamentally broken because you've created two sources of truth for the same knowledge.

**The correct approach:**
- Code is the source of truth—period
- Specs are temporary scaffolding for the creation process
- Delete specs after implementation
- Regenerate specs on-demand from code when needed

Agentic search, semantic search, [ChunkHound](https://chunkhound.github.io)'s code research—these aren't just discovery tools. They're **knowledge extraction and compression engines**. The same 50,000 tokens of code can be compressed into different shapes depending on what you ask:

- "What does this module do?" → High-level spec (~100 lines)
- "How is authentication implemented?" → Detailed design (~1k lines)
- "What's the API contract?" → Interface documentation
- "What are the architectural boundaries?" → Component diagram

Same source of truth, different compression targets. The grounding process ([Lesson 5](/docs/methodology/lesson-5-grounding)) extracts exactly what you need, when you need it—no stale caches, no conflicting sources.

## Modifying Existing Code

When modifying existing code, the knowledge already lives in the implementation. Your job is to extract it, reshape it for whoever needs to approve or understand the change, modify it, then re-implement.

**Extract the spec from code.** Use [grounding techniques](/docs/methodology/lesson-5-grounding) to surface the current implementation as a spec. The shape of that spec depends on who needs it:

- **Product stakeholders** need behavioral specs: what users can do, what business rules apply, what outcomes to expect – `Users can have up to 5 concurrent sessions. When exceeded, the oldest session is terminated.`

- **Engineers** need systems specs: how components interact, data flows, architectural constraints – `SessionManager enforces MAX_SESSIONS=5 via Redis sorted set with TTL. Eviction uses LRU via ZREMRANGEBYRANK`

- **QA** needs constraint specs: boundaries, edge cases, error conditions – `Boundary: exactly 5 sessions allowed. Edge: 6th login evicts oldest. Constraint: session TTL is 24h. Error: Redis unavailable returns 503`

Same source code, different compression targets. Extract the right shape for your audience.

**Modify the spec, then gap-analyze.** Once you've edited the spec with your desired changes, perform gap analysis: compare the modified spec against the current implementation. What exists? What's missing? What conflicts? This bridges "where we are" to "where we want to be."

**Follow the four-phase workflow.** With the gap identified, apply the standard [Research → Plan → Execute → Validate](/docs/methodology/lesson-3-high-level-methodology) workflow. The modified spec feeds your planning phase; the gap analysis tells you exactly what needs to change.

**Clean up.** Delete temporary spec files and any test scaffolding. The code is now the source of truth again.

## The Context Window as Working Spec

If you've followed this course, you've been practicing SDD all along. Every time you:

- Grounded in the codebase before modifying it (extracting the spec)
- Described requirements in your prompt (updating the spec)
- Had the agent implement from those requirements (coding from spec)
- Closed the conversation when done (spec served its purpose)

...you were doing Spec Driven Development. The spec lived in your context window—RAM, not disk.

### When to Persist Specs

For single-session tasks, the context window is your spec file. But larger tasks need coordination across sessions:

**Persist specs when:**
- Work spans multiple days or sessions
- Scope exceeds comfortable context limits (~100k tokens)
- Multiple agents or people need to coordinate
- Architectural decisions need time to mature

**Keep specs ephemeral when:**
- Task completes in one session
- You're iterating quickly (hours, not days)
- Scope fits comfortably in context

Remember: specs are scaffolding, not architecture.

## Key Takeaways

- **Your codebase is a knowledge base** — Every line encodes knowledge about requirements, constraints, and decisions. Keep it consistent and conflict-free.

- **SDD adds knowledge systematically** — High-level spec → detailed design → code. Each step expands knowledge while maintaining coherence.

- **Specs have a lifecycle** — Single-session work uses the context window as spec. Multi-session projects need persisted files. Either way, delete specs after implementation—the code is the source of truth.

- **For modifications: extract → modify → implement → delete** — Surface existing knowledge as specs, modify them, then follow the normal workflow.

- **Regenerate specs on-demand** — Code research tools extract architectural knowledge dynamically. No need to maintain static documentation.
