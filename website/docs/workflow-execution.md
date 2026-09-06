---
title: 'Execution'
---

import ExecutionPortfolioDiagram from '@site/src/components/VisualElements/ExecutionPortfolioDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 3: Execute {#phase-3-execute}

Execution is where the human coordinates several in-flight operator loops.

A plan admits one bounded unit into execution: it names the scope, dependency, expected artifact, stop condition, and validation route. The harness then gives that unit an autonomous window — it prepares context, calls the model, executes tools, observes results, and continues. While Agent A uses that window to implement, the operator monitors the active streams at a depth matched to each agent's risk profile and to their own capacity to context-switch: stay close to high-risk work, check lower-risk work periodically, and let bounded low-risk work run unattended.

Think in the gaps between agent actions. Start Agent A on an approved implementation unit. While it searches, edits, and runs tests, review Agent B's plan. Then help Agent C get ready for its task: point it to the design system, clarify the user flow, or answer the product question it cannot infer. When Agent A finishes, compare what it produced with what the plan asked for and decide what happens next. That is **phase concurrency**: keeping several agents moving while allocating attention where risk and available context-switching capacity justify it.

<DiagramFrame kicker="Methodology" title="Execution keeps human judgment ahead of agent work" size="wide" caption="The operator monitors agents as they work, adjusting attention to each agent's risk profile and to their own capacity for context switching.">

  <ExecutionPortfolioDiagram />

</DiagramFrame>

### Choose how to stay involved

An approved plan gives the agent a clear target. The right monitoring depth depends on the task's risk profile and how much context switching you can sustain.

| Approach                  | What you do                                                                                                                                           | Good fit                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Let it run**            | Give the agent a bounded task, work on something else, then meet at the end to compare what it produced with the plan.                                | A small, familiar change with clear checks.                                       |
| **Work alongside it**     | Watch the steps, answer questions, and steer decisions as they happen.                                                                                | A new area of the codebase, an architecture decision, or security-sensitive work. |
| **Check in periodically** | Move between active agent tabs, watch each one briefly, and confirm its latest work still points in the right direction. Leave it alone when it does. | A longer task where the final result would be too late to discover a wrong turn.  |

Use the lightest approach that gives you enough confidence. If the task is clear and easy to check, letting it run creates time to review another plan, prepare the next task, or validate finished work. If the agent will make decisions you need to own, stay close. For longer work, rotate through the active tabs: look at the latest actions, confirm the direction, and move on unless the agent needs help.

The productivity gain is not that every agent task finishes faster than a skilled human would finish it. It comes from using the time between those check-ins for other useful work, without losing sight of what each agent is building.

---

**Next:** [Validation](./workflow-validation-feedback.md)
