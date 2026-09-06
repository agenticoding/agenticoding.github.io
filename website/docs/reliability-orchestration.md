---
title: 'Reliability: Orchestration'
---

import OrchestrationLeverDiagram from '@site/src/components/VisualElements/OrchestrationLeverDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

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

Orchestration also removes dependencies. Run independent research in parallel sub-agents rather than one long serial thread. Separate implementation from review when they need different judgment. Stop before code turns a human decision into structure. [Sub-agents](./sub-agent-delegation.md#sub-agents) change orchestration by letting a single task be decomposed across multiple specialized agents — each running on the LLM and system prompt optimized for its slice — rather than overloading one context, isolating noisy work and reducing dependency length in the parent chain.

This lever does not fix missing facts or an unclear success condition. Better shape only helps when each unit is grounded and judgeable.

**Next:** [Reliability: Independent Retries](./reliability-independent-retries.md)
