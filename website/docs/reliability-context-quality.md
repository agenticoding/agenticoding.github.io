---
title: 'Reliability: Context Quality'
---

import ContextQualityLeverDiagram from '@site/src/components/VisualElements/ContextQualityLeverDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## 1. Context Quality: Give the Agent the Right Reality

Use this lever when the agent is detached from the actual system. It may invent a cache client instead of using the existing abstraction, follow a generic framework pattern instead of the codebase pattern, or miss a constraint held in tests, docs, or nearby code.

The operator move is selective grounding: load the facts that constrain this task, not every fact available. For a rate-limiting change, useful context includes:

- the existing middleware pattern
- how anonymous and authenticated users are identified
- the current Redis client or cache abstraction
- the API error shape callers expect
- the routes, roles, and failure modes that require protection

[Grounding](./workflow-grounding.md#phase-1-grounding) finds those facts. [Context engineering](./context-engineering.mdx) keeps them usable by controlling placement, size, lifetime, and isolation.

The diagram shows context quality as a filter rather than a larger container: relevant facts enter the work chain while stale or irrelevant history remains outside it.

<DiagramFrame kicker="Reliability levers" title="Better context raises baseline reliability" size="wide" caption={<>
Context quality is selective loading, not maximal loading. Relevant facts feed
the task chain; stale or irrelevant history stays outside the working context.
</>}>
<ContextQualityLeverDiagram />
</DiagramFrame>

This lever raises the starting quality of each step. It does not fix a task that is too broad, a vague target, or a bad assumption that has already propagated.

**Next:** [Reliability: Orchestration](./reliability-orchestration.md)
