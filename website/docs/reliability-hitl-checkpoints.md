---
title: 'Reliability: HITL Checkpoints'
---

import HITLCheckpointLeverDiagram from '@site/src/components/VisualElements/HITLCheckpointLeverDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

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

The highest-leverage checkpoints sit at phase boundaries: after grounding, before implementation, after implementation, before merge, and before irreversible actions. A fresh phase should start from the reviewed artifact rather than burying approval in the existing thread. The [manual handoff pattern](./context-compaction.md#context-compaction) provides that reset.

This lever does not fix work with no clear review surface. Shrink or split the artifact until a human can judge it quickly.

**Next:** [Selecting Reliability Controls](./selecting-reliability-controls.md)
