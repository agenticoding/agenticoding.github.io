---
title: 'Reliability Levers'
---

import AgentReliabilityDecayCurve from '@site/src/components/VisualElements/AgentReliabilityDecayCurve';
import ContextQualityLeverDiagram from '@site/src/components/VisualElements/ContextQualityLeverDiagram';
import HITLCheckpointLeverDiagram from '@site/src/components/VisualElements/HITLCheckpointLeverDiagram';
import OrchestrationLeverDiagram from '@site/src/components/VisualElements/OrchestrationLeverDiagram';
import ReliabilityLeversControlPanel from '@site/src/components/VisualElements/ReliabilityLeversControlPanel';
import SamplingLeverDiagram from '@site/src/components/VisualElements/SamplingLeverDiagram';
import UnevenReliabilityDecay from '@site/src/components/VisualElements/UnevenReliabilityDecay';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

Every dependent transformation multiplies risk. An agent run combines model inference, retrieved context, tool results, external systems, intermediate artifacts, and final verification. Each output can become input to the next step, so a small loss early in the chain can shape everything downstream.

A useful first approximation is:

```text
R(n) = p^n
```

If every step succeeds with probability `p`, then all `n` dependent steps succeed with probability `p^n`. At `p = 0.95`, a 20-step chain succeeds only about 36% of the time.

This is a **smooth simplifying model**, not a forecast. It assumes equally difficult steps, stable per-step reliability, independent failures, and a strict definition of full-task success. Real agent work violates all four assumptions. The model is still useful because it makes one operational constraint obvious: adding dependent transformations cannot improve end-to-end reliability on its own.

<DiagramFrame kicker="Reliability levers" title="Dependent transformations multiply risk" size="wide" caption={<>
Under the simplified assumptions, full-task reliability follows R(n) = 0.95ⁿ.
Representative values show how a strong per-step rate compounds across a chain.
</>}>
<AgentReliabilityDecayCurve />
</DiagramFrame>

## Real Decay Is Uneven

Production runs do not lose reliability on a clean exponential schedule. Routine transformations may preserve state for several steps. An ambiguous decision may cause a small loss. A wrong premise can then produce a cascading drop because later steps inherit it.

Those failures are correlated. Once generated output becomes working context, the next step does not start fresh: it reasons from both the useful signal and any distortion already present. A wrong import can lead to the wrong API, then to a coherent fix for the wrong problem.

The smooth baseline and an uneven run describe different things. The baseline exposes the cost of dependency length. The uneven trajectory shows why **where** a loss occurs—and whether it propagates—matters as much as the number of steps.

<DiagramFrame kicker="Reliability levers" title="Real runs plateau, drift, and cascade" size="wide" caption={<>
A smooth baseline is useful for reasoning about chain length. Real runs are
uneven: routine steps may plateau, ambiguity causes local loss, and a sticky
premise can correlate failures across later steps.
</>}>
<UnevenReliabilityDecay />
</DiagramFrame>

This propagation tendency is **failure stickiness**: the chance that a failed step makes a later dependent step more likely to fail. Reliable workflows control both baseline step quality and the distance bad state can travel.

## Classify the Failure Before Changing the Workflow

The controls are not interchangeable. A transient generation miss needs a different response from a missing constraint or a contaminated plan. Retrying an invalid assumption produces repeated guesses; adding context to an overloaded workflow adds more load; continuing past an unresolved high-risk decision turns it into state.

| Failure class            | What it looks like                                                                                   | Pull this lever         |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| Missing or noisy context | The agent cannot reliably identify the relevant facts, constraints, APIs, or code paths              | **Context quality**     |
| Poor work shape          | The run has too many dependent decisions, mixes discovery with execution, or keeps re-deciding scope | **Orchestration**       |
| Noisy generation         | The target is clear, but any single attempt may vary in quality or miss a detail                     | **Independent retries** |
| Propagation risk         | A wrong intermediate decision would contaminate later work or trigger an expensive side effect       | **HITL checkpoint**     |

