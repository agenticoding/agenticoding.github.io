---
sidebar_position: 2
sidebar_label: 'Four-Phase Workflow'
sidebar_custom_props:
  sectionNumber: 4
title: 'Four-Phase Workflow'
---

import OperatorCycleDiagram from '@site/src/components/VisualElements/OperatorCycleDiagram';
import ScrollDrivenFigure from '@site/src/components/animations/ScrollDrivenFigure';
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

Lesson 1 taught that LLMs are token prediction systems: context in, predicted tokens out. The model generates from the context you supply — it does not check against it. [Lesson 2](../fundamentals/lesson-2-how-agents-work.mdx) showed how the agent harness wraps that model in a loop: preparing context, calling the model, validating output, executing tools, appending observations, and deciding whether to continue. That is the harness loop — how the agent software is built. [Lesson 3](./lesson-3-prompting-101.mdx) gave you prompt-level controls for shaping single interactions: task targets, constraints, examples, evidence, and output structure.

This lesson moves up one level. The harness loop is the machine. This lesson is the operator loop — how you drive that machine on production work.

The operator loop has four phases:

1. **Grounding** — pull relevant knowledge into context before asking the agent to act. Without it, the model generates from training data patterns instead of your reality. ([Lesson 1](../fundamentals/lesson-1-how-llms-work.mdx): the model generates from context, not checking against it.)
2. **Planning** — orchestrate and split the work into bounded units the agent can execute. Complex tasks are not one prompt; they are a sequence of prompts with clear inputs, outputs, and checkpoints. ([Lesson 3](./lesson-3-prompting-101.mdx): orchestration is the next problem after single-prompt control.)
3. **Execution** — maximize the time the agent works reliably without you watching. The harness gives the agent autonomy; your job is to push the boundary of how long that autonomy stays reliable.
4. **Verification** — catch mistakes the probabilistic machine will inevitably make, even with perfect grounding and planning. Ownership never moves. ([Lesson 1](../fundamentals/lesson-1-how-llms-work.mdx): the model generates candidate work; you own the decision to accept it.)

The industry calls the agent's internal loop Plan-Act-Observe: the model plans its next action, executes it, observes the result, and continues. The four phases above are the operator's workflow around that loop — grounding feeds the right context into each plan step, planning defines the bounds of each act, verification inspects each observation before deciding whether the loop should continue or restart.

## The Four-Phase Workflow

<ScrollDrivenFigure phaseEnd={0.5}>
  <OperatorCycleDiagram />
</ScrollDrivenFigure>

The loop is iterative, not linear. If verification fails because the agent missed an existing pattern, go back to grounding. If the approach is wrong, re-plan. If the plan is right but the implementation is incomplete, re-execute a smaller unit. If the output works but confidence is low, verify from another angle.

The point is not to make the first pass perfect. The point is to know which part of the system failed.

## <MicroscopeEmoji size={28} /> Phase 1: Grounding {#phase-1-grounding-research}

Grounding is pulling relevant knowledge into the context before asking the agent to act.

Lesson 1 established the fundamental limitation: the model generates from context, not checking against it. If the context does not contain the relevant code patterns, API contracts, or architectural constraints, the model will produce output that is statistically plausible but locally wrong — it will use patterns from its training data instead of patterns from your system. Grounding is the direct countermeasure.

Three sources cover most grounding needs:

- **Code grounding** — how your system works: module responsibilities, integration points, naming conventions, error handling patterns, test contracts, and established invariants. This is architectural context, not just file lookup.
- **Web grounding** — how the external world works: current framework docs, API references, migration guides, security advisories, and production patterns. The model's training data is stale for fast-moving ecosystems.
- **Git history grounding** — why your code is shaped the way it is: prior migrations, reverted approaches, bug fixes that encode hidden constraints, and architectural decisions captured in commits.

Grounding is done when the agent can explain the relevant local patterns, external constraints, and risk areas in terms specific to your task — not in generic terms it could have generated from training data alone.

[Lesson 5: Grounding](./lesson-5-grounding.mdx) covers the tools and techniques in detail: agentic search, semantic search, sub-agents, and how to choose the right grounding loop for the scale of the problem.

## <BookmarkTabsEmoji size={28} /> Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Planning is orchestration design. It answers: how should this work be approached, split, sequenced, delegated, checked, and stopped if it goes wrong?

A weak plan says: "implement rate limiting." A useful orchestration plan says which modules are involved, what order to touch them, which changes can run autonomously, which require review, and what evidence will prove success.

