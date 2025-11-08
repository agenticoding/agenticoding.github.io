---
sidebar_position: 4
sidebar_label: 'Lesson 9: Reviewing Code'
title: 'Reviewing Code'
---

You've completed the implementation. Tests pass. The agent executed your plan successfully. Now comes the critical question: is it actually correct?

This is the **Validate** phase from [Lesson 3's four-phase workflow](../methodology/lesson-3-high-level-methodology.md)—the systematic quality gate before shipping. Code review catches the probabilistic errors that agents inevitably introduce: subtle logic bugs, architectural mismatches, edge cases handled incorrectly, patterns that don't quite fit your codebase.

The key insight: **review in a fresh context, separate from where the code was written.** This prevents confirmation bias and leverages the stateless nature of agents from [Lessons 1](../understanding-the-tools/lesson-1-intro.md) and [2](../understanding-the-tools/lesson-2-understanding-agents.md). An agent reviewing its own work in the same conversation will defend its decisions. An agent in a fresh context analyzes objectively, without attachment to prior choices.

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

```markdown
You are a contributor to {PROJECT_NAME} creating a GitHub pull request for the current branch.
Using the sub task tool to conserve context, explore the changes in the git history relative to main.
Summarize and explain them like you would to a fellow co-worker:

- Direct and concise
- Professional but conversational
- Assume competence and intelligence
- Skip obvious explanations

The intent of the changes are:
{CHANGES_DESC}

Building upon this, draft two markdown files: one for a human reviewer/maintainer for the project
and another complementary that's optimized for the reviewer's agent. Explain:

- What was done and the reasoning behind it
- Breaking changes, if any exist
- What value it adds to the project

Constraints:

- The human optimized markdown file should be 1-3 paragraphs max
- Agent optimized markdown should focus on explaining the changes efficiently

Use ArguSeek, learn how to explain and optimize both for humans and LLMs.
Use the code research to learn the overall architecture, module responsibilities and coding style.
```

### Mechanisms at Work

**Sub-agents for context conservation ([Lesson 5](../methodology/lesson-5-grounding.md#solution-2-sub-agents-for-context-isolation)):**

The instruction "Using the sub task tool to conserve context" spawns a separate agent for git history exploration, preventing the main orchestrator's context from filling with commit diffs. The sub-agent returns only synthesized findings. Without this, exploring 20-30 changed files consumes 40K+ tokens, pushing critical constraints into the U-shaped attention curve's ignored middle.

This sub-agent capability is unique to Claude Code CLI (early 2025). Other tools (Cursor, Windsurf, GitHub Copilot, Cody) require splitting this into multiple sequential prompts: explore first, then draft based on findings.

**Multi-source grounding ([Lesson 5](../methodology/lesson-5-grounding.md#production-pattern-multi-source-grounding)):** ArguSeek researches PR best practices while ChunkHound grounds descriptions in your actual codebase architecture and coding style.

**Structured prompting ([Lesson 4](../methodology/lesson-4-prompting-101.md)):** Persona, communication constraints, format boundaries, and structural requirements direct the agent to produce dual-optimized outputs.

**Evidence requirements ([Lesson 7](./lesson-7-planning-execution.md#require-evidence-to-force-grounding)):** The prompt forces grounding through "explore the changes" and "learn the architecture"—the agent cannot draft accurate descriptions without reading actual commits and code.

### Applying This Pattern

**When to use it:** You have a feature branch with multiple commits ready for review. Your team uses AI-assisted code review tools (GitHub Copilot, CodeRabbit, Qodo Merge, etc.) alongside human reviewers.

**Implementation:**

Replace the placeholders in the prompt pattern above:

- **`{PROJECT_NAME}`**: Your actual project name
- **`{CHANGES_DESC}`**: Brief description of your intended changes (1-2 sentences)

Run the prompt in Claude Code CLI, or adapt for your tool by removing the sub-agent instruction if your tool doesn't support context-isolated agents.

**Validate the outputs:**

The human-optimized description should be:

- Scannable—lead with value, mention key files/changes, highlight breaking changes prominently
- Concise—1-3 paragraphs that communicate the "why" and business value

The AI-optimized description should be:

- Comprehensive—explicit terminology, structured sections, specific file paths
- Unambiguous—no vague pronouns ("it", "them"), architectural decisions enumerated clearly

**Integration into workflow:**

- **GitHub PR description**: Use the human-optimized version
- **Separate markdown file** (e.g., `PR_REVIEW_CONTEXT.md`): Commit the AI-optimized version to help reviewers' AI assistants
- **Commit message**: Reference both: "See PR description for summary, PR_REVIEW_CONTEXT.md for detailed technical context"

## Key Takeaways

- **Review in fresh context to prevent confirmation bias** - An agent reviewing its own work in the same conversation will defend its decisions. Fresh context provides objective analysis.

- **Apply the same four-phase methodology to reviewing** - Research (understand intent) → Plan (structure review) → Execute (perform analysis) → Validate (decide to ship, fix, or regenerate).

- **Use structured review prompts with Chain-of-Thought** - The review template from this lesson applies Lesson 4's prompting principles: persona, CoT, structure, grounding, constraints. Adapt this pattern for security reviews, performance analysis, or architectural validation.

- **Iterate until green light or diminishing returns** - Fix issues, then re-review in fresh context. Stop when findings become trivial nitpicks or the agent hallucinates problems that don't exist.

- **Evidence requirements force grounding** - "Provide file paths and line numbers" from [Lesson 7](./lesson-7-planning-execution.md#require-evidence-to-force-grounding) ensures review findings are based on actual code, not statistical guesses.

### Production Workflow

Codify this review process in your project's `.claude.md` or `AGENTS.md` file ([Lesson 6](./lesson-6-project-onboarding.md)) so agents automatically trigger systematic reviews after completing implementation tasks:

```markdown
# Post-Implementation Review Protocol

After completing any code generation task:

1. Open a fresh context (new conversation)
2. Use the review template from Lesson 9
3. Include: original requirements, architectural constraints, changeset
4. Review findings systematically (Architecture → Quality → Maintainability → UX)
5. Fix critical issues, then repeat review in fresh context
6. Iterate until green light or diminishing returns
```

This makes systematic review a standard practice, not an afterthought.

---

**Next:** [Lesson 10: Debugging with AI](./lesson-10-debugging.md)
