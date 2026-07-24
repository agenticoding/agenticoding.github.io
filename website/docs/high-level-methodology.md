---
title: 'Four-Phase Workflow'
---

import OperatorCycleDiagram from '@site/src/components/VisualElements/OperatorCycleDiagram';
import ExecutionPortfolioDiagram from '@site/src/components/VisualElements/ExecutionPortfolioDiagram';
import GroundingDistillationDiagram from '@site/src/components/VisualElements/GroundingDistillationDiagram';
import PlanningContractCheckpointDiagram from '@site/src/components/VisualElements/PlanningContractCheckpointDiagram';
import ValidationClaimBenchDiagram from '@site/src/components/VisualElements/ValidationClaimBenchDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

An AI coding agent is a harness that wraps a language model in an action loop: prepare context, call the model, execute tools, observe results, and continue. The model at its core predicts the next token from whatever context it receives — verification against reality only happens through the harness's tool execution loop, not inside the model itself. A well-crafted prompt can shape one interaction toward a clear target and constraints, but that is a single turn in a larger process.

Those three mechanics — how the model generates from context, how the harness turns prediction into action, how prompt-level control shapes individual interactions — are enough to understand how agents work. They are not enough to operate them on production work.

Production tasks span days or weeks of work for a skilled operator — far larger than a single context window. You need to decide what reality the agent must see in each session, how the work should be split across contexts, how much autonomy is safe, and what evidence proves the result is acceptable. Those are operator decisions. They determine whether the agent's work converges on your actual goal or merely produces a plausible artifact.

This chapter introduces that operating workflow. Each phase answers one operator question:

1. **Grounding** — what reality does the agent need before it acts? Pull in the code patterns, product constraints, external facts, and prior decisions that define success for this specific task.
2. **Plan** — what is the intended shape of the work? Define what to add, remove, change, and protect; break the task into bounded units the agent can complete reliably; and place checkpoints before risky decisions propagate.
3. **Execute** — which ready unit should run now, and which returned artifact deserves your attention next? Schedule bounded work streams so that agent execution overlaps with grounding, plan review, validation, or a decision on another unit.
4. **Validate** — did the result actually meet the goal? Check the artifact from multiple angles, then decide whether to accept it, iterate on a smaller unit, re-ground, re-plan, or regenerate.

## The Four-Phase Workflow

<DiagramFrame kicker="Methodology" title="The operator loop" size="standard">
    <OperatorCycleDiagram />
</DiagramFrame>

The workflow is cyclic because agent failures have different causes. Missing local knowledge means grounding was weak. A wrong approach means planning was weak. Incomplete implementation means execution should be narrowed or repeated. Low confidence after a working result means validation needs another angle.

The goal is not to make the first pass perfect. The goal is to know which phase failed, route the work back to the right point, and keep the agent operating inside boundaries you understand.

This matters more than it sounds. Even with perfect grounding, perfect planning, and disciplined execution, you are operating a stochastic system. The agent is governed by probabilities, not logic. It will make random mistakes — at the wrong time, in unexpected places, and usually where you are least looking. This is not a bug in your process. It is the nature of the beast. Embrace it, expect it, and build your workflow to catch and correct those failures rather than trying to eliminate them.

## Phase 1: Grounding {#phase-1-grounding}

The main agent — the orchestrator — has a limited context window. Every token of raw source material — a codebase grep, a web search result, a git log — competes for space with the planning, execution, and verification work it still needs to do. The more raw research you dump in, the less room it has to operate effectively.

The solution is not to make the orchestrator do its own research. It is to delegate research to a dedicated sub-agent: a grounding agent that searches the raw sources, filters what matters, and returns only a compact distilled answer. The grounding agent explores broadly in its own context. The orchestrator gets the relevant facts, not the noise.

<DiagramFrame kicker="Methodology" title="Grounding distills research into usable context" size="wide" caption="The grounding agent absorbs noisy sources, distills usable working context, and leaves the root orchestrator to ask targeted follow-ups only when pieces are missing.">

  <GroundingDistillationDiagram />

</DiagramFrame>
The grounding agent searches whatever sources encode relevant knowledge for the task. Two cover most needs:

- **Code grounding** — how your system works: module responsibilities, integration points, naming conventions, error handling patterns, test contracts, and established invariants.
- **Web grounding** — how the external world works: current framework docs, API references, migration guides, security advisories, and production patterns. The model's training data is stale for fast-moving ecosystems.

A third source, **git history**, comes up in specific tasks — prior migrations, reverted approaches, bug fixes that encode hidden constraints, and architectural decisions captured in commits. Beyond these, any artifact qualifies: specs, Jira tickets, emails, presentations, Slack threads, transcripts, design docs.

