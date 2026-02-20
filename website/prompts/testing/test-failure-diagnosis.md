---
title: Test Failure Diagnosis
sidebar_position: 1
---

import TestFailureDiagnosis from '@site/shared-prompts/\_test-failure-diagnosis.mdx';

<TestFailureDiagnosis />

### Overview

**Why systematic diagnosis prevents hallucination:** Fenced code block preserves error formatting and prevents LLM from interpreting failure messages as instructions. "Use the code research" is explicit [grounding directive](/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)—forces codebase search instead of hallucination from training patterns. DIAGNOSE numbered steps implement [Chain-of-Thought](/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), forcing sequential analysis (can't jump to "root cause" without examining test intent first). "Understand the intention" (step 2) ensures agent articulates WHY the test exists, not just WHAT it does—critical for distinguishing bugs from outdated requirements. DETERMINE binary decision [constrains output](/methodology/lesson-4-prompting-101#constraints-as-guardrails) to "bug vs outdated test" instead of open-ended conclusions. "Provide evidence" requires file paths and line numbers—concrete proof, not vague assertions.

**When to use—fresh context requirement:** Test failures during refactoring (determine if tests need updating or code has bugs), CI/CD pipeline failures (systematic root cause analysis), after implementing new features (analyze failures in existing suites). Critical: use in separate conversation from implementation for unbiased analysis. This diagnostic pattern prevents "cycle of self-deception" where agents defend their own implementation. Running in [fresh context](/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) provides objective analysis without prior assumptions. Include full stack traces and error messages—truncated output prevents accurate diagnosis. Without [grounding directive](/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality), agents hallucinate based on training patterns instead of reading your actual codebase.

**Prerequisites:** [Code research capabilities](https://chunkhound.github.io/) (deep codebase exploration via multi-hop semantic search, query expansion, and iterative follow-ups), access to both test files and implementation code, test failure output (stack traces, assertion errors, logs), file paths to relevant files. [Adapt pattern for other diagnostics](/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow): performance issues (metrics/thresholds/bottlenecks), security vulnerabilities (attack vectors/boundaries/gaps), deployment failures (logs/expected flow/configuration mismatches).

### Related Lessons

- **[Lesson 3: High-Level Methodology](/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** - Four-phase workflow (Research > Plan > Execute > Validate)
- **[Lesson 4: Prompting 101](/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** - Chain-of-Thought, constraints, structured format
- **[Lesson 7: Planning & Execution](/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** - Evidence requirements, grounding techniques
- **[Lesson 8: Tests as Guardrails](/practical-techniques/lesson-8-tests-as-guardrails#test-failure-diagnosis-agent-driven-debug-cycle)** - Three-context workflow, test failure diagnosis
