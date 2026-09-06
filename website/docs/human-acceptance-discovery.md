---
title: 'Human Acceptance and Discovery'
---

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

## Key Takeaways

- **Humans own acceptance.** Automation prepares evidence; the person responsible for the outcome decides whether the evidence is sufficient. This is where designers and product managers sit alongside engineers.
- **Situated judgment is irreplaceable.** Deterministic checks and LLM judges cannot weigh product feel, brand tone, or domain trade-offs — the human decides.
- **Use agent variance for discovery, not regression.** Explore credible operational stress with bounded blast radius, reproduce confirmed findings, and encode them as deterministic checks.

---

**Next:** [Continuous Validation](./continuous-validation.md)
