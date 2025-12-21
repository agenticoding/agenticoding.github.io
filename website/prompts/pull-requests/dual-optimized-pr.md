---
title: PR Description Generator
sidebar_position: 1
---

import DualOptimizedPR from '@site/shared-prompts/\_dual-optimized-pr.mdx';

<DualOptimizedPR />

### Overview

**Why dual-audience optimization works:** [Sub-agents](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) conserve context by spawning separate agents to explore git history—without this delegation, 20-30 file changes consume 40K+ tokens, pushing critical constraints into the [attention curve's ignored middle](/docs/methodology/lesson-5-grounding#the-scale-problem-context-window-limits). [Multi-source grounding](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) combines ArguSeek (PR best practices from GitHub docs and engineering blogs) with ChunkHound (project-specific architecture patterns, module responsibilities), preventing generic advice divorced from your codebase realities. The "co-worker" [persona framing](/docs/methodology/lesson-4-prompting-101#assigning-personas) with explicit style [constraints](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) (direct, concise, assume competence, skip obvious) prevents verbose explanations that waste reviewer attention. Dual constraints balance audiences: "1-3 paragraphs max" for humans prevents overwhelming maintainers with walls of text, while "explain efficiently" keeps AI context comprehensive but structured—critical because [AI reviewers](/prompts/pull-requests/ai-assisted-review) need architectural context (file relationships, module boundaries) that humans infer from experience.

**When to use—workflow integration:** Before submitting PRs with complex changesets (10+ files, multiple modules touched, cross-cutting concerns) or cross-team collaboration where reviewers lack deep module familiarity. Integrate into [four-phase workflow](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow): complete implementation → validate with tests → self-review for issues → fix discovered problems → generate dual descriptions → submit PR with both files. Be specific with `$CHANGES_DESC`—vague descriptions ("fix bugs", "update logic") produce generic output because [grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) requires concrete intent. Without specific change description, agent has no anchor to evaluate "what matters" in the git diff. Critical: if you manually edit generated descriptions post-generation, regenerate BOTH files—stale context in AI-optimized description causes [hallucinations during review](/docs/practical-techniques/lesson-9-reviewing-code) when architectural explanations contradict actual changes. For teams without AI reviewers yet, human-optimized output alone provides concise summaries that respect reviewer time.

**Prerequisites:** [Sub-agent/task tool](/docs/methodology/lesson-5-grounding#solution-2-sub-agents-for-context-isolation) ([Claude Code CLI](/developer-tools/cli-coding-agents#claude-code) provides built-in Task tool—other platforms require manual context management via sequential prompts), [ArguSeek](https://github.com/ofrivera/ArguSeek) (web research for PR best practices), [ChunkHound](https://chunkhound.github.io/) (codebase research via multi-hop semantic search and iterative exploration), git history access with committed changes on feature branch. Requires base branch for comparison (typically `main` or `develop`), architecture documentation ([CLAUDE.md project context](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem), AGENTS.md for agentic workflows). Agent generates two markdown files: **human-optimized** (1-3 paragraphs covering what changed, why it matters, breaking changes if any, value delivered) and **AI-optimized** (file paths with line numbers, module responsibilities, architectural patterns followed, boundary changes, testing coverage, edge cases addressed). [Adapt this pattern](/docs/practical-techniques/lesson-7-planning-execution) for other documentation needs: release notes (user-facing features vs technical changelog), incident postmortems (executive summary vs technical root cause analysis), design docs (stakeholder overview vs implementation deep-dive).

**For actual review**, use these prompts with the generated artifacts:

- **[AI-Assisted PR Review](/prompts/pull-requests/ai-assisted-review)** — Review PRs using the AI-optimized description with GitHub CLI integration
- **[Comprehensive Code Review](/prompts/code-review/comprehensive-review)** — Review worktree changes before committing (pre-PR stage)

### Related Lessons

- **[Lesson 2: Agents Demystified](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage)** - Sub-agents, task delegation, context conservation
- **[Lesson 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#assigning-personas)** - Persona, constraints, attention curves
- **[Lesson 5: Grounding](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding)** - Multi-source grounding, preventing hallucination
- **[Lesson 9: Reviewing Code](/docs/practical-techniques/lesson-9-reviewing-code)** - Dual-audience optimization, PR workflows, AI-assisted review
