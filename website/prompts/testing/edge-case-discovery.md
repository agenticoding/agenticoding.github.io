---
title: Edge Case Discovery
sidebar_position: 2
---

import EdgeCaseDiscovery from '@site/shared-prompts/\_edge-case-discovery.mdx';

<EdgeCaseDiscovery />

### Overview

**Why two-step pattern prevents generic advice:** Step 1 loads concrete constraints—agent searches for function, reads implementation, finds existing tests. This populates context with actual edge cases from your codebase ("OAuth users skip email verification," "admin users bypass rate limits"). Step 2 identifies gaps—with implementation in context, agent analyzes what's NOT tested rather than listing generic test categories. [Grounding directives](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) force codebase search before suggesting tests. Existing tests reveal coverage patterns and domain-specific edge cases. Implementation details expose actual failure modes, not hypothetical ones. Prevents [specification gaming](/docs/practical-techniques/lesson-8-tests-as-guardrails#the-three-context-workflow) by discovering edge cases separately from implementation—similar to [fresh context requirement](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) for objective analysis.

**When to use—research-first requirement:** Before implementing new features (discover existing patterns), test-driven development (identify edge cases before implementation), increasing coverage (find gaps in existing suites), refactoring legacy code (understand implicit edge case handling), code review (validate PRs include relevant tests). Critical: Don't skip Step 1—asking directly "what edge cases should I test?" produces generic advice without codebase grounding. Be specific in Step 2 with domain-relevant categories (see examples in prompt). If you generate edge cases and implementation in same conversation, tests will match implementation assumptions—use this pattern in [fresh context](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) or before implementation. Without [grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality), agents hallucinate based on training patterns instead of analyzing your actual code.

**Prerequisites:** [Code research capabilities](https://chunkhound.github.io/) (deep codebase exploration via multi-hop semantic search, query expansion, and iterative follow-ups), access to implementation files and existing test suites, function/module name to analyze. After Step 1, agent provides implementation summary with file paths, currently tested edge cases with evidence from test files, special handling logic and conditional branches. After Step 2, agent identifies untested code paths with line numbers, missing edge case coverage with concrete examples from your domain, potential failure modes based on implementation analysis.

### Related Lessons

- **[Lesson 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** - Chain-of-Thought, structured prompts with sequential steps
- **[Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** - Loading codebase context before generation, preventing hallucination
- **[Lesson 7: Planning & Execution](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** - Research-first methodology, evidence requirements
- **[Lesson 8: Tests as Guardrails](/docs/practical-techniques/lesson-8-tests-as-guardrails#the-three-context-workflow)** - Three-context workflow, preventing specification gaming
