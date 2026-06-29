---
sidebar_position: 1
sidebar_label: 'Four-Phase Workflow'
sidebar_custom_props:
  sectionNumber: 3
title: 'Four-Phase Workflow'
---

import OperatorCycleDiagram from '@site/src/components/VisualElements/OperatorCycleDiagram';
import ScrollDrivenFigure from '@site/src/components/animations/ScrollDrivenFigure';
import PlanningStrategyComparison from '@site/src/components/VisualElements/PlanningStrategyComparison';
import BookmarkTabsEmoji from '@site/src/components/VisualElements/BookmarkTabsEmoji';
import RobotEmoji from '@site/src/components/VisualElements/RobotEmoji';
import StraightRulerEmoji from '@site/src/components/VisualElements/StraightRulerEmoji';
import MicroscopeEmoji from '@site/src/components/VisualElements/MicroscopeEmoji';
import ExecutionModeComparison from '@site/src/components/VisualElements/ExecutionModeComparison';
import AirplaneEmoji from '@site/src/components/VisualElements/AirplaneEmoji';
import BabysitEmoji from '@site/src/components/VisualElements/BabysitEmoji';
import CompassEmoji from '@site/src/components/VisualElements/CompassEmoji';
import BullseyeEmoji from '@site/src/components/VisualElements/BullseyeEmoji';
import PromptExample from '@site/src/components/PromptExample';

[Lessons 1–2](../fundamentals/lesson-1-how-llms-work.mdx) established the operator mindset — you're directing tools, not writing every line. This lesson makes that practical: a systematic workflow for maintaining architectural control while delegating implementation at scale.

The core challenge: you can't read, verify, and mentally own 2,000 lines of generated implementation the way you owned 200 lines you wrote yourself. You ensure quality differently — by thinking systematically: Does this fit the architecture? Does it follow our patterns? Does the behavior match my mental model?

You read _selectively_. When an agent generates 50 files, you review at the system level: module responsibilities, inputs and outputs, state management, integration points. You spot-check where your mental model says "this is risky."

Here's the counterintuitive reality: **properly prompted AI-generated code is often easier to read than hand-written code**. LLMs follow patterns with mechanical precision. When you provide quality patterns and clear constraints, they replicate them perfectly. Your job shifts from ensuring every implementation detail is correct to ensuring the patterns themselves are correct.

**One thing doesn't change: you own the results.** Every line of agent-generated code ships under your name, regardless of which tool writes the implementation.

## The Four-Phase Workflow

Every significant agent interaction should follow this pattern:

<ScrollDrivenFigure phaseEnd={0.5}>
  <OperatorCycleDiagram />
</ScrollDrivenFigure>

Each phase has a distinct purpose, and skipping any one of them dramatically increases your failure rate. Let's walk through each phase in detail.

## <MicroscopeEmoji size={28} /> Phase 1: Research (Grounding) {#phase-1-research-grounding}

You wouldn't start coding in a new codebase without first learning the architecture, patterns, and conventions. And you probably keep Google and Stack Overflow open while you work. Your agent needs the same context.

This is **grounding**—the bridge between the general-purpose knowledge and patterns embedded in the model and the actual real-world context it needs to operate in. Without grounding, agents hallucinate patterns, invent inconsistent APIs, and miss your existing implementations.

<a href="https://chunkhound.github.io/" target="_blank" rel="noopener noreferrer" style={{display:'block',textAlign:'center',marginBottom:'var(--space-2)'}}>
  <img src="/img/wordmarks/chunkhound.svg" alt="ChunkHound" className="wordmark-heading wordmark-light" />
  <img src="/img/wordmarks/chunkhound-dark.svg" alt="ChunkHound" className="wordmark-heading wordmark-dark" />
</a>

