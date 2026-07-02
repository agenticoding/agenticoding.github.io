---
sidebar_position: 2
sidebar_label: 'Four-Phase Workflow'
sidebar_custom_props:
  sectionNumber: 4
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
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

The first three chapters explained the machinery.

[Chapter 1](./chapter-1-how-llms-work.mdx) established the core constraint: the model predicts tokens from the context it receives. [Chapter 2](./chapter-2-how-agents-work.mdx) showed how an agent harness turns that prediction engine into an action loop: prepare context, call the model, execute tools, observe results, and continue. [Chapter 3](./chapter-3-prompting-101.mdx) covered prompt-level control: how to shape one interaction so the model has a clear target, constraints, evidence, and output format.

That is enough to understand how agents work. It is not enough to operate them on production work.

Production tasks are larger than one prompt and longer than one tool call. You need to decide what reality the agent must see, how the work should be split, how much autonomy is safe, and what evidence proves the result is acceptable. Those are operator decisions. They determine whether the agent's work converges on your actual goal or merely produces a plausible artifact.

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

## <MicroscopeEmoji size={28} /> Phase 1: Grounding {#phase-1-grounding}

When you code by hand, you don't work from a blank slate. You have a prior understanding of the codebase — its architecture, its patterns, its conventions. You have Google open in a background tab for framework docs, API references, and migration guides. There's a reason for that: these two sources of knowledge are what you need to code effectively in a given codebase. The same applies to agents. You must deliberately engineer these sources of information into the context to maximize the effectiveness of the agent.

<DiagramFrame kicker="Methodology" title="Grounding distills research into usable context" size="wide">

  <GroundingDistillationDiagram />

</DiagramFrame>
Two sources cover most grounding needs:

- **Code grounding** — how your system works: module responsibilities, integration points, naming conventions, error handling patterns, test contracts, and established invariants. This is the agent's equivalent of your prior understanding of the codebase.
- **Web grounding** — how the external world works: current framework docs, API references, migration guides, security advisories, and production patterns. This is the agent's equivalent of your background tab. The model's training data is stale for fast-moving ecosystems.

A third source, **git history**, comes up in specific tasks — prior migrations, reverted approaches, bug fixes that encode hidden constraints, and architectural decisions captured in commits. It's not always needed, but when it is, it provides institutional knowledge that doesn't exist anywhere else.

Beyond these three, any artifact that encodes relevant knowledge can serve as a grounding source: specs, Jira tickets, emails, presentations, Slack threads, transcripts, design docs. The principle is the same — pull in what the agent needs, nothing more.

