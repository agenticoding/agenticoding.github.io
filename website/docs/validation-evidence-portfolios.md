---
title: 'Validation Evidence Portfolios'
---

The [validation discipline](./validation.md) gathers evidence that a candidate artifact meets its stated operational claim. Because the output generator is probabilistic, no single check can prove that claim — evidence must come as a portfolio: the smallest combination of complementary techniques whose collective blind spots you can accept.

## Build a Portfolio of Complementary Evidence

No single validation technique catches every possible failure. Choose the smallest combination of techniques whose collective blind spots you can accept for the claim at hand. Four classes of technique — **deterministic checks**, **LLM judges**, **manual validation**, and **exploratory agents** — each reveal different failure modes and complement one another's blind spots.

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

## Key Takeaways

- **Evidence must be representative.** Test realistic workflows, data, dependency failures, and recovery behavior — not convenient internals alone.
- **Protect promises, not construction.** A deterministic check should remain valid after an internal refactor. Checks coupled to implementation details impose a repair tax every time the code improves.
- **Research what's known before defining the profile.** Web search surfaces industry failure modes, conventions, and anti-patterns that production traces won't reveal until after an incident.

---

**Next:** [LLM Judges](./llm-judges.md)