For code context, you need semantic code search. [ChunkHound](https://chunkhound.github.io/) performs **code deep research**—answering architectural questions like "How is authentication handled?" or "What's the error handling pattern?" instead of just keyword matching. It retrieves the relevant patterns and implementations from your codebase.

<a href="https://github.com/ArguSeek/arguseek" target="_blank" rel="noopener noreferrer" style={{display:'block',textAlign:'center',marginBottom:'var(--space-2)'}}>
  <img src="/img/wordmarks/arguseek.svg" alt="ArguSeek" className="wordmark-heading wordmark-heading-sm" />
</a>

For domain knowledge, ArguSeek pulls information from Google directly and efficiently into your context. Need the latest API docs? Best practices from a specific framework? An algorithm buried in a 50-page research paper PDF? A solution from a GitHub issue? ArguSeek retrieves it and makes it available to your agent—no manual tab-switching, copy-pasting, or context reconstruction.

**We'll cover both tools in detail in Lesson 5.** For now, understand the principle: ground your agent in both your codebase and domain knowledge before planning changes.

## <BookmarkTabsEmoji size={28} /> Phase 2: Plan (Strategic Decision) {#phase-2-plan-strategic-decision}

With research complete, you now plan the change. Planning isn't a single approach—it's a strategic choice based on whether you know the solution or need to discover it.

<PlanningStrategyComparison />

<!-- presentation-only-start -->

**Planning strategy comparison - both approaches are valid depending on project phase and certainty level. Use neutral styling.**

<!-- presentation-only-end -->

<CompassEmoji size={22} /> **Exploration Planning:** Use this when the solution space is unclear or you need to discover the best approach. Rather than dictating a solution, frame the problem space and steer the agent to research your codebase patterns (via ChunkHound) and domain knowledge (via ArguSeek), explore alternatives, and iterate with you through reasoning-action cycles. You're discovering the approach together.

This approach has higher cost and time investment, but it discovers better solutions, catches architectural issues early, and helps you build a clearer mental model before committing to implementation.

<PromptExample>
Our <code>Express</code> API has inconsistent error handling—some endpoints return raw errors, others JSON, and stack traces leak to production. Use <code>ChunkHound</code> to search for <code>"error handling patterns"</code> and <code>"error response format"</code> in our codebase. Use <code>ArguSeek</code> to research <code>Express</code> error handling best practices and <code>RFC 7807</code>. Analyze what you find, propose 2-3 standardization approaches with trade-offs, and recommend one.
</PromptExample>

<BullseyeEmoji size={22} /> **Exact Planning:** Use this when you know the solution and can articulate it precisely. Be directive. Define the task with specificity, specify integration points and patterns to follow, provide explicit constraints and requirements, list edge cases you've identified, and define clear acceptance criteria. The agent executes along a predetermined path.

This approach is faster and more cost-effective, but requires upfront clarity and architectural certainty—if your plan is wrong or incomplete, the generated code will be wrong. Use exact planning when you've already done the architectural thinking and just need reliable, consistent implementation.

<PromptExample>
Add rate limiting middleware to <code>/api/*</code> using <code>Redis</code>.<br />
Follow the pattern in <code>src/middleware/auth.ts</code>.<br />
Authenticated users: <code>1000 req/hour</code>, anonymous: <code>100 req/hour</code>, admins unlimited.<br />
Return <code>429</code> with <code>Retry-After</code> header.<br />
Fail open if <code>Redis</code> is down - log warning but allow request through.
</PromptExample>

### Building Your Mental Model

As you plan, you're refining your mental model of the system. You're not memorizing code—you're understanding relationships:

- How authentication flows through middleware
- Where data validation happens vs. business logic
- How errors propagate to the client
- Where performance bottlenecks might appear
- What security boundaries exist

This mental model is what allows you to validate generated code quickly. When the agent completes, you don't read every line. You check: "Does this fit my mental model of how this system works?" If yes, it's probably correct. If no, either your model is wrong (update it) or the code is wrong (regenerate).

:::tip Plan Mode Across Different Tools

**Claude Code:** Press `Shift+Tab` to enter dedicated plan mode for strategic discussion before execution.

**Other tools (Copilot CLI, Codex, Cursor, etc.):** Most AI coding assistants lack built-in plan mode. Use this baseline prompt template to simulate it:

<details>
<summary>Click to expand: Generic Plan Mode Prompt Template</summary>

```markdown
# PLANNING MODE - READ ONLY

You are in planning mode. DO NOT make any code edits or modifications.

## Your Task

Analyze the following request and create a comprehensive execution plan:

[USER REQUEST HERE]

## Instructions

1. **Think deeply** about the problem before responding. Consider:
   - What is the actual goal vs. stated request?
   - What are potential edge cases or complications?
   - What assumptions am I making?

2. **Ask clarifying questions** if ANY of these are unclear:
   - Requirements or expected behavior
   - Scope boundaries (what's in/out of scope)
   - Success criteria
   - Technical constraints or preferences
   - Existing architecture or patterns to follow

3. **Draft a structured execution plan** with:

   **SCOPE**
   - What will be changed
   - What will NOT be changed
   - Affected components/files

   **REQUIREMENTS**
   - Functional requirements
   - Non-functional requirements (performance, security, etc.)
   - Dependencies or prerequisites

   **IMPLEMENTATION PLAN**
   - Step-by-step breakdown
   - For each step, specify:
     - File(s) to modify
     - Type of change (add/modify/delete)
     - Key logic or patterns to implement

   **VALIDATION**
   - How to verify success
   - Test cases or scenarios to cover
   - Potential risks or rollback plan

## Output Format

- Use clear headers and bullet points
- Be specific about file paths and function names
- Flag any uncertainties or assumptions

Ask your clarifying questions first, then provide the plan.
```

</details>

This template provides a solid baseline for any planning task. In [Lesson 4: Prompting 101](./lesson-4-prompting-101.mdx), you'll learn the prompt engineering principles behind this structure so you can construct your own custom planning prompts rather than relying on templates.

:::

## <RobotEmoji size={28} /> Phase 3: Execute (Two Execution Modes) {#phase-3-execute-two-execution-modes}

<!-- presentation-only-start -->

**Execution modes comparison - both approaches are valid depending on context (learning stage, task criticality, grounding quality). Use neutral styling.**

<!-- presentation-only-end -->

<ExecutionModeComparison />

With your plan complete, you execute—but how you interact with the agent during execution fundamentally changes your productivity. There are two modes: supervised (actively watching and steering) and autonomous (fire-and-forget). Most engineers start with supervised mode to build trust, then gradually shift to autonomous mode as they develop stronger grounding and planning skills. Here's the counterintuitive truth: the real productivity gain isn't about finishing individual tasks faster. It's about working on multiple projects simultaneously and maintaining extremely long work stretches. That's where 10x productivity actually hides.

### <BabysitEmoji size={22} /> Supervised Mode ("Babysitting")

In supervised mode, you actively monitor the agent as it works. You watch each action, review intermediate outputs, steer when it drifts, and intervene when it makes mistakes. This gives you maximum control and precision—you catch issues immediately and guide the agent toward the right solution in real time. The cost is massive: your throughput tanks because you're blocked while the agent works. You can't context-switch to another task, you can't step away, and you're burning your most valuable resource (attention) on implementation details. Use this mode when you're learning how agents behave, when working on critical security-sensitive code, or when tackling complex problems where you need to build your mental model as the agent explores. This is your training ground for developing the trust and intuition that eventually allows you to let go.

### <AirplaneEmoji size={22} /> Autonomous Mode ("Autopilot" / "YOLO")

In autonomous mode, you give the agent a well-defined task from your plan, let it run, and check the results when it's done. You're not watching it work. You're doing other things—working on a different project, attending a meeting, cooking dinner, running errands. You might check your phone occasionally to see if it's blocked or needs clarification, but mostly you're away. This is where the real productivity transformation happens, and it's not what most people think. Yes, sometimes the agent finishes a task faster than you would manually. But that's not the point. The point is **parallel work** and **continuous output**. You can have three agents running simultaneously on different projects. You can maintain 8-hour stretches of productive output while only spending 2 hours at your keyboard. You can genuinely multitask in software development for the first time in history. Even if you could hand-code something in 20 minutes and the agent takes 30, autonomous mode wins if it means you're cooking dinner instead of being blocked. This mode depends entirely on excellent grounding (Phase 1) and planning (Phase 2). If you skip those phases, the agent will drift, hallucinate, and produce garbage. If you do them well, you can trust the agent to execute correctly without supervision. Your goal is to maximize time in autonomous mode—that's where you become genuinely more productive, not just slightly faster.

:::tip The Real 10x Productivity Gain
Autonomous mode isn't about speed per task. It's about working on multiple tasks simultaneously while living your life. A senior engineer running three autonomous agents in parallel while attending meetings and cooking dinner ships more code than the same engineer babysitting one agent through a single task. That's the actual game changer.
:::

## <StraightRulerEmoji size={28} /> Phase 4: Validate (The Iteration Decision) {#phase-4-validate-the-iteration-decision}

The agent completed. Here's the reality: **LLMs are probabilistic machines that almost never produce 100% perfect output on first pass.** This isn't failure—it's expected behavior.

Your validation goal isn't perfection verification. It's accurately identifying what's wrong or missing, then making a critical decision: **iterate with fixes or regenerate from scratch?**

This is art more than science, but remember: code generation is cheap. Don't get attached to the output. A general rule of thumb:

**Iterate when:** The output is aligned with your expectations but has gaps—missing edge cases, some tech debt, incomplete error handling, or pattern inconsistencies. The foundation is right; it needs refinement.

**Regenerate when:** Something fundamental is wrong—the architecture doesn't match your mental model, the agent misunderstood requirements, or the approach itself is flawed. Don't patch fundamentally broken code. Fix the context and regenerate.

**The key principle:** It's usually easier to fix your context (the prompt, examples, constraints) than to fix the generated code. Think of yourself as debugging your input, not the output.

### Run Your Code

Nothing beats actually running your implementation. Be the user. Test the happy path, try to break it, check edge cases. Does it handle errors gracefully? Is performance acceptable? Five minutes of manual testing reveals more than an hour of code review.

### Use the Agent Itself

The agent is better at finding issues in code than generating perfect code on the first try. Use it to review its own work—we'll cover this self-review technique in [Lesson 10](../practical-techniques/lesson-10-reviewing-code.md). Similarly, have the agent create tests as guardrails—covered in [Lesson 9](../practical-techniques/lesson-9-tests-as-guardrails.md).

**Automated checks still matter:** Run your build, tests, and linters. If these fail, you have clear signal that iteration or regeneration is needed. If they pass, manually verify behavior matches your plan and mental model.

## Closing the Loop

This workflow isn't linear—it's iterative. Validation often reveals gaps in your research or flaws in your plan. That's expected. The value isn't executing each phase perfectly the first time; it's having a systematic framework that catches issues before they compound.

The operator mindset from the opening matters here: you're not validating by reading every line. You're validating against your mental model. Does the architecture match your plan? Do the patterns align with your grounding? Does the behavior satisfy your requirements? If yes, ship it. If no, identify whether the problem is context (regenerate) or refinement (iterate).

This workflow is the strategic framework. But strategy means nothing without execution, and execution happens through communication. Every phase—research queries, planning prompts, execution instructions, validation reviews—depends on how precisely you communicate with the agent. The workflow tells you _what_ to do. Prompting tells you _how_ to do it effectively.

---

**Next:** [Lesson 4: Prompting 101](./lesson-4-prompting-101.mdx) - Learn the specific techniques for crafting effective prompts that get reliable results.