These sources are raw and voluminous. A grep across a codebase returns thousands of lines. A web search returns paragraphs of noise. Git history is dense and verbose. Dumping any of this directly into the orchestrator's context floods it with irrelevant tokens and reduces signal-to-noise. The pattern is to use a grounding agent — a sub-agent that searches the raw sources, filters and summarizes what's relevant, then feeds the synthesized answer to the orchestrator. The grounding agent explores extensively in its own context. The orchestrator gets the distilled answer, not the raw search. Claude Code spawns Explore sub-agents for this. [ChunkHound](https://chunkhound.ai/) is built for it. When the setup doesn't have sub-agent support, you first use the agent to create a grounding artifact — a research document saved to a file — then use that artifact in a fresh context to continue into planning and execution.

:::tip
[ChunkHound](https://chunkhound.ai/) is a sister project of this book and implements the grounding agent pattern exactly — it researches code, web, and git history, then returns synthesized findings to the orchestrator. Other tools follow the same general architecture and principles.
:::

Grounding is always happening. If you don't explicitly provide the context, the agent will gather it on its own — a capability called agentic search. Models are actively being benchmarked on this ability; [SWE-bench](https://www.swebench.com), the standard benchmark for coding agents, measures how well agents can autonomously navigate unfamiliar codebases and find the information they need to solve real problems.

But the agent doesn't know what it doesn't know. It will assume it has everything at hand while missing critical knowledge — the naming convention that isn't documented, the constraint from a reverted PR, the integration point in a different service. Worse, the big picture often isn't fully encoded anywhere: why this product choice was made, what alternatives were considered and ruled out, which business constraints shape the solution space, what the team already tried and abandoned. When you ground explicitly, you're filling both kinds of gaps — the ones scattered across the codebase and the ones buried in Slack threads, emails, presentations, and support tickets.

## <BookmarkTabsEmoji size={28} /> Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Planning turns grounded context into an execution shape. It answers three questions: what exactly should change, how should the work be split, and where must a human approve before the agent continues?

A weak plan says: "implement rate limiting." A useful plan defines the intended diff, splits it into subtasks the agent is likely to complete, and places checkpoints before wrong assumptions can propagate.

<CompassEmoji size={22} /> **Plan the scope as a diff.** The agent needs more than a goal. It needs the boundary of the change: what to add, what to remove, what to modify, and what must stay untouched.

<BullseyeEmoji size={22} /> **Plan for reliable execution.** The goal is not to make subtasks as small as possible. The goal is to shape each subtask so the agent can finish it without re-deciding architecture mid-run.

### Define the task as add / remove / change

Scope should be concrete enough that drift is visible. Before execution, make the expected shape of the change explicit:

- **Add** — new behavior, files, tests, docs, routes, UI states, or integration points.
- **Remove** — obsolete code, dead paths, replaced behavior, unused dependencies, or outdated docs.
- **Change** — existing contracts, data flow, module responsibilities, error handling, copy, or user behavior.
- **Do not change** — non-goals, compatibility boundaries, untouched modules, and behavior that must remain stable.

This framing keeps planning tied to the artifact the agent will produce. If the plan cannot say what is being added, removed, changed, and protected, the task is still too vague to execute safely.

### Split into bounded subtasks

Task decomposition is a reliability tool. Each subtask should have clear inputs, clear output, and a verification signal. It should be large enough to produce useful progress, but small enough that the agent does not need to invent the architecture while acting.

Good orchestration units are:

- grounded by specific files, APIs, product constraints, or external facts
- independent when possible, so they can run in parallel or isolated contexts
- sequenced only when one unit genuinely depends on another
- narrow enough to avoid context pollution and scope drift
- complete enough to avoid long chains of tiny dependent steps
- verifiable through tests, build output, review, screenshots, or another explicit signal

For rate limiting, a better decomposition is not twenty micro-steps. It might be: inspect existing middleware and cache patterns; propose the API and behavior boundary; implement the limiter in the established location; add tests for authenticated, anonymous, and exceeded-limit cases; run the relevant checks. Each unit has a purpose, an input, and a stopping point.

### Put HITL checkpoints at propagation boundaries

Human-in-the-loop checkpoints are part of orchestration, not a fallback after the agent has already changed too much. A checkpoint is valuable when it reviews a compact artifact before the next phase depends on it.

Use HITL checkpoints when the next step would make a decision expensive to undo:

| Checkpoint | Use when |
|---|---|
| Approve grounded approach | Solution space is unclear or multiple local patterns compete |
| Approve scope | The task could expand into adjacent cleanup, refactors, or product changes |
| Approve architecture boundary | Module ownership, layering, or data flow may change |
| Approve schema/API contract | External callers, persisted data, or public behavior are affected |
| Approve security-sensitive edits | Auth, permissions, payments, secrets, or personal data are involved |
| Review final diff | Result will ship or be handed to another engineer |

Planning is complete when the next bounded unit is obvious enough that the agent can execute it without re-deciding scope, architecture, or approval boundaries.

<PromptExample>
Create an orchestration plan for adding API rate limiting. Define what to add, remove, change, and leave untouched. Split the work into bounded subtasks with inputs, outputs, dependencies, execution mode, HITL checkpoints, and verification gates. Do not edit files until I approve the plan.
</PromptExample>

## <RobotEmoji size={28} /> Phase 3: Execute {#phase-3-execute}

Execution is about maximizing the time the agent works reliably without you watching.

The harness loop from Chapter 2 gives the agent autonomy: it prepares context, calls the model, executes tools, observes results, and continues. The operator's job during execution is to push the boundary of how long that autonomy stays reliable. Every minute of unsupervised work is leverage — but only if the output is trustworthy when you come back.

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

### <AirplaneEmoji size={22} /> Autonomous execution

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

## <StraightRulerEmoji size={28} /> Phase 4: Verification {#phase-4-verification}

Verification exists because the model is probabilistic. Even with perfect grounding and planning, the agent will make mistakes — missed constraints, hallucinated APIs, locally correct but globally wrong implementations. That is not a failure of the technology; it is the nature of a token prediction system. The model generates the next likely continuation from context. It does not verify its own output against context. You do.

Chapter 1 established the ownership boundary: the model generates candidate work, and you own the decision to accept it. Verification is where that ownership lives. It is not quality assurance bolted on at the end — it is the operator responsibility that makes the entire loop work. Without verification, you are accepting probabilistic output on faith.

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

The four phases are a control system, and each phase addresses a specific limitation the reader learned in the previous chapters:

- **Grounding** addresses the context problem. The model generates from context, not checking against it ([Chapter 1](./chapter-1-how-llms-work.mdx)). Grounding ensures the context contains the right facts before the agent acts.
- **Planning** addresses the orchestration problem. Complex work is a sequence of prompts, not one perfect prompt ([Chapter 3](./chapter-3-prompting-101.mdx)). Planning decomposes the task into bounded units the harness loop can execute ([Chapter 2](./chapter-2-how-agents-work.mdx)).
- **Execution** addresses the autonomy problem. The harness gives the agent autonomy; the operator's job is to push the reliable-autonomy frontier outward through better grounding and planning.
- **Verification** addresses the probabilistic problem. Ownership never moves ([Chapter 1](./chapter-1-how-llms-work.mdx)). The model will make mistakes. Verification is how you catch them before they ship.

This is the operator loop. You are not trying to personally type every line or review every token. You are designing the conditions under which useful artifacts are likely — grounding the right context, planning the right units, maximizing reliable autonomous execution — then verifying the result from enough angles to own it.

[Chapter 3](./chapter-3-prompting-101.mdx) gave you prompt-level controls. This chapter shows where those controls fit in the operator loop: grounding queries, orchestration plans, execution instructions, and verification reviews.

---

**Next:** [Chapter 5: Grounding](./chapter-5-grounding.mdx) — the deep dive into Phase 1: tools, techniques, and how to choose the right grounding loop for the scale of your problem.