Not every harness has built-in sub-agent support. Claude Code spawns Explore sub-agents for this. [ChunkHound](https://chunkhound.github.io/) [disclosure] is built for this pattern. When your setup doesn't support sub-agents, the same pattern works across context boundaries: run grounding in one session, save a research artifact — a markdown file with the distilled findings — then load it into a fresh session and continue to planning. The mechanism changes — sub-agent vs. artifact handoff — but the principle is identical: the orchestrator receives compact context, not raw exploration.

:::tip
[ChunkHound](https://chunkhound.github.io/) [disclosure] implements the grounding agent pattern — it researches code, web, and git history, then returns synthesized findings to the orchestrator. Other tools follow the same general architecture.
:::

The operator's job during grounding is to choose which sources the grounding agent should search, review the distilled output for completeness, send targeted follow-ups when facts are missing, and decide when grounding is sufficient to proceed to planning. A grounding session is complete when the compact context that reaches the orchestrator covers the architecture, conventions, constraints, and evidence the task needs — and you know which gaps remain.

If you don't provide context explicitly, the agent will gather it on its own — a capability called agentic search. Models are benchmarked on this ability; [SWE-bench](https://www.swebench.com), the standard benchmark for coding agents, measures how well agents navigate unfamiliar codebases autonomously. But agentic search happens inside the orchestrator's context. Every line of grepped output, every fetched page, every failed hypothesis competes for the same limited space the agent needs for planning and execution. Explicit grounding with a dedicated sub-agent avoids this cost by isolating the exploration in its own context and returning only the answer.

There is a deeper reason to ground explicitly. The agent doesn't know what it doesn't know. It will assume it has everything at hand while missing critical knowledge — the naming convention that isn't documented, the constraint from a reverted PR, the integration point in a different service. Worse, the big picture often isn't fully encoded anywhere: why this product choice was made, what alternatives were considered and ruled out, which business constraints shape the solution space, what the team already tried and abandoned. When you ground explicitly, you're filling both kinds of gaps — the ones scattered across the codebase and the ones buried in Slack threads, emails, presentations, and support tickets.

## Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Grounding gives the agent facts. It does not decide the shape of the change.

After grounding, the agent may know the middleware pattern, the product constraint, and the existing tests. It still does not know which trade-off you want, which cleanup is out of scope, or which boundary must not move. If execution starts there, those choices get made inside the diff.

Planning is the pause between knowing and doing. The plan itself is a checkpoint: a small execution contract that a human can approve, reject, or correct before the agent turns ambiguity into code.

<DiagramFrame kicker="Methodology" title="A plan is an approved execution contract" size="wide" caption="The operator reviews scope, unit, and verification before the agent turns intent into code.">

  <PlanningContractCheckpointDiagram />

</DiagramFrame>

The useful planning question is not "what is every step?" It is "what decision would be expensive to discover only after code exists?" Answer that before execution.

A good plan makes two things visible:

- **Scope:** what to add, remove, change, and protect.
- **Unit:** the next bounded piece of work, with its input, output, dependency, and verification signal.

For rate limiting, that might be enough: add limiter behavior in the existing middleware location, use the established cache abstraction, preserve current auth behavior, and test authenticated users, anonymous users, and exceeded limits. That is not a full implementation plan. It is a reviewed handoff from planning to execution.

Older prompt advice treated plans as todo lists so the model would remember what to do. That still helps, but it is not the main value. A plan works because it makes intent inspectable before the agent turns ambiguity into code.

Planning is complete when execution can begin from a reviewed contract instead of an unresolved conversation. The reliability mechanics behind task sizing and why phase-boundary review works belong in [Reliability Levers: Orchestration](./reliability-levers.md#2-orchestration-change-the-shape-of-the-work) and [Reliability Levers: HITL Checkpoints](./reliability-levers.md#4-human-in-the-loop-hitl-checkpoints-break-error-propagation).

## Phase 3: Execute {#phase-3-execute}

Execution is where the human coordinates several in-flight operator loops.

A plan admits one bounded unit into execution: it names the scope, dependency, expected artifact, stop condition, and validation route. The harness then gives that unit an autonomous window — it prepares context, calls the model, executes tools, observes results, and continues. While Agent A uses that window to implement, the operator monitors the active streams at a depth matched to each agent's risk profile and to their own capacity to context-switch: stay close to high-risk work, check lower-risk work periodically, and let bounded low-risk work run unattended.

Think in the gaps between agent actions. Start Agent A on an approved implementation unit. While it searches, edits, and runs tests, review Agent B's plan. Then help Agent C get ready for its task: point it to the design system, clarify the user flow, or answer the product question it cannot infer. When Agent A finishes, compare what it produced with what the plan asked for and decide what happens next. That is **phase concurrency**: keeping several agents moving while allocating attention where risk and available context-switching capacity justify it.

<DiagramFrame kicker="Methodology" title="Execution keeps human judgment ahead of agent work" size="wide" caption="The operator monitors agents as they work, adjusting attention to each agent's risk profile and to their own capacity for context switching.">

  <ExecutionPortfolioDiagram />

</DiagramFrame>

### Choose how to stay involved

An approved plan gives the agent a clear target. The right monitoring depth depends on the task's risk profile and how much context switching you can sustain.

| Approach                  | What you do                                                                                                                                           | Good fit                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Let it run**            | Give the agent a bounded task, work on something else, then meet at the end to compare what it produced with the plan.                                | A small, familiar change with clear checks.                                       |
| **Work alongside it**     | Watch the steps, answer questions, and steer decisions as they happen.                                                                                | A new area of the codebase, an architecture decision, or security-sensitive work. |
| **Check in periodically** | Move between active agent tabs, watch each one briefly, and confirm its latest work still points in the right direction. Leave it alone when it does. | A longer task where the final result would be too late to discover a wrong turn.  |

Use the lightest approach that gives you enough confidence. If the task is clear and easy to check, letting it run creates time to review another plan, prepare the next task, or validate finished work. If the agent will make decisions you need to own, stay close. For longer work, rotate through the active tabs: look at the latest actions, confirm the direction, and move on unless the agent needs help.

The productivity gain is not that every agent task finishes faster than a skilled human would finish it. It comes from using the time between those check-ins for other useful work, without losing sight of what each agent is building.

## Phase 4: Validation {#phase-4-validation}

Agents are probabilistic generators. Even with strong grounding, an approved plan, and disciplined execution, an agent can miss a constraint, invent an API, or produce work that is locally correct but fails in production. A plausible artifact is not evidence that it will hold under the conditions where it must operate.

Validation is how the operator builds measurable confidence in that uncertain process. The agent produces a candidate; the system and the person responsible for the outcome decide whether the evidence is sufficient to accept it. Without validation, acceptance is faith in a likely-looking continuation.

Start before choosing a test or review technique:

1. **State the claim.** What must remain true? For example: a checkout completes correctly after a declined payment, or a generated page remains usable at campaign volume.
2. **Set the tolerance.** How much error, delay, degradation, or manual intervention can this claim tolerate? This is a product decision: higher confidence costs more time and evidence.
3. **Define the operating profile.** Specify the representative environments and conditions in which the claim must hold: real user workflows, data shapes and volume, permissions, dependency failures, retries, and credible malformed or adversarial inputs.
4. **Gather evidence against that profile.** Choose the smallest portfolio of checks whose remaining blind spots the claim can tolerate.

<DiagramFrame kicker="Methodology" title="The claim meets its real world" size="wide" caption="Preset tolerance and representative operating conditions turn a plausible artifact into an evidence-backed acceptance decision.">

  <ValidationClaimBenchDiagram />

</DiagramFrame>

A build, test suite, or reviewer verdict is only useful when it measures part of that predefined claim under representative conditions. Passing checks prove their stated properties; they do not prove requirements nobody expressed.

Use complementary evidence because every technique has blind spots: deterministic checks protect known machine-verifiable contracts; LLM judges extend evaluation where the rubric is explicit but manual review does not scale; people apply situated product and risk judgment; exploratory agents vary credible operating conditions to discover requirements that are not yet encoded. For high-impact claims, collect independent evidence and retain human ownership of the acceptance decision.

Validation continues after release. Controlled exposure, telemetry, sampled review, and rollback test the claim against real behavior. Confirmed failures become new operating-profile conditions and deterministic regression protection.

Evidence should identify what to change next. Do not treat every failed check as an implementation bug: return to the phase that introduced the uncertainty.

| What the evidence shows | Next action |
| --- | --- |
| The candidate has a local defect or misses a known edge case | Fix that bounded unit, then measure it again. |
| The candidate relied on a missing or incorrect codebase fact, API, or constraint | Re-ground before attempting another implementation. |
| The proposed solution or task sequence is wrong | Re-plan the work before executing again. |
| The target is clear, but this candidate is unreliable | Generate independent candidates and compare them with independent evidence. |
| The evidence conflicts, or accepting an error would be costly | Add a human acceptance checkpoint. |
| Exploration or production reveals a confirmed new failure mode | Add it to the operating profile and protect it with a regression check. |

Read [Validation](./validation.md) for the full framework: defining claims and operating profiles, calibrating deterministic checks and LLM judges, manual acceptance, exploratory discovery, and production evidence.

## Closing the Loop

The four phases are a control system, and each phase addresses a specific limitation:

- **Grounding** addresses the context problem. The model generates from context — it does not check its output against reality. Grounding ensures the context contains the right facts before the agent acts.
- **Planning** addresses the orchestration problem. Complex work is a sequence of prompts, not one perfect prompt. Planning decomposes the task into bounded units the harness loop can execute.
- **Execution** addresses the coordination problem. The harness gives each agent run a bounded autonomous window; the operator schedules independent work streams and applies judgment to the next compact artifact that returns.
- **Verification** addresses the probabilistic problem. Ownership never moves — the model generates candidates, you accept them. The model will make mistakes. Verification is how you catch them before they ship.

This is the operator loop. You are not trying to personally type every line or review every token. You are designing the conditions under which useful artifacts are likely — grounding the right context, planning the right units, scheduling bounded execution, then verifying the result from enough angles to own it.

A prompt shapes one interaction. This chapter shows where those interactions fit in the operator loop: grounding queries, orchestration plans, execution instructions, and verification reviews.

---

**Next:** [Chapter 5: Context Engineering](./context-engineering.mdx) — how to keep grounded facts small, timely, and visible enough to use.
