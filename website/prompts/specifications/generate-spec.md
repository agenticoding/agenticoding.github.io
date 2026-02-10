---
title: Generate System Specification
sidebar_position: 1
---

import GenerateSpec from '@site/shared-prompts/_generate-spec.mdx';

<GenerateSpec />

### Overview

**Why systematic extraction works:** Code research tools ([ChunkHound](/docs/methodology/lesson-5-grounding#code-grounding-choosing-tools-by-scale)) extract architectural knowledge from source code dynamically. The spec template transforms this raw information into structured thinking—modules, boundaries, contracts, state, failures—that surfaces constraints before implementation begins. This implements [multi-source grounding](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) for architectural understanding: code research provides the facts, the template provides the structure for reasoning about them.

**When to use this pattern:** Brownfield modifications (understand before changing), architectural investigation (how does this system work?), pre-planning for complex features (decompose before prompting), onboarding to unfamiliar codebases (extract the mental model). Most valuable when changes span multiple modules or touch unfamiliar code. Skip for isolated bug fixes where the context window serves as sufficient spec.

**Prerequisites:** [ChunkHound code research](https://chunkhound.github.io/) for codebase exploration, existing code to analyze. For new systems (greenfield), use the template directly as a design tool rather than extraction target. After extraction, validate claims with file:line evidence—agents hallucinate structure that doesn't exist. Delete specs after implementation; the code becomes the source of truth ([Lesson 12](/docs/practical-techniques/lesson-12-spec-driven-development)).

### Related Lessons

- **[Lesson 5: Grounding](/docs/methodology/lesson-5-grounding)** - Code research tools, semantic search, evidence requirements
- **[Lesson 12: Spec Driven Development](/docs/practical-techniques/lesson-12-spec-driven-development)** - Spec lifecycle, code as source of truth, delete after implementation
- **[Lesson 13: Systems Thinking for Specs](/docs/practical-techniques/lesson-13-systems-thinking-specs)** - Using the template as a thinking skeleton, matching formality to complexity
