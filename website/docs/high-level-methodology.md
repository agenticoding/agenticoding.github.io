---
title: 'Four-Phase Workflow'
---

import OperatorCycleDiagram from '@site/src/components/VisualElements/OperatorCycleDiagram';
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

---

**Next:** [Grounding](./workflow-grounding.md)
