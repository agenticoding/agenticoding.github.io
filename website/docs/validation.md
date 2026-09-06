---
title: 'Validation'
---

import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';
import SpeedAccuracyTradeoff from '@site/src/components/VisualElements/SpeedAccuracyTradeoff';
import ValidationEvidenceLifecycle from '@site/src/components/VisualElements/ValidationEvidenceLifecycle';

A car manufacturer cannot justify "good for 100,000 miles" by inspecting a design drawing. An aircraft maker cannot assume wings stay attached because a prototype completed one flight. Both claims need evidence under representative conditions.

Agents need the same discipline. An LLM can write a migration, redesign a screen, or prepare a production change, but it cannot prove that its output survives the conditions it will meet after acceptance. The harness can run tools and enforce gates; it does not change that boundary: the model generates, while the system and operator decide whether to accept the result.

> Validation gathers evidence that a candidate artifact meets its stated operational claim and quality tolerance.

This is not about writing better tests. Tests verify deterministic code against known requirements. Validation in the agent context is fundamentally different: the output generator is probabilistic, so correctness cannot be proven, only evidenced. The question shifts from "does it pass?" to "how confident should we be?"

## Define "Good Enough" Before Choosing a Single Check

Start with the claim, not the test suite.

A claim describes what must remain true: "this checkout completes correctly despite a declined payment," "this landing-page factory publishes usable pages at campaign volume," or "this control path never issues an unsafe command." The **operating profile** describes the representative conditions under which that claim must hold:

- The workflows users actually run most often — and the ones they run first after a deploy
- Operations that are expensive, irreversible, or gated behind permissions
- Realistic data shapes, volumes, latencies, and environment constraints the system will meet in production
- What happens when a dependency is slow, partial, or stale — and when the agent retries
- Inputs and paths that are malformed, adversarial, or explicitly out of scope

Build the profile from production traces, support incidents, and domain knowledge — not from what's convenient to mock. Web search extends your reach cheaply: research industry conventions, known failure modes, community post-mortems, and established benchmarks to discover what the profile should cover. A test suite that covers easy internals but misses the actual workload proves nothing about the claim.

Then define the **tolerance**: how much error, delay, degradation, or manual intervention is acceptable for this claim. The fundamental tradeoff is between **throughput** and **accuracy** — most workloads fall somewhere between those poles.

<DiagramFrame kicker="Calibration" title="Precision costs throughput" size="wide" caption={<>Higher accuracy costs decision time; higher speed accepts more variation. Choose the position your claim can tolerate.</>}>
<SpeedAccuracyTradeoff />
</DiagramFrame>

Even the throughput end still needs validation: a broken form, false claim, or inaccessible page is not acceptable merely because the campaign moves fast. The accuracy end demands much stronger evidence because the cost of an undetected defect is radically higher. Most workloads sit between these poles — calibrate your position by deciding how much manual intervention per artifact the claim can tolerate.

The throughput/accuracy tradeoff is not solely an engineering decision — it is a product and business decision that determines how the engineering system is built. A product manager owning a campaign factory will calibrate differently than one shipping industrial control software. Designers have a stake too: a high-throughput validation pipeline can only scale if the evaluation rubric captures the design qualities the team cares about. The claim, profile, and tolerance should be written into the [feature spec](./spec-driven-development.md) before any agent runs — the agent acts against what the spec already established, not a fresh interpretation per execution.

<DiagramFrame kicker="Validation lifecycle" title="Turn the claim into evidence before release" size="wide" caption={<>A release claim determines the operating profile and evidence plan. Field signals update that profile rather than ending validation.</>}>
<ValidationEvidenceLifecycle />
</DiagramFrame>

Four classes of technique — **deterministic checks**, **LLM judges**, **manual validation**, and **exploratory agents** — reveal different failure modes and complement one another's blind spots. The next pages break down each technique in detail, starting with [Validation Evidence Portfolios](./validation-evidence-portfolios.md).

## Key Takeaways

- **Validation establishes an operational claim.** Define intended use, credible stress, and tolerance before choosing checks. The throughput/accuracy tradeoff is a product decision with engineering consequences — everyone at the table owns the calibration.
- **Generated artifacts are candidates.** Probability does not guarantee they survive their operating conditions. The question is always "how confident should we be?" not "does it pass?"
- **Use a portfolio, not a single oracle.** Deterministic checks, LLM judges, humans, and exploration each reveal different failures. Cover your blind spots deliberately.

---

**Next:** [Validation Evidence Portfolios](./validation-evidence-portfolios.md)
