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

## Build a Portfolio of Complementary Evidence

No single validation technique catches every possible failure. Choose the smallest combination of techniques whose collective blind spots you can accept for the claim at hand. Four classes of technique — **deterministic checks**, **LLM judges**, **manual validation**, and **exploratory agents** — each reveal different failure modes and complement one another's blind spots. What follows breaks down each technique in detail.

### What Deterministic Checks Protect

Deterministic checks are the cheapest, most reliable signal — but only for properties that can be stated as machine-verifiable invariants. They validate user-facing contracts, schemas, build output, and known regressions. They _cannot_ validate ambiguous quality attributes or detect missing requirements.

The critical discipline with deterministic checks is to protect **promises, not construction**. A deterministic check should remain valid after an internal refactor. If a refactor breaks a check, the check was coupled to code rather than to a behavioral contract. Checks that assert internal call sequences, private state, or mock interactions with implementation details impose a repair tax every time the code improves.

Mock true system boundaries — paid third-party APIs, remote services, dependencies that cannot safely run in a test environment — not internal implementation details. An authentication test using a real test database, password hashing, and session construction catches broken interactions that mock sequences cannot.

Deterministic evidence useful in practice includes:

- builds, type checks, linters, formatters, and dependency or security scanners
- behavior and invariant tests for known requirements
- consumer or provider contract tests at service boundaries
- critical end-to-end journeys using representative data
- migration, performance, and reliability checks when those properties are part of the claim

Passing automated checks proves only that the system met the properties the checks expressed. A missing assertion is an unvalidated requirement.

## Research Industry Knowledge Before Building Your Profile

The cheapest validation input is what the industry already knows.

Before writing a single check, surface known failure modes, conventions, and anti-patterns in your domain via web search. This takes minutes and often reveals patterns your own production traces won't surface until after an incident. Cross-reference multiple sources, check dates, and treat community consensus as evidence rather than gospel.

Use findings to shape the operating profile, choose appropriate evidence techniques, calibrate LLM judges against established rubrics, and avoid reinventing validation that the community has already learned.

If web search discovered a pattern the operating profile did not anticipate, add it. The profile should reflect the full landscape of what could go wrong, not just what has gone wrong in your specific deployment.

## LLM Judges as Measurement Equipment

An LLM judge asks a model to assess an artifact against a supplied rubric. It is useful when a deterministic assertion is too narrow but reviewing every artifact manually is too expensive — which is most real-world validation scenarios.

Examples include:

- ranking generated landing pages against a campaign brief
- checking whether an agent plan fulfills approved scope and avoids prohibited changes
- triaging support responses for grounding, completeness, and policy compliance
- finding likely architectural drift or missing edge cases in a diff
- prioritizing production traces that deserve human review

LLMs are better at discriminating between explicit options or criteria than at open-ended evaluation. Prefer classification, pairwise comparison, or a score against named criteria over "is this good?" See OpenAI's [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

### Noise Is Inherent — Design Around It

A judge is another probabilistic model. The same input with the same rubric can yield different verdicts on separate calls. This is not a bug; it is a consequence of probability.

**Noise** (random variation across calls) is different from **bias** (consistent skew toward long answers, familiar formats, or self-preference). Rubric calibration reduces bias; it does not eliminate noise. The variance between calls is the measurement error of this instrument.

Design the rubric to minimize bias, then treat noise via repeated measurement:

- **Atomic criteria.** Separate factual grounding, contract fulfillment, completeness, concision, and safety into distinct axes. A single holistic quality score is impossible to audit or improve.
- **Require evidence.** Return criterion-level results with references to the relevant requirement, source, diff, or trace. A bare score is noise masquerading as signal.
- **Calibrate against people.** Compare verdicts against a representative set of human-labeled examples. Disagreement may reveal an ambiguous rubric, a weak judge, or a domain where automation is inappropriate.
- **Control positional bias.** In pairwise evaluation, randomize candidate order and evaluate both orderings. Use a different model family from the generator to reduce self-preference. Instruct the rubric to ignore length and format unless they are criteria.
- **Sample multiple independent judges for high-accuracy claims.** A single LLM call on one model can flip its verdict on a second run. When accuracy matters, run N independent calls (different model families, temperatures, or repeated calls with the same configuration) and aggregate via majority vote — the same pattern as "generate independent candidates and judge them with independent evidence" from [Reliability Levers](./reliability-levers.md). Track agreement rates across calls: frequent disagreement suggests an ambiguous rubric.

The choice of how many judges to sample is a direct expression of your tolerance. Near the throughput end of the spectrum, a single judge is pragmatic. Near the accuracy end, you need a panel — because the consequence of a false accept is radically higher than the cost of the extra calls.

### Version and Monitor Your Instrument

Pin the judge model, rubric, and prompt as versioned measurement equipment. Recalibrate when any component changes, and periodically sample verdicts for human review. Allow `needs_review` as an output rather than forcing a verdict — route low-confidence, high-impact, or conflicting evidence to a person.

Do not use an LLM judge as the only gate when a deterministic check can express the same property, when the model lacks the necessary domain expertise, or when the consequence of error requires human acceptance. It can rank, triage, and extend review capacity; it cannot transfer acceptance ownership.

