---
title: 'Selecting Reliability Controls'
---

import ReliabilityLeversControlPanel from '@site/src/components/VisualElements/ReliabilityLeversControlPanel';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

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

Production workflows rarely pull one lever in isolation. A [spec](./spec-driven-development.md) supplies context and a review boundary, [validation](./validation.md) judges retries and verifies execution, [sub-agents](./sub-agent-delegation.md) change orchestration and isolate context, and [context compaction](./context-compaction.md) manages what carries over between runs. Match each control to a failure mode — more context, decomposition, retries, or review are not universally safer.

**Next:** [Spec-Driven Development](./spec-driven-development.md)
