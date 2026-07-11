---
title: 'Four-Phase Workflow'
---

import OperatorCycleDiagram from '@site/src/components/VisualElements/OperatorCycleDiagram';
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
import GroundingDistillationDiagram from '@site/src/components/VisualElements/GroundingDistillationDiagram';
import PlanningContractCheckpointDiagram from '@site/src/components/VisualElements/PlanningContractCheckpointDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

An AI coding agent is a harness that wraps a language model in an action loop: prepare context, call the model, execute tools, observe results, and continue. The model at its core predicts the next token from whatever context it receives — verification against reality only happens through the harness's tool execution loop, not inside the model itself. A well-crafted prompt can shape one interaction toward a clear target and constraints, but that is a single turn in a larger process.

Those three mechanics — how the model generates from context, how the harness turns prediction into action, how prompt-level control shapes individual interactions — are enough to understand how agents work. They are not enough to operate them on production work.

Production tasks span days or weeks of work for a skilled operator — far larger than a single context window. You need to decide what reality the agent must see in each session, how the work should be split across contexts, how much autonomy is safe, and what evidence proves the result is acceptable. Those are operator decisions. They determine whether the agent's work converges on your actual goal or merely produces a plausible artifact.

This chapter introduces that operating workflow. Each phase answers one operator question:

1. **Grounding** — what reality does the agent need before it acts? Pull in the code patterns, product constraints, external facts, and prior decisions that define success for this specific task.
2. **Plan** — what is the intended shape of the work? Define what to add, remove, change, and protect; break the task into bounded units the agent can complete reliably; and place checkpoints before risky decisions propagate.
3. **Execute** — how much autonomy is safe for this unit? Choose supervised, autonomous, or hybrid execution based on grounding quality, task scope, blast radius, and verification clarity.
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

Execution is about maximizing the time the agent works reliably without you watching.

The harness loop gives the agent autonomy: it prepares context, calls the model, executes tools, observes results, and continues. The operator's job during execution is to push the boundary of how long that autonomy stays reliable. Every minute of unsupervised work is leverage — but only if the output is trustworthy when you come back.

How long the agent can run autonomously depends on what you did in the previous two phases. Strong grounding means the agent has the right facts and won't drift into plausible-but-wrong patterns. Precise planning means each orchestration unit is small enough and well-defined enough that the agent doesn't need to re-decide the architecture mid-execution. The better your grounding and planning, the longer the reliable autonomous window.

<DiagramFrame kicker="Methodology" title="Choose supervised or autonomous execution deliberately" size="standard">

  <ExecutionModeComparison />

</DiagramFrame>
### <BabysitEmoji size={22} /> Supervised execution

In supervised mode, you watch the agent work and steer it through intermediate decisions. This is the fallback when grounding is weak, the plan is imprecise, or the blast radius is high. Supervision gives control and early correction, but it blocks your time — the agent is running, and so are you.

Supervised execution is appropriate for:

- authentication, authorization, payment, privacy, or data-loss paths
- database migrations and irreversible operations
- architecture changes
- unfamiliar codebases where you need to build your own mental model while the agent explores
- any task where intermediate choices matter more than final syntax

### Autonomous execution

In autonomous mode, you give the agent a bounded unit, let it run, and review the result later. This is where agentic coding creates real leverage: parallel work, longer productive stretches, and less human attention spent on implementation mechanics.

Autonomous execution is appropriate when:

- grounding is strong — the agent has the right facts
- the plan is precise — the agent knows exactly what to do
- the work unit is small — the agent won't drift over long horizons
- blast radius is limited — mistakes are cheap to revert
- verification is clear — you know how to check the result

The trade-off is delayed discovery. If the agent goes wrong, you find out later. That risk is acceptable only when grounding, planning, and verification are all strong.

### Execution mode rubric

| Work type | Default mode |
|---|---|
| Documentation updates | Autonomous |
| Test generation for existing behavior | Autonomous |
| Small isolated bug fix | Autonomous or lightly supervised |
| Feature touching one module | Hybrid: approve plan, then autonomous |
| Feature crossing module boundaries | Supervised checkpoints |
| Auth, security, payments, personal data | Supervised |
| Database migration | Supervised with explicit human checkpoint |
| Architecture change | Human-led planning, supervised execution |

The advanced pattern is not choosing one mode forever. It is assigning the right level of autonomy per orchestration unit — and knowing that the level you can assign is a function of how well you grounded and planned.

## Phase 4: Verification {#phase-4-verification}

Verification exists because the model is probabilistic. Even with perfect grounding and planning, the agent will make mistakes — missed constraints, hallucinated APIs, locally correct but globally wrong implementations. That is not a failure of the technology; it is the nature of a token prediction system. The model generates the next likely continuation from context. It does not verify its own output against context. You do.