## Humans Own the Acceptance Decision

Manual validation means a human actually experiences and inspects the artifact:

- run the workflow as a user
- inspect empty, loading, failure, and recovery states
- assess visual hierarchy, copy, accessibility, and interaction feel
- compare a meaningful diff with the approved scope
- check domain trade-offs an agent cannot infer from the repository

This is not a ceremonial final click-through. It is the check for "technically green, operationally wrong." What humans bring that no automation can replace is situated judgment — the ability to weigh ambiguous requirements, assess product feel, and accept residual risk.

This is where designers and product managers sit at the validation table alongside engineers. A deterministic check can confirm a button renders; it cannot judge whether the interaction feels right for the user. An LLM judge can flag a copy change; it cannot weigh brand tone against conversion goals. The person responsible for the outcome owns the acceptance decision.

An LLM can prepare evidence for this review — surface differences, flag anomalies, prioritize what needs attention. It cannot replace the person responsible for accepting the residual risk.

## Use Agent Variance for Discovery

Deterministic checks protect known requirements. Agents help discover requirements you did not know to encode.

The goal is not random destruction. Vary conditions that correspond to credible operational stress: malformed input, unexpected navigation, tool timeouts, partial responses, rapid retries, latency, or stale state. An agent's natural divergence makes it useful for exploring these variations. It also makes it unsuitable as the only regression mechanism.

Follow the discipline from the [Principles of Chaos Engineering](https://principlesofchaos.org/):

1. Define the expected steady state or invariant first.
2. Choose a relevant condition from the operating profile to vary.
3. Bound the environment, permissions, time, cost, and blast radius.
4. Capture the input, trace, environment, and observed failure.
5. Reproduce and confirm the defect.
6. Turn a confirmed finding into a deterministic regression check, contract, or product requirement.

For example, an agent exploring checkout may discover that rapid navigation after a declined payment leaves the cart in an impossible state. The discovery is not complete when the agent reports it. Reproduce it, decide the intended behavior, fix it, and encode that behavior in a deterministic check. This closes the loop: agents explore the unknown; deterministic checks protect the newly known.

## Validation Continues in Production

A pre-release operating profile is never complete. Release controls continue validation under real conditions without treating every user as a test subject:

- **shadow mode** runs a new agent against real inputs without performing side effects
- **canaries** expose a small, reversible portion of traffic to a new version
- **telemetry** measures task success, latency, cost, recovery behavior, policy violations, and user corrections
- **sampled review** sends representative and anomalous traces to LLM judges and people
- **rollback** limits the cost when evidence contradicts the release claim

Confirmed production failures and newly observed usage belong in the operating profile and regression corpus. Field signals are not post-launch anecdotes; they are the next input to validation. This is where product managers and operations engineers feed real behavior back into the validation loop — the profile grows more accurate with every confirmed incident.

## Interpret the Evidence, Then Choose the Repair Loop

Validation should change the workflow, not merely attach a score to it.

| Finding                                                       | Next move                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A local defect or missing known edge case                     | Fix the bounded unit and revalidate                                      |
| The agent missed a codebase fact, API, or constraint          | Re-ground                                                                |
| The solution shape or sequencing is wrong                     | Re-plan                                                                  |
| One candidate is noisy but the target is clear                | Generate independent candidates and judge them with independent evidence |
| Evidence conflicts or the consequence is high                 | Add a human checkpoint                                                   |
| Exploration or field telemetry finds a confirmed failure mode | Encode it as a deterministic regression check and update the profile     |

This maps directly to the controls in [Reliability Levers](./reliability-levers.md): improve context for missing facts, change orchestration for bad work shape, retry independently for noisy generation, and use human checkpoints to stop a bad assumption from propagating.

## Key Takeaways

- **Validation establishes an operational claim.** Define intended use, credible stress, and tolerance before choosing checks. The throughput/accuracy tradeoff is a product decision with engineering consequences — everyone at the table owns the calibration.
- **Generated artifacts are candidates.** Probability does not guarantee they survive their operating conditions. The question is always "how confident should we be?" not "does it pass?"
- **Evidence must be representative.** Test realistic workflows, data, dependency failures, and recovery behavior — not convenient internals alone.
- **Use a portfolio, not a single oracle.** Deterministic checks, LLM judges, humans, and exploration each reveal different failures. Cover your blind spots deliberately.
- **Research what's known before defining the profile.** Web search surfaces industry failure modes, conventions, and anti-patterns that production traces won't reveal until after an incident.
- **Treat LLM judges as calibrated instruments.** Noise is inherent. Design rubrics to minimize bias, then use repeated independent measurements to estimate noise. Sample multiple judges when accuracy matters.
- **Humans own acceptance.** Automation prepares evidence; the person responsible for the outcome decides whether the evidence is sufficient.
- **Use agent variance for discovery, then encode what you find.** Explore → confirm → convert to deterministic protection.
- **Release continues validation.** Canary exposure, telemetry, review, and rollback update the operating profile after launch.

---

**Next:** [Chapter 10: Writing Agent-Friendly Code](./agent-friendly-code.md)
