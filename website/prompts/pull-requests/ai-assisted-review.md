---
title: AI-Assisted PR Review
sidebar_position: 2
---

import AIAssistedReview from '@site/shared-prompts/\_ai-assisted-review.mdx';

<AIAssistedReview />

### Overview

**Why two-step workflow with human validation:** Step 1 generates structured analysis using [Chain of Draft (CoD)](/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work) reasoning—5 words max per thinking step, reducing token consumption 60-80% while preserving reasoning quality. GitHub CLI integration (`gh pr view --comments`) provides [multi-source grounding](/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) beyond code diff: PR metadata, discussion threads, linked issues, author intent. The [persona directive](/methodology/lesson-4-prompting-101#assigning-personas) ("maintainer") biases toward critical analysis rather than generic approval. Evidence requirement ("never speculate...investigate files") forces code research before claims, preventing hallucinated issues. **Between steps, you validate findings**—LLMs can be confidently wrong about architectural violations. Cross-check file:line references, challenge vague criticisms. Step 2 then transforms validated analysis into dual-audience output: HUMAN_REVIEW.md (concise, actionable) and AGENT_REVIEW.md (efficient technical context). This mirrors the [PR Description Generator](/prompts/pull-requests/dual-optimized-pr) pattern—same context continuation, not fresh analysis.

**When to use—primary use cases:** Systematic PR review for architectural changes touching core modules, introducing new patterns, or significant refactoring. Most effective with AI-optimized description from [PR Description Generator](/prompts/pull-requests/dual-optimized-pr) (explicit file paths, module boundaries, breaking changes). Best used pre-merge as final validation in [Validate phase](/methodology/lesson-3-high-level-methodology#the-four-phase-workflow), not during active development (use [Comprehensive Review](/prompts/code-review/comprehensive-review) for worktree changes). The dual output files enable: HUMAN_REVIEW.md for maintainer discussion (1-3 paragraphs, praise + actionable focus), AGENT_REVIEW.md for downstream AI tools that may process the review. Less effective for trivial PRs (documentation-only, dependency updates, simple bug fixes) where review overhead exceeds value.

**Prerequisites:** [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated (`gh auth status`), [ChunkHound](https://chunkhound.github.io/) for codebase semantic search, [ArguSeek](https://github.com/ofrivera/ArguSeek) for learning human/LLM optimization patterns in Step 2. Requires PR link (URL or number), AI-optimized description from [PR Description Generator](/prompts/pull-requests/dual-optimized-pr) workflow. Outputs: Step 1 produces structured verdict (Summary/Strengths/Issues/Decision), Step 2 produces HUMAN_REVIEW.md and AGENT_REVIEW.md files. [Adapt Critical Checks for specialized focus](/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work): security (input validation, auth checks, credential handling, injection vectors), performance (complexity, N+1 queries, memory patterns, caching), accessibility (semantic HTML, keyboard nav, ARIA, contrast).

### Related Lessons

- **[Lesson 3: High-Level Methodology](/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** - Four-phase workflow (Research > Plan > Execute > Validate)—PR review is Validate phase
- **[Lesson 4: Prompting 101](/methodology/lesson-4-prompting-101#assigning-personas)** - [Persona directives](/methodology/lesson-4-prompting-101#assigning-personas), [Chain-of-Thought](/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), [constraints](/methodology/lesson-4-prompting-101#constraints-as-guardrails), structured output
- **[Lesson 5: Grounding](/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** - Multi-source grounding (GitHub CLI + code research + AI-optimized descriptions), explicit grounding directives
- **[Lesson 7: Planning & Execution](/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** - Evidence requirements force file:line citations, challenging vague claims
- **[Lesson 9: Reviewing Code](/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work)** - Chain of Draft (CoD) efficiency, dual-optimized PR workflow, specialized review adaptations
