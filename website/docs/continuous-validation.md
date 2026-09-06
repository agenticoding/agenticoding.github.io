---
title: 'Continuous Validation'
---

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

- **Release continues validation.** Canary exposure, telemetry, review, and rollback update the operating profile after launch.
- **Field signals are validation inputs, not post-launch anecdotes.** Confirmed production failures and newly observed usage belong in the operating profile and regression corpus.
- **Validation should change the workflow.** Map each finding to the right repair loop — re-ground, re-plan, generate-and-judge, add a human checkpoint, or encode the finding as a deterministic regression.

---

**Next:** [Writing Agent-Friendly Code](./agent-friendly-code.md)
