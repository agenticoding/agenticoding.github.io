---
sidebar_position: 4
sidebar_label: 'Reviewing Code'
sidebar_custom_props:
  sectionNumber: 9
title: 'Reviewing Code'
---

import DualOptimizedPR from '@site/shared-prompts/\_dual-optimized-pr.mdx';
import AIAssistedReview from '@site/shared-prompts/\_ai-assisted-review.mdx';

You've completed the implementation. Tests pass. The agent executed your plan successfully. Now comes the critical question: is it actually correct?

This is the **Validate** phase from [Lesson 3's four-phase workflow](../methodology/lesson-3-high-level-methodology.md)—the systematic quality gate before shipping. Code review catches the probabilistic errors that agents inevitably introduce: subtle logic bugs, architectural mismatches, edge cases handled incorrectly, patterns that don't quite fit your codebase.

The key insight: **review in a fresh context, separate from where the code was written.** This prevents confirmation bias and leverages the stateless nature of agents from [Lesson 1: LLMs Demystified](../fundamentals/lesson-1-how-llms-work.md) and [Lesson 2: Agents Demystified](../fundamentals/lesson-2-how-agents-work.md). An agent reviewing its own work in the same conversation will defend its decisions. An agent in a fresh context analyzes objectively, without attachment to prior choices.

:::info Agent-Only vs Mixed Codebases: A Critical Distinction

The same engineering standards—DRY, YAGNI, architecture, maintainability, readability—apply to all codebases. What differs is coding style optimization and the review process:

**Agent-only codebases** are maintained exclusively by AI with minimal human intervention at the code level. Optimize coding style slightly toward AI clarity: more explicit type annotations, slightly more verbose documentation, detailed architectural context files ([Lesson 6](./lesson-6-project-onboarding.md)). Review question: "Will an agent understand this 6 months from now?"

**Mixed codebases** balance human and AI collaboration where both work directly with code. Optimize coding style for human brevity while maintaining AI navigability. **Most production codebases fall into this category.**

**Critical difference in mixed codebases:** Add a manual review step where you fully read and audit AI-generated code before committing to ensure human readability. This is non-negotiable—without explicit project rules guiding style, agents generate code following patterns from their training data that may not match your team's readability standards. Tune your project rules ([Lesson 6](./lesson-6-project-onboarding.md)) to guide agents toward the writing style humans expect, then verify the output meets those expectations.

:::

## The Review Prompt Template

This template integrates techniques from [Lesson 4: Prompting 101](../methodology/lesson-4-prompting-101.md). Understanding **why** each element exists lets you adapt this pattern for other review tasks (security audits, performance analysis, architectural review).

```markdown
You are an expert code reviewer. Analyze the current changeset and provide a critical review.

The changes in the working tree were meant to: $DESCRIBE_CHANGES

Think step-by-step through each aspect below, focusing solely on the changes in the working tree.

1. **Architecture & Design**
   - Verify conformance to project architecture
   - Check module responsibilities are respected
   - Ensure changes align with the original intent

2. **Code Quality**
   - Code must be self-explanatory and readable
   - Style must match surrounding code patterns
   - Changes must be minimal - nothing unneeded
   - Follow KISS principle

3. **Maintainability**
   - Optimize for future LLM agents working on the codebase
   - Ensure intent is clear and unambiguous
   - Verify comments and docs remain in sync with code

4. **User Experience**
   - Identify areas where extra effort would significantly improve UX
   - Balance simplicity with meaningful enhancements

Review the changes critically. Focus on issues that matter.
Use ChunkHound's code research.
DO NOT EDIT ANYTHING - only review.
```

After implementing code ([Lesson 7](./lesson-7-planning-execution.md)), writing tests ([Lesson 8](./lesson-8-tests-as-guardrails.md)), and making everything pass, this review step catches what the iterative development process left behind—the final quality gate before committing.

:::tip Reference
See the complete prompt template with iterative review guidance: [Comprehensive Code Review](/prompts/code-review/comprehensive-review)
:::

### Iterative Review: Repeat Until Green or Diminishing Returns

Code review is rarely one-pass—first review finds issues, you fix them, re-run tests ([Lesson 8](./lesson-8-tests-as-guardrails.md)) to catch regressions, then review again in a fresh context (not the same conversation where the agent will defend its prior decisions). Continue this cycle: review in fresh context, fix issues, validate with tests, repeat.

**Review itself is probabilistic**—it's also an LLM making statistical predictions. The agent can be wrong. It might suggest "fixes" that break working code or introduce regressions that your test suite catches.

This is where operator judgment becomes essential (the "art" of the process):

- **Tests passing + review green** = ship
- **Tests passing + review nitpicking** = ship
- **Tests failing after review "fixes"** = the review was probably wrong, reject the suggestion

Stop iterating when you reach either a **green light** (no substantive issues, tests pass) or **diminishing returns**. Diminishing returns manifest as:

- **Nitpicking**: Trivial style preferences like "rename this variable"
- **Hallucinations**: Agent invents non-existent issues or suggests patterns that don't fit your architecture
- **Review-induced test failures**: The "fix" broke previously working code
- **Excessive cost**: 4+ iterations for minor remaining issues

At that point, trust your tests as the objective arbiter and ship the code—further AI review costs more than it provides and risks degrading quality.

## Pull Requests for Human and AI Reviewers

Pull requests serve two audiences: human maintainers and their AI review assistants. These audiences process information fundamentally differently:

- **Human reviewers** scan quickly, infer meaning from context, and value concise summaries (1-3 paragraphs max). They want to understand the "why" and business value at a glance.

- **AI review assistants** parse content chunk-by-chunk, struggle with vague pronouns and semantic drift, and need explicit structure ([Lesson 5](../methodology/lesson-5-grounding.md)). They require detailed technical context: specific file changes, architectural patterns, breaking changes enumerated clearly.

Traditional PR descriptions optimize for one audience or the other—too verbose for humans, too vague for AI agents. The solution: generate both in a coordinated workflow using sub-agents.

### The Advanced Prompt Pattern

This prompt demonstrates multiple techniques from [Lesson 4 (Prompting 101)](../methodology/lesson-4-prompting-101.md), [Lesson 5 (Grounding)](../methodology/lesson-5-grounding.md), and [Lesson 7 (Planning & Execution)](./lesson-7-planning-execution.md):

<DualOptimizedPR />

### Mechanisms at Work

**Sub-agents for context conservation ([Lesson 5](../methodology/lesson-5-grounding.md#solution-2-sub-agents-for-context-isolation)):**

The instruction "Using the sub task tool to conserve context" spawns a separate agent for git history exploration, preventing the main orchestrator's context from filling with commit diffs. The sub-agent returns only synthesized findings. Without this, exploring 20-30 changed files consumes 40K+ tokens, pushing critical constraints into the U-shaped attention curve's ignored middle.

This sub-agent capability is unique to [Claude Code CLI](/developer-tools/cli-coding-agents#claude-code). Other tools (Codex, GitHub Copilot) require splitting this into multiple sequential prompts: explore first, then draft based on findings.

**Multi-source grounding ([Lesson 5](../methodology/lesson-5-grounding.md#production-pattern-multi-source-grounding)):** ArguSeek researches PR best practices while ChunkHound grounds descriptions in your actual codebase architecture and coding style.

**Structured prompting ([Lesson 4](../methodology/lesson-4-prompting-101.md)):** Persona, communication constraints, format boundaries, and structural requirements direct the agent to produce dual-optimized outputs.

**Evidence requirements ([Lesson 7](./lesson-7-planning-execution.md#require-evidence-to-force-grounding)):** The prompt forces grounding through "explore the changes" and "learn the architecture"—the agent cannot draft accurate descriptions without reading actual commits and code.

:::tip Reference
See the complete prompt template with workflow integration tips: [PR Description Generator](/prompts/pull-requests/dual-optimized-pr)
:::

### Reviewing PRs with AI Assistants

When you're on the receiving end of a PR with dual-optimized descriptions, you have structured context for both human understanding and AI-assisted review. This section shows how to leverage both descriptions effectively.

#### Consuming the Dual Descriptions

**The human-optimized description** (PR description on GitHub):

- Read first to understand the "why" and business value
- Quickly scan for breaking changes and key files affected
- Use this to form your initial mental model of the changeset

**The AI-optimized description** (`PR_REVIEW_CONTEXT.md` or similar):

- Feed this to your AI review assistant (GitHub Copilot, Codex, Claude Code, etc)
- Provides comprehensive technical context the AI needs for accurate analysis
- Contains explicit terminology, file paths, and architectural patterns

#### The Review Prompt Pattern

When reviewing a PR with dual-optimized descriptions, use this pattern with your AI assistant:

<AIAssistedReview />

:::tip Reference
See the complete prompt template with Chain of Draft explanation: [AI-Assisted PR Review](/prompts/pull-requests/ai-assisted-review)
:::

:::tip Chain of Draft (CoD): An Efficient Alternative to Chain of Thought

**Notice the technique in Review Process step 2 above:**

> "Think step by step, but only keep a minimum draft for each thinking step, with 5 words at most. Return the assessment at the end of the response after a separator ####."

This is **Chain of Draft (CoD)**—an optimization of Chain of Thought (CoT) prompting that maintains structured reasoning while being more efficient.

**How it works:** Instead of generating verbose step-by-step explanations, CoD instructs the LLM to think through each step but keep the draft concise (5 words max per step), then return the final assessment after a separator (`####`).

**Why use it for reviews:** CoD provides the same reasoning benefits as CoT—breaking down complex analysis into logical steps—but with reduced token consumption and faster response times.

**Learn more:**

- [Original research paper](https://arxiv.org/abs/2502.18600)
- [Learn Prompting documentation](https://learnprompting.org/docs/advanced/thought_generation/chain-of-draft)

:::

## Key Takeaways

- **Review in fresh context to prevent confirmation bias** - An agent reviewing its own work in the same conversation will defend its decisions. Fresh context provides objective analysis.

- **Apply the same four-phase methodology to reviewing** - Research (understand intent) → Plan (structure review) → Execute (perform analysis) → Validate (decide to ship, fix, or regenerate).

- **Use structured review prompts with Chain-of-Thought** - The review template from this lesson applies Lesson 4's prompting principles: persona, CoT, structure, grounding, constraints. Adapt this pattern for security reviews, performance analysis, or architectural validation.

- **Iterate until green light or diminishing returns** - Fix issues, then re-review in fresh context. Stop when findings become trivial nitpicks or the agent hallucinates problems that don't exist.

- **Evidence requirements force grounding** - "Provide file paths and line numbers" from [Lesson 7](./lesson-7-planning-execution.md#require-evidence-to-force-grounding) ensures review findings are based on actual code, not statistical guesses.

- **Generate dual-optimized PR descriptions for human and AI reviewers** - Humans need concise, scannable summaries (1-3 paragraphs). AI assistants need comprehensive, unambiguous technical context. Generate both in a coordinated workflow to serve both audiences effectively.

- **Leverage AI-optimized context when reviewing PRs** - When reviewing a PR with dual descriptions, feed the AI-optimized description to your review assistant. This provides the grounding and architectural context needed for accurate analysis, reducing hallucinations and improving review quality.

---

**Next:** [Lesson 10: Debugging with AI](./lesson-10-debugging.md)