These four levers change different variables in the system. Context quality raises the quality available to each step. Orchestration changes step difficulty and dependency shape. Independent retries improve a bounded noisy transformation when selection is reliable. HITL checkpoints keep unresolved state from crossing a high-risk boundary.

<DiagramFrame kicker="Reliability levers" title="Four controls target four failure modes" size="wide" caption={<>
Diagnose first, then combine controls deliberately. No single lever covers
missing facts, poor work shape, generation variance, and propagation risk.
</>}>
<ReliabilityLeversControlPanel />
</DiagramFrame>

## 1. Context Quality: Give the Agent the Right Reality

Use this lever when the agent is detached from the actual system. It may invent a cache client instead of using the existing abstraction, follow a generic framework pattern instead of the codebase pattern, or miss a constraint held in tests, docs, or nearby code.

The operator move is selective grounding: load the facts that constrain this task, not every fact available. For a rate-limiting change, useful context includes:

- the existing middleware pattern
- how anonymous and authenticated users are identified
- the current Redis client or cache abstraction
- the API error shape callers expect
- the routes, roles, and failure modes that require protection

[Grounding](./high-level-methodology.md#phase-1-grounding) finds those facts. [Context engineering](./context-engineering.mdx) keeps them usable by controlling placement, size, lifetime, and isolation.

The diagram shows context quality as a filter rather than a larger container: relevant facts enter the work chain while stale or irrelevant history remains outside it.

<DiagramFrame kicker="Reliability levers" title="Better context raises baseline reliability" size="wide" caption={<>
Context quality is selective loading, not maximal loading. Relevant facts feed
the task chain; stale or irrelevant history stays outside the working context.
</>}>
<ContextQualityLeverDiagram />
</DiagramFrame>

This lever raises the starting quality of each step. It does not fix a task that is too broad, a vague target, or a bad assumption that has already propagated.

## 2. Orchestration: Change the Shape of the Work

Use this lever when the agent has enough facts but the work is shaped badly. The run may mix discovery, design, implementation, and cleanup; depend on half-correct intermediate results; or quietly expand into adjacent refactors.

The operator move is to choose the largest unit the agent can complete reliably **without re-deciding the architecture mid-run**. Smaller is not always safer: serial micro-steps create more transformations and handoff points. Oversized tasks push the model past its capability.

For rate limiting, these work shapes behave differently:

- **Too broad:** “Implement rate limiting.”
- **Too fragmented:** “Find middleware. Stop. Find Redis. Stop. Design limiter. Stop. Add one helper. Stop.”
- **Better:** “After grounding, implement the limiter in the existing middleware path, reuse the existing cache abstraction, preserve auth behavior, and add the agreed tests.”

The diagram makes the trade-off explicit: orchestration avoids both one oversized step and an unnecessarily long serial chain.

<DiagramFrame kicker="Reliability levers" title="Orchestration changes task shape" size="wide" caption={<>
Reliable orchestration keeps work inside the model's capability while removing
unnecessary dependent transformations and handoffs.
</>}>
<OrchestrationLeverDiagram />
</DiagramFrame>

Orchestration also removes dependencies. Run independent research in parallel sub-agents rather than one long serial thread. Separate implementation from review when they need different judgment. Stop before code turns a human decision into structure. [Sub-agents](./context-engineering.mdx#sub-agents) are useful because they isolate noisy work and return compact results.

This lever does not fix missing facts or an unclear success condition. Better shape only helps when each unit is grounded and judgeable.

## 3. Independent Retries: Sample, Then Select

Use this lever when the target is clear, the work is cheap to repeat, and a reliable signal can select the best result. Two plans may satisfy the same spec while one is less invasive; one implementation may miss an edge case that another catches.

The operator move has two parts:

1. **Generate meaningfully independent candidates.** Separate contexts are stronger than one thread repeatedly revising its own framing.
2. **Apply independent selection pressure.** Prefer executable tests; use human review for scope and intent; use an LLM judge only when the artifact is bounded and the criteria are explicit.

If a single attempt succeeds with probability `R` and `k` attempts are independent, the chance that at least one succeeds is:

```text
R_eff = 1 − (1 − R)^k
```

At `R = 0.95`, two independent attempts produce an effective step reliability of `0.9975`. The number is illustrative: shared framing and weak judgment destroy the independence that the formula assumes.

The diagram therefore includes both generation and selection. More samples without a trustworthy judge produce more output, not more reliability.

<DiagramFrame kicker="Reliability levers" title="Independent retries need selection pressure" size="wide" caption={<>
Retries improve a bounded noisy step only when attempts are meaningfully
independent and a separate signal can select the best candidate.
</>}>
<SamplingLeverDiagram />
</DiagramFrame>

For rate limiting, retry the bounded plan or implementation step—not the entire contaminated workflow. This lever does not repair weak grounding, bad task shape, or a missing review boundary.

## 4. HITL Checkpoints: Stop Bad State from Propagating {#4-human-in-the-loop-hitl-checkpoints-break-error-propagation}

Use this lever when a wrong assumption would be expensive downstream: before implementation commits to a flawed plan, before scope expands into an unrequested refactor, or before an irreversible external action.

The operator move is a deliberate gate around a compact artifact:

- a short plan before implementation
- a spec before code changes
- a diff summary before merge
- a deployment command before execution
- a fresh-context review before accepting the result

Humans are especially strong at missing constraints, scope enlargement, and decisions that require product, security, architecture, or migration judgment. The checkpoint fails when its review surface is too large to inspect seriously.

The diagram shows the checkpoint blocking inherited failure state and making a validated artifact the start of the next phase.

<DiagramFrame kicker="Reliability levers" title="Human checkpoints reduce failure stickiness" size="wide" caption={<>
A checkpoint works when it blocks propagation and starts the next phase from
a validated artifact—not when it rubber-stamps a noisy thread.
</>}>
<HITLCheckpointLeverDiagram />
</DiagramFrame>

The highest-leverage checkpoints sit at phase boundaries: after grounding, before implementation, after implementation, before merge, and before irreversible actions. A fresh phase should start from the reviewed artifact rather than burying approval in the existing thread. The [manual handoff pattern](./context-engineering.mdx#context-compaction) provides that reset.

This lever does not fix work with no clear review surface. Shrink or split the artifact until a human can judge it quickly.

## Choosing the Right Lever

Diagnose the dominant failure before optimizing:

- **The agent lacked the right facts:** improve context quality.
- **The work shape made drift likely:** change orchestration.
- **The target was clear but one output was noisy:** use independent retries.
- **One bad assumption could poison later work:** insert a HITL checkpoint.

Production workflows usually combine levers. A spec provides context and a review boundary. Tests judge retries and verify execution. Sub-agents change orchestration and isolate context. Handoffs manage context and interrupt propagation.

The constraint is matching each control to a failure mode. More context, decomposition, retries, or review are not universally safer.

## Key Takeaways

- **Dependent transformations multiply risk.** The exponential model is simplified, but chain length remains an operational cost.
- **Real failures are uneven and correlated.** Plateaus, ambiguous decisions, and sticky premises make propagation more important than a smooth average.
- **Context quality raises baseline step quality.** It fixes missing or noisy facts, not poor work shape.
- **Orchestration changes dependency shape.** It avoids both oversized tasks and needless serial chains.
- **Independent retries handle bounded variance.** They require independent candidates and reliable selection.
- **HITL checkpoints contain propagation.** They work at clear boundaries with small, judgeable artifacts.

---

**Next:** [Chapter 8: Spec-Driven Development](./spec-driven-development.md)
