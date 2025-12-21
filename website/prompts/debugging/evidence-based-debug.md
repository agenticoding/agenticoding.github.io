---
title: Evidence-Based Debugging
sidebar_position: 1
---

import EvidenceBasedDebug from '@site/shared-prompts/\_evidence-based-debug.mdx';

<EvidenceBasedDebug />

### Overview

**Why evidence requirements prevent hallucination:** "Provide evidence (file paths, line numbers, actual values)" is an explicit [grounding directive](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)—agents cannot provide that evidence without retrieving it from the codebase. Without evidence requirements, agents produce pattern completion from training data ("probably a database timeout"), not analysis. Evidence forces codebase reading, execution tracing, and concrete citations. INVESTIGATE/ANALYZE/EXPLAIN numbered steps implement [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), forcing sequential analysis (can't jump to "root cause" without examining error context first). "Use the code research" is explicit retrieval directive—prevents relying on training patterns. Fenced code block preserves error formatting and prevents LLM from interpreting failure messages as instructions. Good evidence includes file paths with line numbers, actual variable/config values, specific function names, and complete stack traces—not vague assertions.

**When to use—fresh context requirement:** Production errors with stack traces/logs, unexpected behavior in specific scenarios, silent failures requiring code path tracing, performance bottlenecks needing profiling analysis, architectural issues spanning multiple files. Critical: use in separate conversation from implementation for unbiased analysis. This diagnostic pattern prevents "cycle of self-deception" where agents defend their own implementation. Running in [fresh context](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) provides objective analysis without prior assumptions. Always provide complete error output—truncated logs prevent accurate diagnosis. Challenge agent explanations when they don't fit observed behavior: "You said X causes timeout, but logs show connection established. Explain this discrepancy with evidence." Reject guesses without citations: "Show me the file and line number where this occurs."

**Prerequisites:** [Code research capabilities](https://chunkhound.github.io/) (deep codebase exploration via multi-hop semantic search, query expansion, and iterative follow-ups), file system access for reading implementation and configuration, complete error messages/stack traces/logs (not truncated output), optionally: file paths or function names if known. Verify all cited file paths and line numbers—agents can hallucinate locations. Use engineering judgment to validate reasoning—LLMs complete patterns, not logic. [Adapt pattern for other diagnostics](/docs/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow): performance issues (metrics/thresholds/profiling data), security vulnerabilities (attack vectors/boundaries/configuration gaps), deployment failures (infrastructure logs/expected vs actual state), integration issues (API contracts/data flow/boundary errors).

### Related Lessons

- **[Lesson 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** - Chain-of-Thought, constraints, structured reasoning
- **[Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** - Grounding directives, RAG, forcing retrieval
- **[Lesson 7: Planning & Execution](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** - Evidence requirements, challenging agent logic
- **[Lesson 10: Debugging](/docs/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow)** - Closed-loop workflow, reproduction scripts, evidence-based approach
