---
title: 'Reliability: Independent Retries'
---

import SamplingLeverDiagram from '@site/src/components/VisualElements/SamplingLeverDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

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

**Next:** [Reliability: HITL Checkpoints](./reliability-hitl-checkpoints.md)