The ownership boundary is fundamental: the model generates candidate work, and you own the decision to accept it. Verification is where that ownership lives. It is not quality assurance bolted on at the end — it is the operator responsibility that makes the entire loop work. Without verification, you are accepting probabilistic output on faith.

Verify from multiple independent angles. A single check — passing tests, a clean build, a quick review — is not enough. The agent can produce output that compiles, passes tests, and still violates architecture, leaks secrets, or solves the wrong problem. Multiple angles catch different failure modes.

### Functional verification

Check whether the artifact does what the plan said it should do:

- happy path behavior
- edge cases
- failure modes
- user-facing contracts
- API compatibility
- data correctness

Be the user when possible. Run the feature, call the endpoint, inspect the UI, trigger errors, and try to break it.

### Automated verification

Run the mechanical checks that produce hard signal:

- tests
- build
- typecheck
- lint
- format
- dependency checks
- security scanners where relevant

Passing automated checks is not proof of correctness. Failing them is proof you are not done.

### Architecture and maintainability verification

Agent output often looks locally reasonable while damaging the system shape. Review for:

- module boundary violations
- duplicated logic
- hidden coupling
- inconsistent error handling
- unnecessary abstractions
- compatibility layers nobody asked for
- dead code or unused dependencies
- code that solves the prompt but not the system problem

This is where senior judgment matters. You are checking whether the implementation belongs in the codebase, not whether it merely compiles.

### Design system and product verification

For UI work, verify the product artifact directly:

- visual alignment with the design system
- responsive behavior
- empty, loading, error, and disabled states
- accessibility basics
- interaction feel
- copy and information hierarchy

Screenshots and browser automation help, but human visual review is still part of the quality gate.

### Security and privacy verification

Treat agent-generated code as untrusted until checked:

- permissions and authorization boundaries
- data exposure
- secret handling
- injection risks
- unsafe dependency additions
- logging of sensitive data
- prompt-injection surfaces for agent-facing systems

Security verification should be planned before execution, not added after a risky diff exists.

### Agent-assisted verification

Use agents to verify agent work, but do not confuse that with ownership transfer.

Useful patterns:

- ask the original agent to self-review against the plan
- use a separate reviewer agent with no access to the implementation reasoning
- run cross-model review for high-risk changes
- ask an agent to search for missing tests, edge cases, and architectural drift
- ask an agent to compare the diff against project conventions

Independent agreement is useful signal. Divergence is even more useful: it tells you the task, plan, or implementation has ambiguity worth inspecting.

<PromptExample>
Review this diff against the approved plan. Check functional correctness, missing edge cases, architecture compliance, maintainability, security risks, test quality, and design-system impact. Separate blocking issues from non-blocking improvements. Do not rewrite code unless asked.
</PromptExample>

### Iterate, regenerate, re-ground, or re-plan

When verification finds problems, choose the right repair loop:

| Finding | Response |
|---|---|
| Local bug, missing edge case, small test gap | Iterate |
| Correct structure but incomplete implementation | Re-execute a smaller unit |
| Agent missed existing patterns or APIs | Re-ground |
| Decomposition or sequencing was wrong | Re-plan |
| Architecture is fundamentally wrong | Regenerate from a corrected plan |
| Confidence is low but no defect is obvious | Verify from another angle |

Code generation is cheap. Do not preserve a bad foundation because the diff looks substantial. Fix the context, plan, or grounding, then regenerate.

## Closing the Loop

The four phases are a control system, and each phase addresses a specific limitation:

- **Grounding** addresses the context problem. The model generates from context — it does not check its output against reality. Grounding ensures the context contains the right facts before the agent acts.
- **Planning** addresses the orchestration problem. Complex work is a sequence of prompts, not one perfect prompt. Planning decomposes the task into bounded units the harness loop can execute.
- **Execution** addresses the autonomy problem. The harness gives the agent autonomy; the operator's job is to push the reliable-autonomy frontier outward through better grounding and planning.
- **Verification** addresses the probabilistic problem. Ownership never moves — the model generates candidates, you accept them. The model will make mistakes. Verification is how you catch them before they ship.

This is the operator loop. You are not trying to personally type every line or review every token. You are designing the conditions under which useful artifacts are likely — grounding the right context, planning the right units, maximizing reliable autonomous execution — then verifying the result from enough angles to own it.

A prompt shapes one interaction. This chapter shows where those interactions fit in the operator loop: grounding queries, orchestration plans, execution instructions, and verification reviews.

---

**Next:** [Chapter 5: Context Engineering](./context-engineering.mdx) — how to keep grounded facts small, timely, and visible enough to use.