<CompassEmoji size={22} /> **Plan before execution.** Vague plans produce vague code. A few minutes spent defining scope, constraints, and verification gates prevents hours of cleaning up plausible but wrong output.

<BullseyeEmoji size={22} /> **Plan around bounded autonomy.** The goal is not unlimited agent freedom. The goal is to give the agent enough autonomy to create leverage while keeping blast radius, review cost, and failure modes under control.

A good plan defines:

- **Scope** — what will change.
- **Non-goals** — what must not change.
- **Grounding inputs** — code, web, and history evidence the agent should use.
- **Orchestration units** — small work packages with clear inputs and outputs.
- **Dependencies** — which units must happen before others.
- **Execution mode** — supervised, autonomous, or hybrid per unit.
- **Human checkpoints** — decisions that require approval before proceeding.
- **Verification gates** — tests, builds, reviews, manual checks, and quality criteria.
- **Rollback or regeneration criteria** — when to patch, when to discard, and when to re-plan.

<PromptExample>
Create an orchestration plan for adding API rate limiting. Include scope, non-goals, relevant code patterns to inspect, work units, dependencies, execution mode per unit, human checkpoints, verification gates, and regenerate-vs-iterate criteria. Do not edit files until I approve the plan.
</PromptExample>

### Human checkpoints are part of the plan

Human review should not be an emergency brake you discover after the agent has already changed twenty files. Decide checkpoints before execution:

| Checkpoint | Use when |
|---|---|
| Approve researched approach | Solution space is unclear |
| Approve architecture boundary | Module ownership may change |
| Approve schema/API contract | External callers or data shape are affected |
| Approve security-sensitive edits | Auth, permissions, payments, secrets, or personal data are involved |
| Review final diff | Result will ship or be handed to another engineer |

Planning is complete when the next action is obvious enough that the agent can execute a bounded unit without re-deciding the architecture.

## <RobotEmoji size={28} /> Phase 3: Execute {#phase-3-execute}

Execution is about maximizing the time the agent works reliably without you watching.

The harness loop from Lesson 2 gives the agent autonomy: it prepares context, calls the model, executes tools, observes results, and continues. The operator's job during execution is to push the boundary of how long that autonomy stays reliable. Every minute of unsupervised work is leverage — but only if the output is trustworthy when you come back.

How long the agent can run autonomously depends on what you did in the previous two phases. Strong grounding means the agent has the right facts and won't drift into plausible-but-wrong patterns. Precise planning means each orchestration unit is small enough and well-defined enough that the agent doesn't need to re-decide the architecture mid-execution. The better your grounding and planning, the longer the reliable autonomous window.

<ExecutionModeComparison />

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

Lesson 1 established the ownership boundary: the model generates candidate work, and you own the decision to accept it. Verification is where that ownership lives. It is not quality assurance bolted on at the end — it is the operator responsibility that makes the entire loop work. Without verification, you are accepting probabilistic output on faith.

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

- **Grounding** addresses the context problem. The model generates from context, not checking against it ([Lesson 1](../fundamentals/lesson-1-how-llms-work.mdx)). Grounding ensures the context contains the right facts before the agent acts.
- **Planning** addresses the orchestration problem. Complex work is a sequence of prompts, not one perfect prompt ([Lesson 3](./lesson-3-prompting-101.mdx)). Planning decomposes the task into bounded units the harness loop can execute ([Lesson 2](../fundamentals/lesson-2-how-agents-work.mdx)).
- **Execution** addresses the autonomy problem. The harness gives the agent autonomy; the operator's job is to push the reliable-autonomy frontier outward through better grounding and planning.
- **Verification** addresses the probabilistic problem. Ownership never moves ([Lesson 1](../fundamentals/lesson-1-how-llms-work.mdx)). The model will make mistakes. Verification is how you catch them before they ship.

This is the operator loop. You are not trying to personally type every line or review every token. You are designing the conditions under which useful artifacts are likely — grounding the right context, planning the right units, maximizing reliable autonomous execution — then verifying the result from enough angles to own it.

[Lesson 3](./lesson-3-prompting-101.mdx) gave you prompt-level controls. This lesson shows where those controls fit in the operator loop: grounding queries, orchestration plans, execution instructions, and verification reviews.

---

**Next:** [Lesson 5: Grounding](./lesson-5-grounding.mdx) — the deep dive into Phase 1: tools, techniques, and how to choose the right grounding loop for the scale of your problem.
