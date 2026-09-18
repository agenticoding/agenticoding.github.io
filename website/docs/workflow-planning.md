---
title: 'Planning'
---

import PlanningContractCheckpointDiagram from '@site/src/components/VisualElements/PlanningContractCheckpointDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 2: Plan / Orchestrate {#phase-2-plan-orchestrate}

Grounding gives the agent facts. It does not decide the shape of the change.

After grounding, the agent may know the middleware pattern, the product constraint, and the existing tests. It still does not know which trade-off you want, which cleanup is out of scope, or which boundary must not move. If execution starts there, those choices get made inside the diff.

Planning is the pause between knowing and doing. The plan itself is a checkpoint: a small execution contract that a human can approve, reject, or correct before the agent turns ambiguity into code.

<DiagramFrame kicker="Methodology" title="A plan is an approved execution contract" size="wide" caption="The operator reviews scope, unit, and verification before the agent turns intent into code." narration="Grounding gives the agent facts. It still doesn't know which trade-off you want, what's out of scope, or which boundary must not move. If execution starts there, those decisions get made inside the diff, which is the most expensive place to discover them. A plan is the pause in between: a small execution contract that states the scope, the next bounded unit, and how it will be verified, plus the checkpoints where the risky calls are reviewed. The human approves, rejects, or revises it before any code exists, and only an approved plan unlocks execution. A plan is a checkpoint, not a formality, because it makes intent inspectable before the agent turns ambiguity into code.">

  <PlanningContractCheckpointDiagram />

</DiagramFrame>

The useful planning question is not "what is every step?" It is "what decision would be expensive to discover only after code exists?" Answer that before execution.

A good plan makes two things visible:

- **Scope:** what to add, remove, change, and protect.
- **Unit:** the next bounded piece of work, with its input, output, dependency, and verification signal.

For rate limiting, that might be enough: add limiter behavior in the existing middleware location, use the established cache abstraction, preserve current auth behavior, and test authenticated users, anonymous users, and exceeded limits. That is not a full implementation plan. It is a reviewed handoff from planning to execution.

Older prompt advice treated plans as todo lists so the model would remember what to do. That still helps, but it is not the main value. A plan works because it makes intent inspectable before the agent turns ambiguity into code.

Planning is complete when execution can begin from a reviewed contract instead of an unresolved conversation. The reliability mechanics behind task sizing and why phase-boundary review works belong in [Shaping the Work](./reliability-orchestration.md) and [Human Checkpoints](./reliability-hitl-checkpoints.md#stop-bad-state-from-propagating).

---

**Next:** [Execution](./workflow-execution.md)
