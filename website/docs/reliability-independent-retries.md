---
title: 'Sample, Then Select'
---

import SamplingLeverDiagram from '@site/src/components/VisualElements/SamplingLeverDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Independence and judgment have to be real

Use this lever when the target is clear, the work is cheap to repeat, and a reliable signal can select the best result. Two plans may satisfy the same spec while one is less invasive; one implementation may miss an edge case that another catches.

The operator move has two parts:

1. **Generate meaningfully independent candidates.** Separate contexts are stronger than one thread repeatedly revising its own framing.
2. **Apply independent selection pressure.** Prefer executable tests; use human review for scope and intent; use an LLM judge only when the artifact is bounded and the criteria are explicit.

If a single attempt succeeds with probability `R` and `k` attempts are independent, the chance that at least one succeeds is:

```text narration="The independent retry model: when a single attempt succeeds with probability R and you run k independent attempts, the chance that at least one succeeds rises to one minus the quantity one minus R to the k. Independence is the assumption that makes the gain real."
R_eff = 1 − (1 − R)^k
```

At `R = 0.95`, two independent attempts produce an effective step reliability of `0.9975`. The number is illustrative: shared framing and weak judgment destroy the independence that the formula assumes.

The diagram therefore includes both generation and selection. More samples without a trustworthy judge produce more output, not more reliability.

<DiagramFrame kicker="Reliability levers" title="Independent retries need selection pressure" size="wide" narration="Retrying a bounded, noisy step raises its effective reliability only under two conditions. The attempts have to be meaningfully independent — fresh contexts, not one thread revising its own framing — and a separate, trustworthy signal has to pick the best one. A 0.95 chance per attempt becomes 0.9975 across two independent attempts, but shared framing and a weak judge destroy the independence the math assumes. More candidates without real judgment produce more output, not more reliability." caption={<>
Retries improve a bounded noisy step only when attempts are meaningfully
independent and a separate signal can select the best candidate.
</>}>
<SamplingLeverDiagram />
</DiagramFrame>

For rate limiting, retry the bounded plan or implementation step—not the entire contaminated workflow. This lever does not repair weak grounding, bad task shape, or a missing review boundary.

**Next:** [Human Checkpoints](./reliability-hitl-checkpoints.md)
