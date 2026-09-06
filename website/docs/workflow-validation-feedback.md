---
title: 'Validation & Feedback'
---

import ValidationClaimBenchDiagram from '@site/src/components/VisualElements/ValidationClaimBenchDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## Phase 4: Validation {#phase-4-validation}

Agents are probabilistic generators. Even with strong grounding, an approved plan, and disciplined execution, an agent can miss a constraint, invent an API, or produce work that is locally correct but fails in production. A plausible artifact is not evidence that it will hold under the conditions where it must operate.

Validation is how the operator builds measurable confidence in that uncertain process. The agent produces a candidate; the system and the person responsible for the outcome decide whether the evidence is sufficient to accept it. Without validation, acceptance is faith in a likely-looking continuation.

Start before choosing a test or review technique:

1. **State the claim.** What must remain true? For example: a checkout completes correctly after a declined payment, or a generated page remains usable at campaign volume.
2. **Set the tolerance.** How much error, delay, degradation, or manual intervention can this claim tolerate? This is a product decision: higher confidence costs more time and evidence.
3. **Define the operating profile.** Specify the representative environments and conditions in which the claim must hold: real user workflows, data shapes and volume, permissions, dependency failures, retries, and credible malformed or adversarial inputs.
4. **Gather evidence against that profile.** Choose the smallest portfolio of checks whose remaining blind spots the claim can tolerate.

<DiagramFrame kicker="Methodology" title="The claim meets its real world" size="wide" caption="Preset tolerance and representative operating conditions turn a plausible artifact into an evidence-backed acceptance decision.">

  <ValidationClaimBenchDiagram />

</DiagramFrame>

A build, test suite, or reviewer verdict is only useful when it measures part of that predefined claim under representative conditions. Passing checks prove their stated properties; they do not prove requirements nobody expressed.

Use complementary evidence because every technique has blind spots: deterministic checks protect known machine-verifiable contracts; LLM judges extend evaluation where the rubric is explicit but manual review does not scale; people apply situated product and risk judgment; exploratory agents vary credible operating conditions to discover requirements that are not yet encoded. For high-impact claims, collect independent evidence and retain human ownership of the acceptance decision.

Validation continues after release. Controlled exposure, telemetry, sampled review, and rollback test the claim against real behavior. Confirmed failures become new operating-profile conditions and deterministic regression protection.

Evidence should identify what to change next. Do not treat every failed check as an implementation bug: return to the phase that introduced the uncertainty.

| What the evidence shows                                                          | Next action                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| The candidate has a local defect or misses a known edge case                     | Fix that bounded unit, then measure it again.                               |
| The candidate relied on a missing or incorrect codebase fact, API, or constraint | Re-ground before attempting another implementation.                         |
| The proposed solution or task sequence is wrong                                  | Re-plan the work before executing again.                                    |
| The target is clear, but this candidate is unreliable                            | Generate independent candidates and compare them with independent evidence. |
| The evidence conflicts, or accepting an error would be costly                    | Add a human acceptance checkpoint.                                          |
| Exploration or production reveals a confirmed new failure mode                   | Add it to the operating profile and protect it with a regression check.     |

Read [Validation](./validation.md) for the full framework: defining claims and operating profiles, calibrating deterministic checks and LLM judges, manual acceptance, exploratory discovery, and production evidence.

## Closing the Loop

The four phases are a control system, and each phase addresses a specific limitation:

- **Grounding** addresses the context problem. The model generates from context — it does not check its output against reality. Grounding ensures the context contains the right facts before the agent acts.
- **Planning** addresses the orchestration problem. Complex work is a sequence of prompts, not one perfect prompt. Planning decomposes the task into bounded units the harness loop can execute.
- **Execution** addresses the coordination problem. The harness gives each agent run a bounded autonomous window; the operator schedules independent work streams and applies judgment to the next compact artifact that returns.
- **Verification** addresses the probabilistic problem. Ownership never moves — the model generates candidates, you accept them. The model will make mistakes. Verification is how you catch them before they ship.

This is the operator loop. You are not trying to personally type every line or review every token. You are designing the conditions under which useful artifacts are likely — grounding the right context, planning the right units, scheduling bounded execution, then verifying the result from enough angles to own it.

A prompt shapes one interaction. This module shows where those interactions fit in the operator loop — the verification phase after [grounding](./workflow-grounding.md), [planning](./workflow-planning.md), and [execution](./workflow-execution.md).

---

**Next:** [Context Engineering](./context-engineering.mdx)
