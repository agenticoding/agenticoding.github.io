---
title: Generate AGENTS.md
sidebar_position: 1
---

import GenerateAgentsMD from '@site/shared-prompts/\_generate-agents-md.mdx';

<GenerateAgentsMD />

### Overview

**Why multi-source grounding works:** [ChunkHound](/docs/methodology/lesson-5-grounding#code-grounding-choosing-tools-by-scale) provides codebase-specific context (patterns, conventions, architecture) while [ArguSeek](/docs/methodology/lesson-5-grounding#arguseek-isolated-context--state) provides current ecosystem knowledge (framework best practices, security guidelines)—this implements [multi-source grounding](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) to combine empirical project reality with ecosystem best practices. The [structured output format](/docs/methodology/lesson-4-prompting-101#applying-structure-to-prompts) with explicit sections ensures comprehensive coverage by forcing systematic enumeration instead of free-form narrative. The ≤200 line [conciseness constraint](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) forces prioritization—without it, agents generate verbose documentation that gets ignored during actual use. The non-duplication directive keeps focus on AI-specific operational details agents can't easily infer from code alone (environment setup, non-interactive command modifications, deployment gotchas). This implements the [Research phase](/docs/methodology/lesson-3-high-level-methodology#phase-1-research-grounding) of the [four-phase workflow](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow), letting agents build their own foundation before tackling implementation tasks.

**When to use this pattern:** New project onboarding (establish baseline context before first implementation task), documenting legacy projects (capture tribal knowledge systematically), refreshing context after architectural changes (re-run after migrations, framework upgrades, major refactors). Run early in project adoption to establish baseline [context files](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem), re-run after major changes, then manually add tribal knowledge (production incidents, team conventions, non-obvious gotchas) that AI can't discover from code. Without initial context grounding, agents hallucinate conventions based on training patterns instead of reading your actual codebase—this manifests as style violations, incorrect assumptions about architecture, and ignored project-specific constraints.

**Prerequisites:** [ChunkHound code research](https://chunkhound.github.io/) (deep codebase exploration via multi-hop semantic search, query expansion, and iterative follow-ups), [ArguSeek web research](https://github.com/ArguSeek/arguseek) (ecosystem documentation and current best practices), write access to project root. Requires existing codebase with source files and README/basic documentation to avoid duplication. After generation, [validate by testing with a typical task](/docs/methodology/lesson-3-high-level-methodology#phase-4-validate-the-iteration-decision)—if the agent doesn't follow documented conventions, the context file needs iteration. Without validation, you risk cementing incorrect assumptions into project context that compound across future tasks.

### Related Lessons

- **[Lesson 3: High-Level Methodology](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** - Four-phase workflow (Research > Plan > Execute > Validate), iteration decisions
- **[Lesson 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#applying-structure-to-prompts)** - Structured prompting, constraints as guardrails, information density
- **[Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding)** - Multi-source grounding (ChunkHound + ArguSeek), semantic search, sub-agents
- **[Lesson 6: Project Onboarding](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem)** - Context files (AGENTS.md, CLAUDE.md), hierarchical context, tribal knowledge
