---
title: 'Spec-Driven Development'
---

import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';
import SpecExecutionRunsDiagram from '@site/src/components/VisualElements/SpecExecutionRunsDiagram';

A feature spec is a **reviewable expression of intent**. It counts only where the responsible human makes the decisions.

An agent can research the problem, draft the artifact, challenge assumptions, revise the language, and propose scope. But its proposals are probability, not intent. The human owns the intent by working it at the gate — clarifying, fixing, adjusting, rejecting — until the agent's probability becomes a decision they can defend.

That decision-making makes the spec a human-in-the-loop checkpoint. Without it, the agent turns ambiguity into code: scope, trade-offs, integration choices, and edge-case behavior get decided inside the diff. A spec moves those decisions off the diff — the most expensive review surface, one only qualified engineers can afford — to a point where any reviewer can reject the direction without unwinding an implementation.

The artifact has two jobs:

- Give humans a compact surface for judging intent, boundaries, risk, and evidence.
- Give agents a stable target across multiple plans and execution runs.

A spec nobody reads carefully is not a checkpoint. It is a ritual.

## Spec vs. Plan

[Four-Phase Workflow](./high-level-methodology.md) uses a plan as the reviewed contract for one execution run. A feature spec operates one level above it.

| Artifact           | Scope                | Primary question                          | Typical content                                         |
| ------------------ | -------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Feature spec**   | The whole change     | What must be true when this work is done? | Intent, boundaries, constraints, trade-offs, evidence   |
| **Execution plan** | The next bounded run | What should the agent do next?            | Steps, files, commands, and validation for current code |

One spec may feed several plans:

<DiagramFrame kicker="Execution boundaries" title="One stable spec, several bounded runs" size="wide" caption="The approved feature spec remains the human-approved contract. Every run re-checks against the code state left by the preceding run before making its next plan.">
  <SpecExecutionRunsDiagram />
</DiagramFrame>

The spec stays above mechanics that can be decided from current code. Each plan grounds again because the codebase changes after every run.

## Make Intent Reviewable

A useful spec contains enough information for a reviewer to decide whether the proposed change is right, not merely whether the prose looks complete. Depending on the uncertainty, that might include:

- the problem and intended outcome
- scope boundaries and non-goals
- system or product constraints
- consequential trade-offs and rejected alternatives
- observable acceptance criteria
- unresolved questions that must not become agent guesses

Acceptance criteria set the floor: what must be true. Boundaries and non-goals set the ceiling: what the work must not absorb. Meeting the floor by shipping unapproved extras still violates the intent.

The point is not the shape, format, or length of the spec. It is intent and boundaries as clear as possible — and as easy to review efficiently as possible. Reviewers must be able to tell what the human approved from what the evidence demands and what the agent proposes; how you mark it is up to you.

The right shape is the smallest artifact that preserves the intent and the risky boundaries. Format, length, and drafting process should follow the case rather than a canonical template. An empty section makes reviewers wonder whether it applies or was skipped.

## Key Takeaways

- **Human ownership attaches to decisions, not documents.** Approval establishes ownership only when responsible humans see and choose significant boundaries and additions.
- **A spec is a checkpoint, not a template.** Its shape and length follow uncertainty, risk, and review cost. The right spec is the smallest artifact that preserves intent and risky boundaries.
- **Specs and plans control different scopes.** The spec coordinates the whole change; each plan controls one grounded execution run.

---

**Next:** [Spec Review Cost](./spec-review-cost.md)
